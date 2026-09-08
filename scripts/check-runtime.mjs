import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateContract } from '@superjoin/contracts';

for (const [name, url] of [['backend', 'http://127.0.0.1:3000/health'], ['frontend proxy', 'http://127.0.0.1:5173/backend/health']]) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  assert.equal(response.status, 200, `${name} health`);
  const body = validateContract('Health', await response.json());
  assert.equal(body.checks.database, 'ok');
  assert.equal(body.checks.processing, 'ok');
  console.log(`${name}: Node → PostgreSQL and Node → Python OK`);
}
const page = await fetch('http://127.0.0.1:5173/');
assert.equal(page.status, 200);
assert.match(await page.text(), /Superjoin/);
console.log('Frontend HTML served');
// Python is intentionally not public in Compose. Set URL only for native checks.
if (process.env.NATIVE_PROCESSING_URL) {
  const fixtures = JSON.parse(readFileSync(new URL('../shared/contract-fixtures/cases.json', import.meta.url), 'utf8'));
  for (const [route, contract] of [['process', 'ProcessRequest'], ['reason', 'ReasonRequest']]) {
    const payload = fixtures.find(f => f.name === `valid-${contract}`).payload;
    const response = await fetch(`${process.env.NATIVE_PROCESSING_URL}/${route}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    assert.equal(response.status, 501);
    const body = validateContract('ApiError', await response.json());
    assert.equal(body.error.code, 'STAGE_NOT_IMPLEMENTED');
    console.log(`${route}: validated request, explicit 501, no fake result`);
  }
}
