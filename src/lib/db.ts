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
    max: 40,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: false,
  });

// Cache connection pool across warm serverless lambdas in production and dev
global.__dbPool = pool;

export default pool;

export async function query(text: string, params?: any[]) {
  try {
    return await pool.query(text, params);
  } catch (err: any) {
    // Retry once for transient network resets on serverless cold starts
    if (
      err?.code === 'ECONNRESET' ||
      err?.code === 'ETIMEDOUT' ||
      err?.message?.includes('timeout')
    ) {
      await new Promise((r) => setTimeout(r, 150));
      return await pool.query(text, params);
    }
    throw err;
  }
}
