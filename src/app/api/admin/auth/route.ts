import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
        role: 'super_admin',
        name: 'Master Platform Admin',
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

    // 1. Check platform_admins table in database
    let adminUser = null;
    try {
      const dbRes = await query(
        `SELECT id, email, name, role FROM platform_admins WHERE LOWER(email) = $1 AND password = $2 LIMIT 1`,
        [cleanEmail, cleanPassword]
      );
      if (dbRes.rows.length > 0) {
        adminUser = dbRes.rows[0];
      }
    } catch {}

    // 2. Strict Super Admin Check (Adminsalonpro@gmail.com / Admin@123)
    if (!adminUser && cleanEmail === 'adminsalonpro@gmail.com' && cleanPassword === 'Admin@123') {
      adminUser = {
        email: 'adminsalonpro@gmail.com',
        name: 'Avsar Suvagiya',
        role: 'super_admin',
      };
    }

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Invalid Super Admin credentials. Access denied.' },
        { status: 401 }
      );
    }

    const token = await createAdminSessionToken({
      email: adminUser.email,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Master Admin authenticated successfully',
      admin: {
        email: adminUser.email,
        role: 'super_admin',
        name: adminUser.name || 'Master Admin',
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
