import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  verifySessionToken,
  verifyAdminSessionToken,
} from './auth';
import { query } from './db';
import { getSalonPlan, SalonPlanContext } from './plan';

export type UserRole = 'owner' | 'staff';

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

interface CachedUserAuth {
  userId: string;
  salonId: string;
  salonSlug: string;
  role: string;
  userActive: boolean;
  salonActive: boolean;
  cachedAt: number;
}

const userAuthCache = new Map<string, CachedUserAuth>();
const USER_CACHE_TTL = 60000; // 60 seconds in-memory cache for fast tab navigation

export function invalidateUserAuthCache(email?: string) {
  if (email) {
    userAuthCache.delete(email.toLowerCase());
  } else {
    userAuthCache.clear();
  }
}

/**
 * 3.1 Role authorization guard
 * Returns null if allowed, or HTTP 403 NextResponse if denied.
 */
export function requireRole(
  session: TenantSession,
  allowedRoles: ('owner' | 'staff')[]
): NextResponse | null {
  if (!session || !allowedRoles.includes(session.role as any)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions for this action', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }
  return null;
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

    // Static Demo Owner Workspace Bypass: Strictly disabled in production.
    // Slug-based auth bypass is REMOVED: setting salonSlug to 'dixa-beauty-salon' never bypasses auth.
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.ENABLE_DEMO_WORKSPACE === 'true' &&
      payload.email.toLowerCase() === 'owner@dixabeautysalon.in'
    ) {
      return {
        session: {
          email: 'owner@dixabeautysalon.in',
          role: 'owner',
          salonId: '00000000-0000-0000-0000-000000000001',
          userId: '00000000-0000-0000-0000-000000000002',
          salonSlug: 'dixa-beauty-salon',
          plan: {
            salonId: '00000000-0000-0000-0000-000000000001',
            salonName: 'Dixa Beauty Salon',
            planSlug: 'pro',
            planName: 'Pro Studio',
            status: 'active',
            isTrial: false,
            isTrialExpired: false,
            trialDaysRemaining: 0,
            trialEndsAt: null,
            subscriptionEndsAt: '2030-12-31T23:59:59.000Z',
            subscriptionDaysRemaining: 999,
            isSubscriptionExpiringSoon: false,
            customDomainVerified: false,
            isActive: true,
            flags: {
              logo_upload: true,
              commission_report: true,
              memberships: true,
              calendar_view: true,
              customer_cancel: true,
              export: true,
              coupons: true,
              reviews: true,
              loyalty: true,
              custom_domain: false,
              multi_branch: false,
              priority_support: false,
            },
            limits: {
              max_staff: 10,
              max_services: 100,
              wa_per_month: 500,
            },
          },
        },
        error: null,
      };
    }

    const cacheKey = payload.email.toLowerCase();
    const cached = userAuthCache.get(cacheKey);

    let row: {
      id: string;
      salon_id: string;
      salon_slug: string;
      role: string;
      user_active: boolean;
      salon_active: boolean;
    };

    if (cached && Date.now() - cached.cachedAt < USER_CACHE_TTL) {
      row = {
        id: cached.userId,
        salon_id: cached.salonId,
        salon_slug: cached.salonSlug,
        role: cached.role,
        user_active: cached.userActive,
        salon_active: cached.salonActive,
      };
    } else {
      // Re-read role and state from database (users.role) instead of trusting JWT
      const userRes = await query(
        `SELECT u.id, u.salon_id, u.role, s.slug as salon_slug, u.is_active as user_active, s.is_active as salon_active
         FROM users u
         JOIN salons s ON u.salon_id = s.id
         WHERE LOWER(u.email) = $1
         LIMIT 1`,
        [cacheKey]
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

      const r = userRes.rows[0];
      row = {
        id: r.id,
        salon_id: r.salon_id,
        salon_slug: r.salon_slug,
        role: r.role || 'staff',
        user_active: Boolean(r.user_active),
        salon_active: Boolean(r.salon_active),
      };

      userAuthCache.set(cacheKey, {
        userId: row.id,
        salonId: row.salon_id,
        salonSlug: row.salon_slug,
        role: row.role,
        userActive: row.user_active,
        salonActive: row.salon_active,
        cachedAt: Date.now(),
      });
    }

    if (!row.user_active || !row.salon_active) {
      return {
        session: null,
        error: NextResponse.json(
          { error: 'Forbidden: Account or salon workspace is deactivated', code: 'SALON_INACTIVE' },
          { status: 403 }
        ),
      };
    }

    const userId = row.id;
    const salonId = row.salon_id;
    const salonSlug = row.salon_slug;
    const dbRole = row.role;

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
        role: dbRole, // Always DB role
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
          { error: 'Unauthorized: Super Admin access required' },
          { status: 401 }
        ),
      };
    }

    const payload = await verifyAdminSessionToken(token);
    if (!payload || !payload.email) {
      return {
        admin: null,
        error: NextResponse.json(
          { error: 'Unauthorized: Invalid admin session' },
          { status: 401 }
        ),
      };
    }

    return {
      admin: {
        email: payload.email,
        role: payload.role || 'super_admin',
      },
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
