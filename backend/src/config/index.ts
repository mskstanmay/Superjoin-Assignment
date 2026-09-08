import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const positive = (fallback: number) => z.coerce.number().int().positive().default(fallback);
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: positive(3000),
  DATABASE_URL: z.string().url().refine(v => /^postgres(ql)?:\/\//.test(v), 'must be a PostgreSQL URL'),
  PROCESSING_SERVICE_URL: z.string().url().refine(v => /^https?:\/\//.test(v), 'must be HTTP(S)'),
  UPLOAD_ROOT: z.string().min(1),
  ARTIFACT_ROOT: z.string().min(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CONVERSION_CONCURRENCY: positive(1),
  LLM_CONCURRENCY: positive(2),
  JOB_HEARTBEAT_SECONDS: positive(10),
  JOB_LEASE_SECONDS: positive(60),
  JOB_MAX_ATTEMPTS: positive(3),
  PROCESSING_TIMEOUT_SECONDS: positive(300),
  HEALTH_TIMEOUT_MS: positive(3000),
  LLM_PROVIDER: z.string().default(''),
  LLM_MODEL: z.string().default(''),
}).superRefine((value, context) => {
  if (value.JOB_LEASE_SECONDS <= value.JOB_HEARTBEAT_SECONDS * 2) {
    context.addIssue({ code: 'custom', path: ['JOB_LEASE_SECONDS'], message: 'must exceed twice the heartbeat interval' });
  }
  if (Boolean(value.LLM_PROVIDER) !== Boolean(value.LLM_MODEL)) {
    context.addIssue({ code: 'custom', path: ['LLM_MODEL'], message: 'set provider and model together, or leave both empty' });
  }
});
export type Config = z.infer<typeof schema>;
export function parseConfig(env: Record<string, string | undefined>): Config {
  const result = schema.safeParse(env);
  if (!result.success) throw new Error(`Invalid backend configuration: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  return result.data;
}
export function loadConfig(): Config {
  dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
  return parseConfig(process.env);
}
