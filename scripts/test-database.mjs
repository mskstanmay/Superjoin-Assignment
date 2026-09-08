// Run integration tests against a unique disposable schema, never an entire DB.
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
const root = new URL('../', import.meta.url);
const envPath = new URL('.env', root);
const local = existsSync(envPath) ? dotenv.parse(readFileSync(envPath)) : {};
const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || local.DATABASE_URL;
if (!url) throw new Error('Set TEST_DATABASE_URL or DATABASE_URL before running database tests');
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', 'backend/tests/database.test.ts'], {
  cwd: fileURLToPath(root), env: { ...process.env, TEST_DATABASE_URL: url }, stdio: 'inherit', windowsHide: true,
});
process.exitCode = result.status ?? 1;
