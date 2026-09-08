import pg from 'pg';
export function createDatabase(connectionString: string) {
  const pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 3000, query_timeout: 3000 });
  // PostgreSQL restart can close idle clients. Do not crash or log credentials.
  pool.on('error', () => console.error('An idle database connection was lost; subsequent requests will reconnect.'));
  return pool;
}
export type Database = ReturnType<typeof createDatabase>;
