import type { Health } from '@superjoin/contracts';
import { validateContract } from '@superjoin/contracts';
import type { Database } from '../repositories/database.js';
import type { Config } from '../config/index.js';

export async function getHealth(db: Pick<Database, 'query'>, config: Config): Promise<Health> {
  const [database, processing] = await Promise.allSettled([
    db.query('SELECT 1 AS connected'),
    fetch(new URL('/health', config.PROCESSING_SERVICE_URL), { signal: AbortSignal.timeout(config.HEALTH_TIMEOUT_MS) })
      .then(async response => {
        if (!response.ok) throw new Error('Processing unavailable');
        const body = validateContract('Health', await response.json()) as Health;
        if (body.service !== 'processing' || body.status !== 'ok') throw new Error('Processing unhealthy');
      }),
  ]);
  return {
    service: 'backend', contract_version: '1.0',
    status: database.status === 'fulfilled' && processing.status === 'fulfilled' ? 'ok' : 'degraded',
    checks: {
      database: database.status === 'fulfilled' ? 'ok' : 'unavailable',
      processing: processing.status === 'fulfilled' ? 'ok' : 'unavailable',
      job_runner: 'not_implemented',
    },
  };
}
