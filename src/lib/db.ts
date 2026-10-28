import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

const pool =
  global.__dbPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: false,
  });

// Cache connection pool across warm serverless lambdas in production and dev
global.__dbPool = pool;

export default pool;

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}
