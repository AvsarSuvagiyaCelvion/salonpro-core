import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createSessionToken, COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limit';

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

    // Rate limiting check
    const rateLimitKey = `owner:${cleanEmail}`;
    const rlCheck = await checkRateLimit(rateLimitKey, 5, 900);
    if (rlCheck.isLocked) {
      return NextResponse.json(
        { error: rlCheck.errorMessage || 'Too many failed login attempts. Your account is temporarily locked for 15 minutes.' },
        { status: 429 }
      );
    }

    // 1. Query users table joined with salons table
    const userRes = await query(
      `SELECT u.id, u.salon_id, u.email, u.password_hash, u.full_name, u.role, u.is_active as user_active,
              s.name as salon_name, s.slug as salon_slug, s.is_active as salon_active
       FROM users u
       JOIN salons s ON u.salon_id = s.id
       WHERE LOWER(u.email) = $1
       LIMIT 1`,
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      const fail = await recordFailedAttempt(rateLimitKey, 5, 900);
      return NextResponse.json(
        {
          error: fail.isLocked
            ? fail.errorMessage
            : 'Invalid email or password. Please check your credentials.',
        },
        { status: fail.isLocked ? 429 : 401 }
      );
    }

    const user = userRes.rows[0];

    // 2. Check if user account is active
    if (!user.user_active) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // 3. Check if salon workspace is active
    if (!user.salon_active) {
      return NextResponse.json(
        { error: 'Your salon workspace has been suspended. Please contact platform administration.' },
        { status: 403 }
      );
    }

    // 4. Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!passwordMatch) {
      const fail = await recordFailedAttempt(rateLimitKey, 5, 900);
      return NextResponse.json(
        {
          error: fail.isLocked
            ? fail.errorMessage
            : 'Invalid email or password. Please check your credentials.',
        },
        { status: fail.isLocked ? 429 : 401 }
      );
    }

    // Reset rate limit on success
    await resetRateLimit(rateLimitKey);

    // 5. Create multi-tenant session token containing tenant context
    const token = await createSessionToken({
      userId: user.id,
      salonId: user.salon_id,
      email: user.email,
      role: user.role,
      salonSlug: user.salon_slug,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
      salon: {
        id: user.salon_id,
        name: user.salon_name,
        slug: user.salon_slug,
      },
    });

    // Set signed httpOnly cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Tenant login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
