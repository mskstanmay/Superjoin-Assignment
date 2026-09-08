import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createDatabase } from '../src/repositories/database.js';
import { migrate } from '../src/repositories/migrations.js';

test('real PostgreSQL: migration replay, ownership, history and pair constraints', async () => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(url, 'TEST_DATABASE_URL is required; database tests never silently skip');
  const admin = createDatabase(url);
  const schema = `test_${randomUUID().replaceAll('-', '')}`;
  await admin.query(`CREATE SCHEMA ${schema}`);
  const isolated = new URL(url);
  isolated.searchParams.set('options', `-csearch_path=${schema}`);
  const db = createDatabase(isolated.toString());
  try {
    assert.equal((await db.query('SELECT 1 AS connected')).rows[0].connected, 1);
    await migrate(db);
    await migrate(db);
    assert.equal((await db.query('SELECT count(*) FROM schema_migrations')).rows[0].count, '1');
    const tables = (await db.query('SELECT tablename FROM pg_tables WHERE schemaname = $1', [schema])).rows.map(row => row.tablename);
    for (const table of ['documents','processing_runs','document_blocks','document_chunks','document_chunk_blocks','facts','fact_evidence','entities','entity_aliases','predicates','predicate_aliases','relationships','processing_issues']) assert.ok(tables.includes(table), table);

    const docA = randomUUID(), docB = randomUUID(), runA = randomUUID(), runB = randomUUID();
    const addDoc = (id: string, hash: string) => db.query("INSERT INTO documents(id,original_filename,sha256,storage_key,content_type,size_bytes) VALUES($1,'fixture.pdf',$2,$3,'application/pdf',671)", [id, hash, `documents/${id}.pdf`]);
    const addRun = (id: string, doc: string) => db.query("INSERT INTO processing_runs(id,document_id,pipeline_version,schema_version,conversion_version,chunk_policy_version,normalization_version) VALUES($1,$2,'test','1.0','test','test','test')", [id, doc]);
    await addDoc(docA, 'a'.repeat(64));
    await addDoc(docB, 'b'.repeat(64));
    await assert.rejects(addDoc(randomUUID(), 'a'.repeat(64)), /unique/);
    await addRun(runA, docA);
    await addRun(runB, docB);
    await assert.rejects(addRun(randomUUID(), docA), /unique/);
    await assert.rejects(db.query('UPDATE documents SET active_run_id=$1 WHERE id=$2', [runA, docA]), /published/);
    await assert.rejects(db.query('UPDATE documents SET active_run_id=$1 WHERE id=$2', [runB, docA]), /published|foreign key/);

    const blockA = randomUUID(), blockB = randomUUID();
    const addBlock = (id: string, doc: string, run: string) => db.query(`INSERT INTO document_blocks(id,run_id,document_id,local_ref,label,original_text,reading_order,provenance)
      VALUES($1,$2,$3,$4,'text','Example collection has 12 items.',0,'[{"physical_page":1}]')`, [id, run, doc, `#/texts/${id}`]);
    await addBlock(blockA, docA, runA);
    await addBlock(blockB, docB, runB);
    await assert.rejects(addBlock(randomUUID(), docB, runA), /foreign key/);
    const factA = randomUUID(), factB = randomUUID(), factSame = randomUUID();
    const addFact = (id: string, doc: string, run: string) => db.query(`INSERT INTO facts(id,run_id,document_id,candidate_key,assertion_text,subject_original,predicate_original,value,time,polarity,modality,quality_state)
      VALUES($1,$2,$3,$4,'Example collection has 12 items.','Example collection','contains','{"kind":"number","normalized":"12"}','{}','positive','asserted','accepted')`, [id, run, doc, id]);
    await addFact(factA, docA, runA);
    await addFact(factB, docB, runB);
    await addFact(factSame, docA, runA);
    const addEvidence = (fact: string, block: string, doc: string, run: string) => db.query(`INSERT INTO fact_evidence(id,fact_id,block_id,run_id,document_id,role,selector,selector_key,quote,provenance_selector,validation_status)
      VALUES($1,$2,$3,$4,$5,'assertion','{"kind":"block"}','block','Example collection has 12 items.','[{"physical_page":1}]','validated')`, [randomUUID(), fact, block, run, doc]);
    await addEvidence(factA, blockA, docA, runA);
    await assert.rejects(addEvidence(factA, blockB, docA, runA), /foreign key/);
    await addEvidence(factB, blockB, docB, runB);
    const addPair = (a: string, b: string, label = 'CORROBORATED') => db.query(`INSERT INTO relationships(id,fact_a_id,fact_b_id,type,explanation,dimension_comparison,confidence_source,reasoning_run_id,reasoning_version,input_hash)
      VALUES($1,$2,$3,$4,'Authored test','[]','rule',$5,'test',$6)`, [randomUUID(), a, b, label, runB, 'c'.repeat(64)]);
    const [a, b] = [factA, factB].sort();
    await addPair(a, b);
    await assert.rejects(addPair(a, b), /unique/);
    await assert.rejects(addPair(b, a), /check constraint/);
    await assert.rejects(addPair(...[factA, factSame].sort() as [string, string]), /cross-document/);
    await assert.rejects(addPair(a, b, 'TRUE'), /check constraint/);

    await db.query("UPDATE processing_runs SET status='completed', facts_published_at=now() WHERE id=$1", [runA]);
    await db.query('UPDATE documents SET active_run_id=$1 WHERE id=$2', [runA, docA]);
    const newRun = randomUUID();
    await addRun(newRun, docA);
    assert.equal((await db.query('SELECT active_run_id FROM documents WHERE id=$1', [docA])).rows[0].active_run_id, runA);
    await assert.rejects(db.query('UPDATE documents SET active_run_id=$1 WHERE id=$2', [newRun, docA]), /published/);
    await db.query("UPDATE processing_runs SET facts_published_at=now(), status='completed' WHERE id=$1", [newRun]);
    await db.query('UPDATE documents SET active_run_id=$1 WHERE id=$2', [newRun, docA]);
    assert.equal((await db.query('SELECT count(*) FROM facts WHERE run_id=$1', [runA])).rows[0].count, '2');
    assert.equal((await db.query('SELECT count(*) FROM relationships')).rows[0].count, '1');
  } finally {
    await db.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
});
