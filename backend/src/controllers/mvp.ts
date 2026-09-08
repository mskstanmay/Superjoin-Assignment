import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from 'express';
import multer from 'multer';
import type { Config } from '../config/index.js';
import type { Database } from '../repositories/database.js';
import { resolveStorageKey } from '../storage/keys.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20_000_000, files: 1 } });

function json(value: unknown): string { return JSON.stringify(value); }

async function ingest(db: Database, config: Config, documentId: string, runId: string, leaseToken: string, storageKey: string, sha256: string) {
  const response = await fetch(new URL('/process', config.PROCESSING_SERVICE_URL), {
    method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(config.PROCESSING_TIMEOUT_SECONDS * 1000),
    body: json({ contract_version: '1.0', request_id: randomUUID(), document_id: documentId, run_id: runId, lease_token: leaseToken,
      storage_key: storageKey, sha256, versions: { pipeline: 'mvp', schema_version: '1.0', conversion: 'docling-2', chunking: 'mvp-1', normalization: 'mvp-1', model: config.LLM_MODEL || null, prompt: null },
      limits: { max_pages: 100, max_bytes: 20_000_000, timeout_seconds: config.PROCESSING_TIMEOUT_SECONDS, chunk_token_budget: 2048 } }),
  });
  const processBody = await response.json() as { artifacts?: Array<{ storage_key: string }>; counts?: { pages_processed: number }; status?: string; error?: { message: string } };
  if (!response.ok || !processBody.artifacts?.[0]) throw new Error(processBody.error?.message || 'Processing failed');
  const artifactPath = resolveStorageKey(config.ARTIFACT_ROOT, processBody.artifacts[0].storage_key);
  const manifest = JSON.parse(await readFile(artifactPath, 'utf8')) as { blocks: any[]; chunks: any[]; facts: any[]; evidence: any[]; pages: number };
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const block of manifest.blocks) await client.query(
      `INSERT INTO document_blocks(id, run_id, document_id, local_ref, label, original_text, structure, parent_block_id, section, reading_order, provenance)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [block.id, runId, documentId, block.local_ref, block.label, block.original_text, block.structure, block.parent_block_id, json(block.section), block.reading_order, json(block.provenance)]);
    for (const chunk of manifest.chunks) {
      await client.query(`INSERT INTO document_chunks(id, run_id, chunk_index, contextualized_text, token_count, chunk_policy_version) VALUES($1,$2,$3,$4,$5,$6)`,
        [chunk.id, runId, chunk.chunk_index, chunk.contextualized_text, chunk.token_count, chunk.chunk_policy_version]);
      for (const [position, blockId] of chunk.block_ids.entries()) await client.query(
        `INSERT INTO document_chunk_blocks(chunk_id, block_id, run_id, position) VALUES($1,$2,$3,$4)`, [chunk.id, blockId, runId, position]);
    }
    for (const fact of manifest.facts) {
      await client.query(`INSERT INTO facts(id, run_id, document_id, candidate_key, assertion_text, subject_original, subject_entity_id, predicate_original, predicate_id, value, time, qualifiers, polarity, modality, confidence, uncertainty, quality_state)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'accepted')`,
        [fact.id, runId, documentId, fact.candidate_key, fact.assertion_text, fact.subject_original, fact.subject_entity_id, fact.predicate_original, fact.predicate_id, fact.value, fact.time, fact.qualifiers, fact.polarity, fact.modality, fact.confidence, json(fact.uncertainty)]);
    }
    for (const evidence of manifest.evidence) await client.query(`INSERT INTO fact_evidence(id, fact_id, block_id, run_id, document_id, role, selector, selector_key, quote, provenance_selector, validation_status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'validated')`, [evidence.id, evidence.fact_id, evidence.block_id, runId, documentId, evidence.role, evidence.selector, json(evidence.selector), evidence.quote, json(evidence.provenance)]);
    await client.query(`UPDATE processing_runs SET status='completed', stage='extraction', facts_published_at=now(), ended_at=now(), updated_at=now() WHERE id=$1`, [runId]);
    await client.query(`UPDATE documents SET page_count=$2, status='completed', active_run_id=$3, updated_at=now() WHERE id=$1`, [documentId, manifest.pages, runId]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  await compareFacts(db, runId);
}

async function compareFacts(db: Database, reasoningRunId: string) {
  const facts = await db.query(`SELECT f.*, d.original_filename FROM facts f JOIN documents d ON d.id=f.document_id WHERE f.quality_state='accepted'`);
  const rows = facts.rows as Array<{ id: string; document_id: string; subject_original: string; predicate_original: string; value: any; time: any }>;
  for (let leftIndex = 0; leftIndex < rows.length; leftIndex += 1) for (let rightIndex = leftIndex + 1; rightIndex < rows.length; rightIndex += 1) {
    const left = rows[leftIndex]; const right = rows[rightIndex];
    if (left.document_id === right.document_id) continue;
    const subjectMatch = left.subject_original.toLowerCase().includes(right.subject_original.toLowerCase()) || right.subject_original.toLowerCase().includes(left.subject_original.toLowerCase());
    const predicateMatch = left.predicate_original.toLowerCase() === right.predicate_original.toLowerCase();
    if (!subjectMatch && !predicateMatch) continue;
    const factA = left.id < right.id ? left : right; const factB = left.id < right.id ? right : left;
    const aValue = factA.value?.normalized; const bValue = factB.value?.normalized;
    let type: 'CORROBORATED' | 'CONTRADICTED' | 'RECONCILED' | 'UNCERTAIN' = 'UNCERTAIN';
    let explanation = 'The facts share a possible subject or predicate, but their context is insufficient for a stronger conclusion.';
    let outcome = 'unknown';
    if (aValue != null && bValue != null && String(aValue) === String(bValue)) { type = 'CORROBORATED'; outcome = 'aligned'; explanation = 'The normalized values agree after deterministic unit normalization.'; }
    else if (aValue != null && bValue != null && factA.value?.kind === 'number' && factB.value?.kind === 'number') { type = 'CONTRADICTED'; outcome = 'different'; explanation = 'The facts appear to describe the same claim, but their normalized numeric values differ.'; }
    const inputHash = createHash('sha256').update(json({ a: factA, b: factB })).digest('hex');
    await db.query(`INSERT INTO relationships(id, fact_a_id, fact_b_id, type, explanation, dimension_comparison, confidence, confidence_source, uncertainty, supporting_evidence_ids, reasoning_run_id, reasoning_version, model_version, prompt_version, input_hash)
      VALUES($1,$2,$3,$4,$5,$6,$7,'rule',$8,'[]',$9,'mvp-1',NULL,NULL,$10) ON CONFLICT DO NOTHING`,
      [randomUUID(), factA.id, factB.id, type, explanation, json([{ dimension: 'value', fact_a: aValue, fact_b: bValue, outcome, explanation, evidence_ids: [] }]), type === 'UNCERTAIN' ? 0.35 : 0.75, json(['LLM reasoning is not configured for this local run.']), reasoningRunId, inputHash]);
  }
}

export function uploadHandler(db: Database, config: Config): RequestHandler[] {
  return [upload.single('file'), async (request, response, next) => {
    try {
      const file = request.file;
      if (!file || file.mimetype !== 'application/pdf' || file.buffer.subarray(0, 5).toString() !== '%PDF-') return response.status(415).json({ error: { code: 'INVALID_PDF', message: 'Upload a valid PDF file.', request_id: response.locals.requestId, retryable: false } });
      const sha256 = createHash('sha256').update(file.buffer).digest('hex');
      const existing = await db.query('SELECT id, original_filename, status FROM documents WHERE sha256=$1', [sha256]);
      if (existing.rowCount) return response.status(200).json({ reused: true, document: existing.rows[0] });
      const documentId = randomUUID(); const runId = randomUUID(); const leaseToken = randomUUID(); const storageKey = `documents/${documentId}.pdf`;
      const storagePath = resolveStorageKey(config.UPLOAD_ROOT, storageKey);
      await mkdir(path.dirname(storagePath), { recursive: true }); await writeFile(storagePath, file.buffer);
      await db.query(`INSERT INTO documents(id, original_filename, sha256, storage_key, content_type, size_bytes, status, active_run_id) VALUES($1,$2,$3,$4,'application/pdf',$5,'processing',NULL)`, [documentId, file.originalname, sha256, storageKey, file.size]);
      await db.query(`INSERT INTO processing_runs(id, document_id, status, stage, lease_token, pipeline_version, schema_version, conversion_version, chunk_policy_version, normalization_version, started_at) VALUES($1,$2,'processing','document_understanding',$3,'mvp','1.0','docling-2','mvp-1','mvp-1',now())`, [runId, documentId, leaseToken]);
      try { await ingest(db, config, documentId, runId, leaseToken, storageKey, sha256); }
      catch (error) {
        await db.query(`UPDATE processing_runs SET status='failed', ended_at=now(), diagnostics=$2 WHERE id=$1`, [runId, json({ message: error instanceof Error ? error.message : String(error) })]);
        await db.query(`UPDATE documents SET status='failed', updated_at=now() WHERE id=$1`, [documentId]);
        return response.status(500).json({ error: { code: 'PROCESSING_FAILED', message: 'PDF processing failed; inspect the document status and processing diagnostics.', request_id: response.locals.requestId, retryable: true } });
      }
      return response.status(201).json({ id: documentId, status: 'completed' });
    } catch (error) {
      if (config.NODE_ENV === 'development') console.error(JSON.stringify({ stage: 'upload', request_id: response.locals.requestId,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) } }));
      return next(error);
    }
  }];
}

export const documentsHandler: RequestHandler = async (request, response, next) => { try { const db = request.app.locals.db as Database; const result = await db.query(`SELECT d.*, json_build_object('status', d.status, 'stage', r.stage, 'counts', json_build_object('pages_processed', COALESCE(d.page_count,0), 'pages_total', d.page_count, 'chunks_processed', (SELECT count(*) FROM document_chunks c WHERE c.run_id=d.active_run_id), 'facts_accepted', (SELECT count(*) FROM facts f WHERE f.document_id=d.id AND f.quality_state='accepted'), 'facts_rejected', 0, 'comparisons_completed', 0, 'comparisons_failed', 0)) AS processing FROM documents d LEFT JOIN processing_runs r ON r.id=d.active_run_id ORDER BY d.created_at DESC`); response.json(result.rows); } catch (error) { next(error); } };
export const documentHandler: RequestHandler = async (request, response, next) => { try { const db = request.app.locals.db as Database; const result = await db.query(`SELECT d.*, json_build_object('status', d.status, 'stage', r.stage, 'counts', json_build_object('pages_processed', COALESCE(d.page_count,0), 'pages_total', d.page_count, 'chunks_processed', (SELECT count(*) FROM document_chunks c WHERE c.run_id=d.active_run_id), 'facts_accepted', (SELECT count(*) FROM facts f WHERE f.document_id=d.id AND f.quality_state='accepted'), 'facts_rejected', 0, 'comparisons_completed', 0, 'comparisons_failed', 0)) AS processing FROM documents d LEFT JOIN processing_runs r ON r.id=d.active_run_id WHERE d.id=$1`, [request.params.id]); if (!result.rowCount) return response.sendStatus(404); response.json(result.rows[0]); } catch (error) { next(error); } };

export function factsHandler(db: Database): RequestHandler { return async (request, response, next) => { try { const filters: string[] = []; const values: unknown[] = []; for (const [key, column] of [['document','document_id'],['subject','subject_original'],['predicate','predicate_original']] as const) if (request.query[key]) { values.push(request.query[key]); filters.push(`${column} ILIKE $${values.length}`); } const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''; const result = await db.query(`SELECT f.*, d.original_filename FROM facts f JOIN documents d ON d.id=f.document_id ${where} ORDER BY f.created_at DESC`, values.map(value => String(value).includes('%') ? value : `%${value}%`)); response.json(result.rows); } catch (error) { next(error); } }; }
export function factHandler(db: Database): RequestHandler { return async (request, response, next) => { try { const result = await db.query(`SELECT f.*, d.original_filename, COALESCE(json_agg(json_build_object('id',e.id,'quote',e.quote,'role',e.role,'page',e.provenance_selector->0->>'physical_page','document_id',e.document_id)) FILTER (WHERE e.id IS NOT NULL),'[]') AS evidence FROM facts f JOIN documents d ON d.id=f.document_id LEFT JOIN fact_evidence e ON e.fact_id=f.id WHERE f.id=$1 GROUP BY f.id,d.original_filename`, [request.params.id]); if (!result.rowCount) return response.sendStatus(404); response.json(result.rows[0]); } catch (error) { next(error); } }; }
export function relationshipsHandler(db: Database): RequestHandler { return async (_request, response, next) => { try { const result = await db.query(`SELECT r.*, fa.assertion_text AS fact_a, fb.assertion_text AS fact_b, da.original_filename AS document_a, db.original_filename AS document_b FROM relationships r JOIN facts fa ON fa.id=r.fact_a_id JOIN facts fb ON fb.id=r.fact_b_id JOIN documents da ON da.id=fa.document_id JOIN documents db ON db.id=fb.document_id ORDER BY r.created_at DESC`); response.json(result.rows); } catch (error) { next(error); } }; }
export function relationshipHandler(db: Database): RequestHandler { return async (request, response, next) => { try { const result = await db.query(`SELECT r.*, row_to_json(fa) AS fact_a, row_to_json(fb) AS fact_b FROM relationships r JOIN facts fa ON fa.id=r.fact_a_id JOIN facts fb ON fb.id=r.fact_b_id WHERE r.id=$1`, [request.params.id]); if (!result.rowCount) return response.sendStatus(404); response.json(result.rows[0]); } catch (error) { next(error); } }; }