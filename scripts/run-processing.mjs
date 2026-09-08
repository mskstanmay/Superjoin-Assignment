// Native launcher: reads ONLY processing-owned values from root .env.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';

const root = new URL('../', import.meta.url);
const envPath = new URL('.env', root);
const local = existsSync(envPath) ? dotenv.parse(readFileSync(envPath)) : {};
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/^(DATABASE_|POSTGRES_|PG(?:PASSWORD|USER|HOST|PORT|DATABASE|SERVICE|PASSFILE|SERVICEFILE|SSLPASSWORD|HOSTADDR))/.test(key)) delete env[key];
}
const allowed = ['UPLOAD_ROOT', 'ARTIFACT_ROOT', 'MODEL_CACHE_DIR', 'LLM_PROVIDER', 'LLM_MODEL', 'LLM_API_KEY',
  'LIVE_LLM_ENABLED', 'LLM_CONCURRENCY', 'LLM_MAX_OUTPUT_TOKENS', 'CONVERSION_CONCURRENCY', 'DOCLING_DO_OCR', 'DOCLING_DO_TABLE_STRUCTURE',
  'MAX_PDF_PAGES', 'MAX_UPLOAD_BYTES', 'PROCESSING_TIMEOUT_SECONDS', 'CHUNK_TOKEN_BUDGET', 'LOG_LEVEL'];
for (const key of allowed) if (local[key] !== undefined && env[key] === undefined) env[key] = local[key];
const executable = new URL(process.platform === 'win32' ? 'processing/.venv/Scripts/python.exe' : 'processing/.venv/bin/python', root);
if (!existsSync(executable)) throw new Error('Run uv sync --directory processing first');
const child = spawn(fileURLToPath(executable), ['-m', 'uvicorn', 'app.main:create_app', '--factory', '--host', '127.0.0.1', '--port', '8000'], {
  cwd: fileURLToPath(new URL('processing/', root)), env, stdio: 'inherit', windowsHide: true,
});
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
