import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { clearSalonCache } from '@/lib/salon';
import { createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { salonName, ownerName, email, mobile, city, address, password } = body;

    if (!salonName || !ownerName || !email || !mobile) {
      return NextResponse.json(
        { error: 'Salon name, owner name, email address, and mobile number are required.' },
        { status: 400 }
      );
    }

    // Clean and generate unique slug
    let baseSlug = salonName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!baseSlug) baseSlug = 'salon';

    // Check slug uniqueness
    let slug = baseSlug;
    const existing = await query(`SELECT id FROM salons WHERE slug = $1 LIMIT 1`, [slug]);
    if (existing.rows.length > 0) {
      slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const fullAddress = city ? `${address ? address + ', ' : ''}${city}` : address || null;

    // 1. Create Salon record
    const salonRes = await query(
      `INSERT INTO salons (
        name, slug, brand_color, open_time, close_time, phone, address
      ) VALUES (
        $1, $2, $3, '10:00:00', '20:00:00', $4, $5
      ) RETURNING *`,
      [
        salonName.trim(),
        slug,
        '#b3135b',
        mobile.trim(),
        fullAddress,
      ]
    );

    const newSalon = salonRes.rows[0];

    // 2. Add owner as first staff member
    const staffRes = await query(
      `INSERT INTO staff (
        salon_id, name, role_title, service_commission_pct, product_commission_pct, active, show_online
      ) VALUES (
        $1, $2, 'Owner & Master Stylist', 10, 5, true, true
      ) RETURNING *`,
      [newSalon.id, ownerName.trim()]
    );
    const ownerStaff = staffRes.rows[0];

    // 3. Seed starter services
    const starterServices = [
      { name: 'Hair Cut & Styling', category: 'Hair', min: 30, price: 500 },
      { name: 'Hair Spa & Treatment', category: 'Hair', min: 45, price: 1200 },
      { name: 'Deep Cleanse Facial', category: 'Skin', min: 60, price: 1500 },
      { name: 'Beard Grooming & Shape', category: 'Grooming', min: 25, price: 350 },
    ];

    for (const s of starterServices) {
      const svRes = await query(
        `INSERT INTO services (
          salon_id, name, category, description, duration_min, price, online_enabled
        ) VALUES (
          $1, $2, $3, $4, $5, $6, true
        ) RETURNING id`,
        [newSalon.id, s.name, s.category, `Standard ${s.name} treatment`, s.min, s.price]
      );
      if (svRes.rows.length > 0) {
        await query(
          `INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [ownerStaff.id, svRes.rows[0].id]
        );
      }
    }

    // Clear cache
    clearSalonCache();

    // Create owner session token so they can immediately access their ERP dashboard
    const token = await createSessionToken({
      email: email.trim().toLowerCase(),
      role: 'owner',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Salon registered successfully!',
      salon: {
        id: newSalon.id,
        name: newSalon.name,
        slug: newSalon.slug,
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
    console.error('Salon registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register salon. Please try again.' },
      { status: 500 }
    );
  }
}
