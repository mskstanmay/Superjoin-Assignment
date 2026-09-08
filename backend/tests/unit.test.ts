import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import request from 'supertest';
import dotenv from 'dotenv';
import { validateContract } from '@superjoin/contracts';
import { parseConfig } from '../src/config/index.js';
import { resolveStorageKey } from '../src/storage/keys.js';
import { createApp } from '../src/app.js';
import type { Database } from '../src/repositories/database.js';

const example = dotenv.parse(readFileSync(new URL('../../.env.example', import.meta.url)));
const cases = JSON.parse(readFileSync(new URL('../../shared/contract-fixtures/cases.json', import.meta.url), 'utf8'));
for (const fixture of cases) test(`contract: ${fixture.name}`, () => {
  if (fixture.valid) assert.doesNotThrow(() => validateContract(fixture.contract, fixture.payload));
  else assert.throws(() => validateContract(fixture.contract, fixture.payload));
});

test('required configuration and example configuration', () => {
  assert.throws(() => parseConfig({}), /DATABASE_URL/);
  assert.equal(parseConfig(example).CONVERSION_CONCURRENCY, 1);
  assert.throws(() => parseConfig({ ...example, JOB_LEASE_SECONDS: '5' }), /twice the heartbeat/);
  assert.throws(() => parseConfig({ ...example, DATABASE_URL: 'https://example.test' }), /PostgreSQL/);
});

test('storage keys reject traversal and Windows paths', () => {
  for (const key of ['../secret.pdf', 'a/../../secret.pdf', 'C:/secret.pdf', '/secret.pdf', 'a\\secret.pdf', 'a/%2e%2e.pdf']) {
    assert.throws(() => resolveStorageKey('/storage', key));
  }
  assert.match(resolveStorageKey('/storage', 'documents/example.pdf'), /example\.pdf$/);
});

test('health reflects real HTTP dependency status and safely handles errors', async () => {
  let healthy = true;
  let databaseHealthy = true;
  const processing = createServer((_req, res) => {
    res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ service: 'processing', status: 'ok', contract_version: '1.0', checks: {} }));
  });
  await new Promise<void>(resolve => processing.listen(0, '127.0.0.1', resolve));
  const address = processing.address();
  assert.ok(address && typeof address !== 'string');
  const config = parseConfig({ ...example, PROCESSING_SERVICE_URL: `http://127.0.0.1:${address.port}`, LOG_LEVEL: 'silent' });
  const db = { query: async () => {
    if (!databaseHealthy) throw new Error('Database unavailable');
    return { rows: [{ connected: 1 }] };
  } } as unknown as Database;
  const app = createApp(config, db);
  try {
    const health = await request(app).get('/health').expect(200);
    validateContract('Health', health.body);
    healthy = false;
    const degraded = await request(app).get('/health').expect(503);
    assert.equal(degraded.body.checks.processing, 'unavailable');
    healthy = true;
    databaseHealthy = false;
    const dbDown = await request(app).get('/health').expect(503);
    assert.equal(dbDown.body.checks.database, 'unavailable');
    databaseHealthy = true;
    const missing = await request(app).get('/missing').expect(404);
    validateContract('ApiError', missing.body);
    const malformed = await request(app).post('/missing').set('Content-Type', 'application/json').send('{"secret":').expect(400);
    assert.equal(malformed.body.error.code, 'INVALID_JSON');
    assert.ok(!JSON.stringify(malformed.body).includes('secret'));
  } finally {
    await new Promise<void>((resolve, reject) => processing.close(error => error ? reject(error) : resolve()));
  }
});
