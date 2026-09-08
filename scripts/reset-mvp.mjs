import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const local = dotenv.parse(await readFile(path.join(workspace, '.env'), 'utf8'));

if ((local.NODE_ENV || 'development') === 'production') throw new Error('reset:mvp is disabled when NODE_ENV=production');
if (!local.DATABASE_URL || !local.UPLOAD_ROOT || !local.ARTIFACT_ROOT) throw new Error('DATABASE_URL, UPLOAD_ROOT, and ARTIFACT_ROOT are required');

function resolveLocalRoot(value, name) {
  const root = path.resolve(workspace, 'backend', value);
  const runtimeRoot = path.resolve(workspace, '.runtime') + path.sep;
  if (!root.startsWith(runtimeRoot) || root === path.resolve(workspace, '.runtime')) {
    throw new Error(`${name} must point inside the workspace .runtime directory`);
  }
  return root;
}

async function clearContents(root) {
  await mkdir(root, { recursive: true });
  for (const entry of await readdir(root)) await rm(path.join(root, entry), { recursive: true, force: true });
}

const uploadRoot = resolveLocalRoot(local.UPLOAD_ROOT, 'UPLOAD_ROOT');
const artifactRoot = resolveLocalRoot(local.ARTIFACT_ROOT, 'ARTIFACT_ROOT');
const pool = new pg.Pool({ connectionString: local.DATABASE_URL, max: 1 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE documents SET active_run_id = NULL WHERE active_run_id IS NOT NULL');
  for (const sql of [
    'DELETE FROM relationships',
    'DELETE FROM fact_evidence',
    'DELETE FROM document_chunk_blocks',
    'DELETE FROM document_chunks',
    'DELETE FROM processing_issues',
    'DELETE FROM facts',
    'DELETE FROM document_blocks',
    'DELETE FROM entity_aliases',
    'DELETE FROM predicate_aliases',
    'DELETE FROM entities',
    'DELETE FROM predicates',
    'DELETE FROM processing_runs',
    'DELETE FROM documents',
  ]) await client.query(sql);
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}

await clearContents(uploadRoot);
await clearContents(artifactRoot);

const port = Number(local.PORT || 3000);
const endpoints = ['/api/documents', '/api/facts', '/api/relationships'];
for (const endpoint of endpoints) {
  const response = await fetch(`http://127.0.0.1:${port}${endpoint}`);
  if (!response.ok) throw new Error(`${endpoint} returned HTTP ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body) || body.length !== 0) throw new Error(`${endpoint} is not empty after reset`);
}

console.log('MVP reset complete: database-derived data, uploads, and artifacts cleared.');
console.log('Verified empty: /api/documents, /api/facts, /api/relationships');