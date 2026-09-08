import type { RequestHandler } from 'express';
import type { Config } from '../config/index.js';
import type { Database } from '../repositories/database.js';
import { getHealth } from '../services/health.js';
export function healthHandler(db: Database, config: Config): RequestHandler {
  return async (_request, response) => {
    const health = await getHealth(db, config);
    response.status(health.status === 'ok' ? 200 : 503).json(health);
  };
}
