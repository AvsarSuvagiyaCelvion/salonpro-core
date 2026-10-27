import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';

// 1. List all platform admins (Only accessible by authenticated Super Admin)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAdminSessionToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await query(
      `SELECT id, email, name, role, created_at FROM platform_admins ORDER BY created_at ASC`
    );

    return NextResponse.json({ admins: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. Add a new admin (Only accessible from INSIDE admin panel by logged-in Super Admin)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Security Violation: Only authenticated Super Admins can add new admins.' },
        { status: 401 }
      );
    }

    const payload = await verifyAdminSessionToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Security Violation: Invalid admin session.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password?.trim();
    const cleanName = name?.trim() || 'Co-Admin';
    const cleanRole = role === 'super_admin' ? 'super_admin' : 'admin';

    if (!cleanEmail || !cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'Valid email and password (minimum 6 characters) are required.' },
        { status: 400 }
      );
    }

    // Check if email already registered as admin
    const existing = await query(
      `SELECT id FROM platform_admins WHERE LOWER(email) = $1 LIMIT 1`,
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'An admin with this email already exists.' },
        { status: 400 }
      );
    }

    const res = await query(
      `INSERT INTO platform_admins (email, password, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [cleanEmail, cleanPassword, cleanName, cleanRole]
    );

    return NextResponse.json({
      success: true,
      message: `Admin ${cleanEmail} registered successfully.`,
      admin: res.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
