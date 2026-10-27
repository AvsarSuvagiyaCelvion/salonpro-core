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
    max: 5,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__dbPool = pool;
}

export default pool;

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}
