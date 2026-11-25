import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { createSessionToken, COOKIE_NAME } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { salonId } = body;

    if (!salonId) {
      return NextResponse.json({ error: 'Salon ID is required for impersonation.' }, { status: 400 });
    }

    // 1. Verify that the requested salon exists
    const salonRes = await query(
      `SELECT id, name, slug, brand_color, is_active FROM salons WHERE id = $1 LIMIT 1`,
      [salonId]
    );

    if (salonRes.rows.length === 0) {
      return NextResponse.json({ error: 'Target salon not found.' }, { status: 404 });
    }

    const salon = salonRes.rows[0];

    // 2. Find primary owner user for this salon
    const ownerRes = await query(
      `SELECT id, email, role FROM users WHERE salon_id = $1 AND role = 'owner' LIMIT 1`,
      [salon.id]
    );

    let targetUser = ownerRes.rows[0];

    if (!targetUser) {
      // If no explicit owner user exists, check for any user in this salon
      const anyUserRes = await query(
        `SELECT id, email, role FROM users WHERE salon_id = $1 LIMIT 1`,
        [salon.id]
      );

      if (anyUserRes.rows.length > 0) {
        targetUser = anyUserRes.rows[0];
      } else {
        // Auto-provision an owner user for newly registered or orphaned salon workspaces
        const generatedEmail = `owner@${salon.slug}.in`;
        const bcrypt = await import('bcryptjs');
        const tempHash = await bcrypt.hash(crypto.randomUUID(), 10);
        const newOwnerRes = await query(
          `INSERT INTO users (salon_id, email, password_hash, role, full_name, is_active)
           VALUES ($1, $2, $3, 'owner', $4, true)
           RETURNING id, email, role`,
          [salon.id, generatedEmail, tempHash, `${salon.name} Owner`]
        );
        targetUser = newOwnerRes.rows[0];
      }
    }

    // 3. Mint an impersonated tenant JWT session
    const sessionToken = await createSessionToken({
      email: targetUser.email,
      role: 'owner',
      salonId: salon.id,
      userId: targetUser.id,
      salonSlug: salon.slug,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      redirectUrl: '/app',
      salon: {
        id: salon.id,
        name: salon.name,
        slug: salon.slug,
      },
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: 'owner',
      },
    });

    // 4. Set tenant session cookie for /app access
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    // 5. Set client-readable impersonation state cookie for the warning banner in /app
    const impersonationData = JSON.stringify({
      salonId: salon.id,
      salonName: salon.name,
      salonSlug: salon.slug,
      adminEmail: auth.admin.email,
      startedAt: Date.now(),
    });

    response.cookies.set('studiodesk_impersonation', impersonationData, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/impersonate/route.ts');
  }
}

