import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

export function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;

  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    result[key] = val;
  }
  return result;
}

const rootDir = process.cwd();
const testEnvPath = path.join(rootDir, '.env.test');
const localEnvPath = path.join(rootDir, '.env.local');

const testEnv = parseEnvFile(testEnvPath);
const localEnv = parseEnvFile(localEnvPath);

// Merge into process.env so library code like auth/storage reads test values
for (const [k, v] of Object.entries(testEnv)) {
  if (!process.env[k]) {
    process.env[k] = v;
  }
}

export const BASE_URL = process.env.BASE_URL || testEnv.BASE_URL || 'http://localhost:3100';
export const TEST_DB_URL = testEnv.DATABASE_URL || process.env.DATABASE_URL || '';
export const SESSION_SECRET = testEnv.SESSION_SECRET || process.env.SESSION_SECRET || 'supersecret-session-key-StudioDesk-2026-xyz';
export const SUPABASE_URL = testEnv.SUPABASE_URL || process.env.SUPABASE_URL || 'https://mneftepouqtsyfwgfsyb.supabase.co';
export const SUPABASE_SERVICE_ROLE_KEY = testEnv.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// SAFETY GUARD ENFORCEMENT
export function runSafetyGuard(): void {
  console.log('\n🔒 [QA SAFETY GUARD] Checking database environment safety...');

  if (!TEST_DB_URL) {
    console.error('❌ [QA SAFETY GUARD ERROR] DATABASE_URL is missing in .env.test! Exiting.');
    process.exit(1);
  }

  // Check 1: Refuse if DATABASE_URL equals .env.local
  const localDbUrl = localEnv.DATABASE_URL;
  if (localDbUrl && TEST_DB_URL.trim() === localDbUrl.trim()) {
    console.error(
      '❌ [QA SAFETY GUARD ERROR] Refusing to run: DATABASE_URL in .env.test is IDENTICAL to .env.local!'
    );
    console.error('   Tests must run against an isolated test database (e.g. /StudioDesk_test) to protect development data.');
    process.exit(1);
  }

  // Check 2: DB name or host must indicate an isolated test database
  try {
    const parsed = new URL(TEST_DB_URL.replace('postgresql://', 'http://'));
    const dbName = parsed.pathname.replace(/^\//, '').toLowerCase();

    if (!dbName.includes('test') && !parsed.hostname.includes('test')) {
      console.error(
        `❌ [QA SAFETY GUARD ERROR] Refusing to run: Database target "${dbName}" does not look like a test database.`
      );
      console.error('   Database name must contain "test" (e.g. /StudioDesk_test). Target was: ' + dbName);
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ [QA SAFETY GUARD ERROR] Invalid DATABASE_URL format in .env.test:', err.message);
    process.exit(1);
  }

  console.log('✅ [QA SAFETY GUARD] Safety check passed. Connected to verified test database.\n');
}

// Database pool for test verification
export const pool = new Pool({
  connectionString: TEST_DB_URL,
  max: 5,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const res = await pool.query(sql, params);
      return { rows: res.rows, rowCount: res.rowCount ?? 0 };
    } catch (err: any) {
      const isTransient =
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        err.message?.includes('Connection terminated') ||
        err.message?.includes('Connection reset');

      if (isTransient && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 200 * attempts));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Database query failed after max retries');
}

