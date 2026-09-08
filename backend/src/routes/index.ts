import { Router } from 'express';
import { healthHandler } from '../controllers/health.js';
import { documentHandler, documentsHandler, factHandler, factsHandler, relationshipHandler, relationshipsHandler, uploadHandler } from '../controllers/mvp.js';
import type { Config } from '../config/index.js';
import type { Database } from '../repositories/database.js';
export function routes(db: Database, config: Config) {
  const router = Router();
  router.get('/health', healthHandler(db, config));
  router.post('/api/documents', ...uploadHandler(db, config));
  router.get('/api/documents', documentsHandler);
  router.get('/api/documents/:id', documentHandler);
  router.get('/api/facts', factsHandler(db));
  router.get('/api/facts/:id', factHandler(db));
  router.get('/api/relationships', relationshipsHandler(db));
  router.get('/api/relationships/:id', relationshipHandler(db));
  return router;
}
