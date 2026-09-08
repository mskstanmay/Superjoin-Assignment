import { loadConfig } from '../config/index.js';
import { createDatabase } from './database.js';
import { migrate } from './migrations.js';

const db = createDatabase(loadConfig().DATABASE_URL);
try {
  await migrate(db);
  console.log('Database migrations applied/verified');
} catch {
  console.error('Migration failed. Check database connectivity and migration checksums.');
  process.exitCode = 1;
} finally {
  await db.end();
}
