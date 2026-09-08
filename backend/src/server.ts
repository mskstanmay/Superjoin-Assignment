import { createApp } from './app.js';
import { loadConfig } from './config/index.js';
import { createDatabase } from './repositories/database.js';
const config = loadConfig();
const db = createDatabase(config.DATABASE_URL);
const server = createApp(config, db).listen(config.PORT, '0.0.0.0', () => console.log(`Backend listening on ${config.PORT}`));
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => { void db.end().then(() => process.exit(0)); });
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
