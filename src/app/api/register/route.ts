import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool, { query } from '@/lib/db';
import { clearSalonCache } from '@/lib/salon';
import { createSessionToken, COOKIE_NAME } from '@/lib/auth';

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

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { salonName, ownerName, email, mobile, city, address, password } = body;

    const cleanSalonName = salonName?.trim();
    const cleanOwnerName = ownerName?.trim();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanMobile = mobile?.trim();
    const cleanPassword = password?.trim();

    if (!cleanSalonName || !cleanOwnerName || !cleanEmail || !cleanMobile) {
      return NextResponse.json(
        { error: 'Salon name, owner name, email address, and mobile number are required.' },
        { status: 400 }
      );
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password is required and must be at least 6 characters.' },
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
        { status: 400 }
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

    // 3. Hash password using bcrypt
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    // 4. Begin transactional registration
    await client.query('BEGIN');

    // Create Salon workspace
    const salonRes = await client.query(
      `INSERT INTO salons (
        name, slug, brand_color, open_time, close_time, phone, address, is_active, is_demo, plan
      ) VALUES (
        $1, $2, $3, '10:00:00', '20:00:00', $4, $5, true, false, 'pro'
      ) RETURNING *`,
      [
        cleanSalonName,
        slug,
        '#b3135b',
        cleanMobile,
        fullAddress,
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
        cleanMobile,
      ]
    );
    const newUser = userRes.rows[0];

    // Add owner as first Stylist in staff table
    const staffRes = await client.query(
      `INSERT INTO staff (
        salon_id, name, role_title, service_commission_pct, product_commission_pct, active, show_online
      ) VALUES (
        $1, $2, 'Owner & Master Stylist', 10, 5, true, true
      ) RETURNING id`,
      [newSalon.id, cleanOwnerName]
    );
    const ownerStaffId = staffRes.rows[0].id;

    // Seed starter services
    const starterServices = [
      { name: 'Hair Cut & Styling', category: 'Hair', min: 30, price: 500 },
      { name: 'Hair Spa & Treatment', category: 'Hair', min: 45, price: 1200 },
      { name: 'Deep Cleanse Facial', category: 'Skin', min: 60, price: 1500 },
      { name: 'Beard Grooming & Shape', category: 'Grooming', min: 25, price: 350 },
    ];

    for (const s of starterServices) {
      const svRes = await client.query(
        `INSERT INTO services (
          salon_id, name, category, description, duration_min, price, online_enabled
        ) VALUES (
          $1, $2, $3, $4, $5, $6, true
        ) RETURNING id`,
        [newSalon.id, s.name, s.category, `Standard ${s.name} treatment`, s.min, s.price]
      );
      if (svRes.rows.length > 0) {
        await client.query(
          `INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [ownerStaffId, svRes.rows[0].id]
        );
      }
    }

    await client.query('COMMIT');
    clearSalonCache();

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
    await client.query('ROLLBACK');
    console.error('Salon registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register salon. Please try again.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
