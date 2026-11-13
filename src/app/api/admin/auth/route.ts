import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '@/lib/auth';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  getClientIp,
} from '@/lib/rate-limit';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ loggedIn: false });
    }

    const payload = await verifyAdminSessionToken(token);
    if (!payload) {
      return NextResponse.json({ loggedIn: false });
    }

    let adminName = payload.role === 'super_admin' ? 'Platform Super Admin' : 'Platform Admin';
    let adminRole = payload.role || 'platform_admin';

    try {
      const dbAdmin = await query(
        `SELECT name, role FROM platform_admins WHERE LOWER(email) = $1 LIMIT 1`,
        [payload.email.toLowerCase()]
      );
      if (dbAdmin.rows.length > 0) {
        adminName = dbAdmin.rows[0].name || adminName;
        adminRole = dbAdmin.rows[0].role || adminRole;
      }
    } catch {}

    return NextResponse.json({
      loggedIn: true,
      admin: {
        email: payload.email,
        role: adminRole,
        name: adminName,
      },
    });
  } catch (error: any) {
    console.error('Admin session check error:', error);
    return NextResponse.json({ loggedIn: false, error: 'Session check failed' });
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const ipRateLimitKey = `admin_auth_ip:${clientIp}`;

    const ipCheck = await checkRateLimit(ipRateLimitKey, 20, 900);
    if (ipCheck.isLocked) {
      return NextResponse.json(
        { error: 'Too many admin authentication attempts from this IP address. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password?.trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const rateLimitKey = `admin:${cleanEmail}`;
    const rlCheck = await checkRateLimit(rateLimitKey, 5, 900);
    if (rlCheck.isLocked) {
      return NextResponse.json(
        { error: rlCheck.errorMessage || 'Too many failed admin login attempts. Account temporarily locked for 15 minutes.' },
        { status: 429 }
      );
    }

    // 1. Query platform_admins table using password_hash
    let authenticatedAdmin: {
      id?: string;
      email: string;
      name: string;
      role: string;
    } | null = null;

    try {
      const dbRes = await query(
        `SELECT id, email, name, role, password_hash, is_active 
         FROM platform_admins 
         WHERE LOWER(email) = $1 
         LIMIT 1`,
        [cleanEmail]
      );

      if (dbRes.rows.length > 0) {
        const adminRow = dbRes.rows[0];

        if (!adminRow.is_active) {
          return NextResponse.json(
            { error: 'This admin account has been deactivated.' },
            { status: 403 }
          );
        }

        let passwordMatch = false;
        if (adminRow.password_hash.startsWith('$2a$') || adminRow.password_hash.startsWith('$2b$')) {
          passwordMatch = await bcrypt.compare(cleanPassword, adminRow.password_hash);
        } else {
          passwordMatch = (adminRow.password_hash === cleanPassword);
          if (passwordMatch) {
            const upgraded = await bcrypt.hash(cleanPassword, 12);
            await query('UPDATE platform_admins SET password_hash = $1 WHERE id = $2', [upgraded, adminRow.id]);
          }
        }

        if (passwordMatch) {
          authenticatedAdmin = {
            id: adminRow.id,
            email: adminRow.email,
            name: adminRow.name,
            role: adminRow.role,
          };
        }
      }
    } catch (err: any) {
      console.error('Database error during admin auth query:', err);
    }

    // 2. Fallback check ONLY against environment variables in development mode
    // Strictly disallowed and disabled in production to prevent unauthorized bootstrap via env defaults
    const isProduction = process.env.NODE_ENV === 'production';
    const envAdminEmail = !isProduction ? process.env.ADMIN_EMAIL?.trim().toLowerCase() : null;
    const envAdminPassword = !isProduction ? process.env.ADMIN_PASSWORD?.trim() : null;

    let isEnvAuthMatch = false;
    if (!isProduction && !authenticatedAdmin && envAdminEmail && envAdminPassword && cleanEmail === envAdminEmail) {
      const bInput = Buffer.from(cleanPassword);
      const bTarget = Buffer.from(envAdminPassword);
      if (bInput.length === bTarget.length && crypto.timingSafeEqual(bInput, bTarget)) {
        isEnvAuthMatch = true;
      }
    }

    if (isEnvAuthMatch && envAdminEmail) {
      // Bootstrap this admin into the database with bcrypt hash (cost factor 12) if not already present
      try {
        const hash = await bcrypt.hash(cleanPassword, 12);
        const insertRes = await query(
          `INSERT INTO platform_admins (email, password_hash, name, role, is_active)
           VALUES ($1, $2, 'Primary Super Admin', 'super_admin', true)
           ON CONFLICT (email) DO UPDATE SET password_hash = $2
           RETURNING id, email, name, role`,
          [envAdminEmail, hash]
        );
        authenticatedAdmin = insertRes.rows[0];
      } catch {
        authenticatedAdmin = {
          email: envAdminEmail,
          name: 'Primary Super Admin',
          role: 'super_admin',
        };
      }
    }

    if (!authenticatedAdmin) {
      await recordFailedAttempt(ipRateLimitKey, 20, 900);
      const fail = await recordFailedAttempt(rateLimitKey, 5, 900);
      return NextResponse.json(
        {
          error: fail.isLocked
            ? fail.errorMessage
            : 'Invalid Super Admin credentials. Access denied.',
        },
        { status: fail.isLocked ? 429 : 401 }
      );
    }

    // Reset rate limit counter on successful admin authentication
    await resetRateLimit(rateLimitKey);
    await resetRateLimit(ipRateLimitKey);

    const token = await createAdminSessionToken({
      email: authenticatedAdmin.email,
      role: authenticatedAdmin.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Master Admin authenticated successfully',
      admin: {
        email: authenticatedAdmin.email,
        role: authenticatedAdmin.role,
        name: authenticatedAdmin.name || 'Master Admin',
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours (aligned with admin session expiry)
    });

    return response;
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/auth/route.ts');
  }
}
