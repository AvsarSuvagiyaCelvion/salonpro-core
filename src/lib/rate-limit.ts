import { query } from './db';

export interface RateLimitCheckResult {
  isLocked: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
  errorMessage?: string;
}

// In-memory fallback / speed cache
const memoryLimits = new Map<string, { attempts: number; lockedUntil?: number; lastUpdated?: number }>();

let tableEnsured = false;
async function ensureRateLimitTable() {
  if (tableEnsured) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS auth_rate_limits (
        key TEXT PRIMARY KEY,
        failed_attempts INT NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_locked ON auth_rate_limits (locked_until);
    `);
    tableEnsured = true;
  } catch (err) {
    console.error('Notice: ensureRateLimitTable fallback to in-memory:', err);
  }
}

/**
 * Extracts client IP safely from request headers (first x-forwarded-for entry)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

/**
 * Checks if a specific key (e.g. 'customer:9876500001', 'login_ip:1.2.3.4') is currently locked out.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts = 5,
  lockoutDurationSeconds = 900 // 15 minutes
): Promise<RateLimitCheckResult> {
  const now = Date.now();

  // 1. In-memory quick check
  const mem = memoryLimits.get(key);
  if (mem) {
    if (mem.lockedUntil && mem.lockedUntil > now) {
      const diffSec = Math.ceil((mem.lockedUntil - now) / 1000);
      return {
        isLocked: true,
        remainingAttempts: 0,
        retryAfterSeconds: diffSec,
        errorMessage: `Too many failed attempts. Account / IP is temporarily locked. Please try again in ${Math.ceil(diffSec / 60)} minutes.`,
      };
    } else if (mem.lockedUntil && mem.lockedUntil <= now) {
      // Lockout expired, clear in memory
      memoryLimits.delete(key);
    } else if (mem.lastUpdated && now - mem.lastUpdated > lockoutDurationSeconds * 1000) {
      // Window expired, clear in memory
      memoryLimits.delete(key);
    }
  }

  // 2. Database check
  await ensureRateLimitTable();
  try {
    const res = await query(
      `SELECT failed_attempts, locked_until, updated_at 
       FROM auth_rate_limits 
       WHERE key = $1 LIMIT 1`,
      [key]
    );

    if (res.rows.length > 0) {
      const row = res.rows[0];
      const updatedAtMs = new Date(row.updated_at).getTime();
      const isWindowExpired = (now - updatedAtMs) > (lockoutDurationSeconds * 1000);

      if (row.locked_until) {
        const lockedUntilMs = new Date(row.locked_until).getTime();
        if (lockedUntilMs > now) {
          const diffSec = Math.ceil((lockedUntilMs - now) / 1000);
          memoryLimits.set(key, { attempts: row.failed_attempts, lockedUntil: lockedUntilMs, lastUpdated: updatedAtMs });
          return {
            isLocked: true,
            remainingAttempts: 0,
            retryAfterSeconds: diffSec,
            errorMessage: `Too many failed attempts. Account / IP is temporarily locked. Please try again in ${Math.ceil(diffSec / 60)} minutes.`,
          };
        }
      }

      // If lockout expired or counter is older than window, it effectively resets
      if (isWindowExpired) {
        return {
          isLocked: false,
          remainingAttempts: maxAttempts,
        };
      }

      const remaining = Math.max(0, maxAttempts - (row.failed_attempts || 0));
      return {
        isLocked: false,
        remainingAttempts: remaining,
      };
    }
  } catch (err) {
    // Fall back to memory
  }

  return {
    isLocked: false,
    remainingAttempts: maxAttempts,
  };
}

/**
 * Records a failed attempt for the key.
 * - When locked_until has passed, restarts from 1 and clears locked_until.
 * - When counter is older than lockout window, restarts from 1.
 */
export async function recordFailedAttempt(
  key: string,
  maxAttempts = 5,
  lockoutDurationSeconds = 900 // 15 minutes
): Promise<RateLimitCheckResult> {
  const now = Date.now();
  await ensureRateLimitTable();

  let newAttempts = 1;
  let isLocked = false;
  let lockedUntilMs: number | undefined;

  try {
    const lockUntilDate = new Date(now + lockoutDurationSeconds * 1000);

    const res = await query(
      `INSERT INTO auth_rate_limits (key, failed_attempts, locked_until, updated_at)
       VALUES ($1, 1, CASE WHEN $2 = 1 THEN $3 ELSE NULL END, NOW())
       ON CONFLICT (key) DO UPDATE
       SET failed_attempts = CASE 
             WHEN (auth_rate_limits.locked_until IS NOT NULL AND auth_rate_limits.locked_until <= NOW())
                  OR (auth_rate_limits.updated_at < NOW() - ($4::int * INTERVAL '1 second')) THEN 1
             ELSE auth_rate_limits.failed_attempts + 1
           END,
           locked_until = CASE
             WHEN (auth_rate_limits.locked_until IS NOT NULL AND auth_rate_limits.locked_until <= NOW())
                  OR (auth_rate_limits.updated_at < NOW() - ($4::int * INTERVAL '1 second')) THEN 
                    CASE WHEN 1 >= $2 THEN $3 ELSE NULL END
             WHEN auth_rate_limits.failed_attempts + 1 >= $2 THEN $3
             ELSE NULL
           END,
           updated_at = NOW()
       RETURNING failed_attempts, locked_until`,
      [key, maxAttempts, lockUntilDate, lockoutDurationSeconds]
    );

    if (res.rows.length > 0) {
      newAttempts = res.rows[0].failed_attempts;
      if (res.rows[0].locked_until) {
        lockedUntilMs = new Date(res.rows[0].locked_until).getTime();
        isLocked = lockedUntilMs > now;
      }
    }
  } catch (err) {
    // Memory fallback
    const current = memoryLimits.get(key);
    if (!current || (current.lockedUntil && current.lockedUntil <= now) || (current.lastUpdated && now - current.lastUpdated > lockoutDurationSeconds * 1000)) {
      newAttempts = 1;
    } else {
      newAttempts = current.attempts + 1;
    }

    if (newAttempts >= maxAttempts) {
      isLocked = true;
      lockedUntilMs = now + lockoutDurationSeconds * 1000;
    }
  }

  if (isLocked && lockedUntilMs) {
    memoryLimits.set(key, { attempts: newAttempts, lockedUntil: lockedUntilMs, lastUpdated: now });
    const diffSec = Math.ceil((lockedUntilMs - now) / 1000);
    return {
      isLocked: true,
      remainingAttempts: 0,
      retryAfterSeconds: diffSec,
      errorMessage: `Too many failed attempts. Account / IP is temporarily locked. Please try again in ${Math.ceil(diffSec / 60)} minutes.`,
    };
  }

  memoryLimits.set(key, { attempts: newAttempts, lastUpdated: now });
  const remaining = Math.max(0, maxAttempts - newAttempts);
  return {
    isLocked: false,
    remainingAttempts: remaining,
  };
}

/**
 * Resets the rate limit counter and unlocks upon successful authentication.
 */
export async function resetRateLimit(key: string): Promise<void> {
  memoryLimits.delete(key);
  try {
    await ensureRateLimitTable();
    await query('DELETE FROM auth_rate_limits WHERE key = $1', [key]);
  } catch {}
}
