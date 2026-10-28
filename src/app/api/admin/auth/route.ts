import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '@/lib/auth';

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

    return NextResponse.json({
      loggedIn: true,
      admin: {
        email: payload.email,
        role: payload.role || 'super_admin',
        name: 'Platform Super Admin',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ loggedIn: false, error: error.message });
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password?.trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
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

        const passwordMatch = await bcrypt.compare(cleanPassword, adminRow.password_hash);
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

    // 2. Fallback check ONLY against environment variables (if configured)
    const envAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const envAdminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (
      !authenticatedAdmin &&
      envAdminEmail &&
      envAdminPassword &&
      cleanEmail === envAdminEmail &&
      cleanPassword === envAdminPassword
    ) {
      // Bootstrap this admin into the database with bcrypt hash if not already present
      try {
        const hash = await bcrypt.hash(cleanPassword, 10);
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
      return NextResponse.json(
        { error: 'Invalid Super Admin credentials. Access denied.' },
        { status: 401 }
      );
    }

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
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
