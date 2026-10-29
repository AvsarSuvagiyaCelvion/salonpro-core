import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
  verifySessionToken,
  verifyAdminSessionToken,
  verifyCustomerSessionToken,
} from './auth';
import { query } from './db';
import { getSalonPlan, SalonPlanContext } from './plan';

export interface TenantSession {
  email: string;
  role: string;
  salonId: string;
  userId: string;
  salonSlug?: string;
  plan?: SalonPlanContext;
}

export interface AdminSession {
  email: string;
  role: string;
}

export interface CustomerSession {
  customerId: string;
  mobile: string;
  name: string;
  salonId: string;
  role: string;
}

/**
 * Ensures caller has an active tenant session (owner / staff).
 * Returns { session, error: null } if authorized, or { session: null, error: NextResponse } if not.
 * By default, enforces active subscription (blocks expired trial / subscription with HTTP 402).
 */
export async function requireTenant(
  request?: Request,
  options?: { allowExpired?: boolean }
): Promise<
  | { session: TenantSession; error: null }
  | { session: null; error: NextResponse }
> {
  try {
    let token: string | undefined;

    // Check optional authorization header
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    }

    if (!token) {
      return {
        session: null,
        error: NextResponse.json(
          { error: 'Unauthorized: Authentication required' },
          { status: 401 }
        ),
      };
    }

    const payload = await verifySessionToken(token);
    if (!payload || !payload.email) {
      return {
        session: null,
        error: NextResponse.json(
          { error: 'Unauthorized: Invalid or expired session' },
          { status: 401 }
        ),
      };
    }

    let salonId = payload.salonId;
    let userId = payload.userId;
    let salonSlug = payload.salonSlug;

    // Resolve or verify user and salon state from database
    const userRes = await query(
      `SELECT u.id, u.salon_id, s.slug as salon_slug, u.is_active as user_active, s.is_active as salon_active
       FROM users u
       JOIN salons s ON u.salon_id = s.id
       WHERE LOWER(u.email) = $1
       LIMIT 1`,
      [payload.email.toLowerCase()]
    );

    if (userRes.rows.length === 0) {
      return {
        session: null,
        error: NextResponse.json(
          { error: 'Unauthorized: No active salon workspace linked to this user' },
          { status: 401 }
        ),
      };
    }

    const row = userRes.rows[0];
    if (!row.user_active || !row.salon_active) {
      return {
        session: null,
        error: NextResponse.json(
          { error: 'Forbidden: Account or salon workspace is deactivated', code: 'SALON_INACTIVE' },
          { status: 403 }
        ),
      };
    }

    userId = row.id;
    salonId = row.salon_id;
    salonSlug = row.salon_slug;

    // Check plan and subscription status
    const planResult = await getSalonPlan(salonId);
    if (!options?.allowExpired && planResult.error) {
      return {
        session: null,
        error: planResult.error,
      };
    }

    return {
      session: {
        email: payload.email,
        role: payload.role || 'owner',
        salonId,
        userId,
        salonSlug,
        plan: planResult.plan || undefined,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Unauthorized: Authentication failed' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Convenient helper to fetch tenant context without error response
 */
export async function getTenantContext(request?: Request): Promise<TenantSession | null> {
  const result = await requireTenant(request);
  if (result.error || !result.session) return null;
  return result.session;
}

/**
 * Ensures caller has an active Platform Super Admin session.
 * Returns { admin, error: null } if authorized, or { admin: null, error: NextResponse } if not.
 */
export async function requireAdmin(request?: Request): Promise<
  | { admin: AdminSession; error: null }
  | { admin: null; error: NextResponse }
> {
  try {
    let token: string | undefined;

    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    }

    if (!token) {
      return {
        admin: null,
        error: NextResponse.json(
          { error: 'Unauthorized: Super Admin session required' },
          { status: 401 }
        ),
      };
    }

    const payload = await verifyAdminSessionToken(token);
    if (!payload || !payload.email || payload.role !== 'super_admin') {
      return {
        admin: null,
        error: NextResponse.json(
          { error: 'Forbidden: Super Admin access required' },
          { status: 403 }
        ),
      };
    }

    return {
      admin: payload,
      error: null,
    };
  } catch (err: any) {
    return {
      admin: null,
      error: NextResponse.json(
        { error: 'Unauthorized: Admin authentication failed' },
        { status: 401 }
      ),
    };
  }
}
