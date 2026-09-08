// Creates a local example-derived env with a random development DB password.
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const template = readFileSync(new URL('.env.example', root), 'utf8');
const content = template.replaceAll('CHANGE_ME_LOCAL_PASSWORD', randomBytes(24).toString('hex'))
  .replace('@127.0.0.1:5432/', '@127.0.0.1:55432/');
writeFileSync(new URL('.env', root), content, { flag: 'wx', mode: 0o600 });
console.log('Created ignored .env for native PostgreSQL on port 55432; existing files are never overwritten.');
