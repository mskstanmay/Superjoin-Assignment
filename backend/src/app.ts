import express from 'express';
import pino from 'pino';
import type { Config } from './config/index.js';
import type { Database } from './repositories/database.js';
import { errorHandler, requestId } from './middleware/errors.js';
import { routes } from './routes/index.js';
export function createApp(config: Config, db: Database) {
  const logger = pino({ level: config.LOG_LEVEL, redact: ['authorization', 'password', 'DATABASE_URL', 'LLM_API_KEY'] });
  const app = express();
  app.locals.db = db;
  app.disable('x-powered-by');
  app.use(requestId);
  app.use(express.json({ limit: '1mb' }));
  app.use(routes(db, config));
  app.use((_request, response) => response.status(404).json({ error: {
    code: 'NOT_FOUND', message: 'Route not found.', request_id: response.locals.requestId, retryable: false,
  } }));
  app.use(errorHandler(logger));
  return app;
}
