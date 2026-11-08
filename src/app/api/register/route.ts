import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool, { query } from '@/lib/db';
import { clearSalonCache } from '@/lib/salon';
import { createSessionToken, COOKIE_NAME } from '@/lib/auth';
import { normalizeMobile } from '@/lib/phone';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from '@/lib/rate-limit';
import { serverError } from '@/lib/http';

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'login',
  'register',
  'register-salon',
  'customer',
  'portal',
  'my-account',
  'b',
  'book',
  'public',
  'static',
  'assets',
  'favicon',
  'robots',
  'sitemap',
  'health',
  'demo',
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let client: any = null;
  let inTransaction = false;
  let ipRateLimitKey = 'register_ip:unknown';

  try {
    const clientIp = getClientIp(request);
    ipRateLimitKey = `register_ip:${clientIp}`;

    // IP rate limit: max 5 salon registrations per hour (3600 seconds)
    const ipCheck = await checkRateLimit(ipRateLimitKey, 5, 3600);
    if (ipCheck.isLocked) {
      return NextResponse.json(
        { error: 'Too many salon registration requests from this network. Please wait before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { salonName, ownerName, email, mobile, city, address, password, confirmPassword, planId } = body;

    const cleanSalonName = salonName?.trim();
    const cleanOwnerName = ownerName?.trim();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanMobile = mobile?.trim();
    const cleanPassword = password?.trim();

    if (!cleanSalonName || !cleanOwnerName || !cleanEmail || !cleanMobile) {
      await recordFailedAttempt(ipRateLimitKey, 5, 3600);
      return NextResponse.json(
        { error: 'Salon name, owner name, email address, and mobile number are required.' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      await recordFailedAttempt(ipRateLimitKey, 5, 3600);
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const normalizedMobile = normalizeMobile(cleanMobile);
    if (!normalizedMobile) {
      await recordFailedAttempt(ipRateLimitKey, 5, 3600);
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    if (!cleanPassword || cleanPassword.length < 8) {
      await recordFailedAttempt(ipRateLimitKey, 5, 3600);
      return NextResponse.json(
        { error: 'Password is required and must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && cleanPassword !== confirmPassword?.trim()) {
      await recordFailedAttempt(ipRateLimitKey, 5, 3600);
      return NextResponse.json(
        { error: 'Password and Confirm Password do not match.' },
        { status: 400 }
      );
    }

    // 1. Check if email already registered in users table
    const existingUser = await query(
      `SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in instead.' },
        { status: 409 }
      );
    }

    // 2. Generate and sanitize slug
    let baseSlug = cleanSalonName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!baseSlug || RESERVED_SLUGS.has(baseSlug)) {
      baseSlug = `salon-${baseSlug || 'studio'}`;
    }

    // Check slug uniqueness across existing salons
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existingSlug = await query(
        `SELECT id FROM salons WHERE slug = $1 LIMIT 1`,
        [slug]
      );
      if (existingSlug.rows.length === 0 && !RESERVED_SLUGS.has(slug)) {
        break;
      }
      slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
      counter++;
      if (counter > 10) {
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }

    const fullAddress = city
      ? `${address ? address.trim() + ', ' : ''}${city.trim()}`
      : address?.trim() || null;

    // 3. Hash password using bcrypt (cost factor 12)
    const passwordHash = await bcrypt.hash(cleanPassword, 12);

    // Registration ALWAYS starts with a 7-day free trial; never activate paid on registration
    const subStatus = 'trial';
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const subEndsAt = null;
    let subPlanId: string | null = null;
    let planSlug = 'pro';

    if (planId) {
      const planCheck = await query('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true', [planId]);
      if (planCheck.rows.length > 0) {
        subPlanId = planCheck.rows[0].id;
        planSlug = planCheck.rows[0].slug || 'pro';
      }
    }

    // 4. Begin transactional registration
    client = await pool.connect();
    await client.query('BEGIN');
    inTransaction = true;

    // Create Salon workspace
    const salonRes = await client.query(
      `INSERT INTO salons (
        name, slug, brand_color, open_time, close_time, phone, address, is_active, is_demo, plan,
        trial_ends_at, subscription_status, subscription_plan_id, subscription_ends_at
      ) VALUES (
        $1, $2, $3, '10:00:00', '20:00:00', $4, $5, true, false, $6,
        $7, $8, $9, $10
      ) RETURNING *`,
      [
        cleanSalonName,
        slug,
        '#D4A77F',
        normalizedMobile,
        fullAddress,
        planSlug,
        trialEndsAt,
        subStatus,
        subPlanId,
        subEndsAt,
      ]
    );
    const newSalon = salonRes.rows[0];

    // Create Salon Owner User account
    const userRes = await client.query(
      `INSERT INTO users (
        salon_id, email, password_hash, full_name, phone, role, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, 'owner', true
      ) RETURNING id, email, full_name, role`,
      [
        newSalon.id,
        cleanEmail,
        passwordHash,
        cleanOwnerName,
        normalizedMobile,
      ]
    );
    const newUser = userRes.rows[0];

    await client.query('COMMIT');
    inTransaction = false;
    client.release();
    client = null;
    clearSalonCache();
    await resetRateLimit(ipRateLimitKey);

    // 5. Issue multi-tenant session token
    const token = await createSessionToken({
      userId: newUser.id,
      salonId: newSalon.id,
      email: newUser.email,
      role: newUser.role,
      salonSlug: newSalon.slug,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Salon registered successfully!',
      salon: {
        id: newSalon.id,
        name: newSalon.name,
        slug: newSalon.slug,
      },
      user: {
        id: newUser.id,
        name: newUser.full_name,
        email: newUser.email,
      },
    });

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
    if (inTransaction && client) {
      try {
        await client.query('ROLLBACK');
      } catch {}
    }
    console.error('Salon registration error:', error);

    if (error?.code === '23505') {
      const detail = error.detail || '';
      if (detail.includes('email') || error.constraint?.includes('email') || error.constraint?.includes('users_email')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in instead.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'A salon with this name or identifier already exists. Please choose a slightly different name.' },
        { status: 409 }
      );
    }

    return serverError(error, 'Salon registration');
  } finally {
    if (client) {
      try {
        client.release();
      } catch {}
    }
  }
}
