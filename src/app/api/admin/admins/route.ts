import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';

// 1. List all platform admins (Only accessible by authenticated Super Admin)
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request, { requireSuperAdmin: true });
    if (auth.error) return auth.error;

    const res = await query(
      `SELECT id, email, name, role, is_active, created_at FROM platform_admins ORDER BY created_at ASC`
    );

    return NextResponse.json({ admins: res.rows });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/admins/route.ts');
  }
}

// 2. Add a new admin (Only accessible by authenticated Super Admin)
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request, { requireSuperAdmin: true });
    if (auth.error) return auth.error;

    const body = await request.json();
    const { email, password, confirmPassword, name, role } = body;

    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password?.trim();
    const cleanName = name?.trim() || 'Platform Admin';
    const cleanRole = role === 'super_admin' ? 'super_admin' : 'platform_admin';

    if (!cleanEmail || !cleanPassword || cleanPassword.length < 8) {
      return NextResponse.json(
        { error: 'Valid email and a secure password (minimum 8 characters) are required.' },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && cleanPassword !== confirmPassword?.trim()) {
      return NextResponse.json(
        { error: 'Admin password and confirm password do not match.' },
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

    const passwordHash = await bcrypt.hash(cleanPassword, 12);

    const res = await query(
      `INSERT INTO platform_admins (email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, name, role, is_active, created_at`,
      [cleanEmail, passwordHash, cleanName, cleanRole]
    );

    return NextResponse.json({
      success: true,
      message: `Admin ${cleanEmail} registered successfully with ${cleanRole === 'super_admin' ? 'Super Admin' : 'Platform Admin'} privileges.`,
      admin: res.rows[0],
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/admins/route.ts');
  }
}

// 3. Delete an admin (Only accessible by authenticated Super Admin)
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request, { requireSuperAdmin: true });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    // Prevent deleting primary super admin
    const target = await query('SELECT email FROM platform_admins WHERE id = $1', [id]);
    if (target.rows.length === 0) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }

    if (target.rows[0].email.toLowerCase() === auth.admin.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'You cannot delete your own active Super Admin account.' },
        { status: 400 }
      );
    }

    await query('DELETE FROM platform_admins WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: `Admin account ${target.rows[0].email} removed successfully.`,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/admins/route.ts');
  }
}
