import { Pool } from 'pg';

declare global {
  var __dbPool: Pool | undefined;
}

const poolMax = process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 3;

const sslConfig = process.env.DATABASE_CA_CERT
  ? {
      rejectUnauthorized: true,
      ca: process.env.DATABASE_CA_CERT,
    }
  : {
      rejectUnauthorized: false,
    };

const pool =
  global.__dbPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: poolMax,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: false,
  });

// Cache connection pool across warm serverless lambdas in production and dev
global.__dbPool = pool;

export default pool;

function isSelectQuery(sql: string): boolean {
  const trimmed = sql.trim().toLowerCase();
  return trimmed.startsWith('select') || trimmed.startsWith('with');
}

export async function query(text: string, params?: any[]) {
  try {
    return await pool.query(text, params);
  } catch (err: any) {
    // Retry ONLY for idempotent SELECT queries on transient network resets
    const canRetry =
      isSelectQuery(text) &&
      (err?.code === 'ECONNRESET' ||
        err?.code === 'ETIMEDOUT' ||
        err?.message?.includes('timeout'));

    if (canRetry) {
      await new Promise((r) => setTimeout(r, 150));
      return await pool.query(text, params);
    }
    throw err;
  }
}
