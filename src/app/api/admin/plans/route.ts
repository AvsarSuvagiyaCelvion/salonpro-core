import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';

// 1. GET all plans with live subscriber counts
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const res = await query(`
      SELECT 
        p.*,
        COUNT(s.id)::int as active_salons_count
      FROM subscription_plans p
      LEFT JOIN salons s ON s.subscription_plan_id = p.id AND s.is_active = true
      GROUP BY p.id
      ORDER BY p.sort_order ASC, p.created_at ASC
    `);

    // Also get trial statistics
    const statsRes = await query(`
      SELECT 
        COUNT(CASE WHEN subscription_status = 'trial' AND trial_ends_at > NOW() THEN 1 END)::int as active_trials_count,
        COUNT(CASE WHEN subscription_status = 'trial' AND trial_ends_at <= NOW() THEN 1 END)::int as expired_trials_count,
        COUNT(CASE WHEN subscription_status = 'active' THEN 1 END)::int as active_paid_count,
        COUNT(id)::int as total_salons_count
      FROM salons
    `);

    return NextResponse.json({
      success: true,
      plans: res.rows,
      stats: statsRes.rows[0] || {
        active_trials_count: 0,
        expired_trials_count: 0,
        active_paid_count: 0,
        total_salons_count: 0,
      },
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/plans/route.ts');
  }
}

// 2. POST create a new subscription plan
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { name, price, yearly_price, billing_interval, description, features, max_staff, limits, flags, is_popular, sort_order } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
    }

    const cleanPrice = Number(price);
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    const cleanYearlyPrice = yearly_price !== undefined ? Number(yearly_price) : cleanPrice * 10;

    // Generate unique slug
    let baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    const existing = await query('SELECT id FROM subscription_plans WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const parsedFeatures = Array.isArray(features) ? features : [];
    const cleanLimits = limits && typeof limits === 'object' ? limits : {
      max_staff: Number(max_staff) || 3,
      max_services: 30,
      wa_per_month: 0,
    };
    const cleanFlags = flags && typeof flags === 'object' ? flags : {};

    const res = await query(
      `INSERT INTO subscription_plans (
        name, slug, description, price, yearly_price, billing_interval, features, max_staff, limits, flags, is_popular, sort_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb, $10::jsonb, $11, $12, true)
      RETURNING *`,
      [
        name.trim(),
        slug,
        description?.trim() || null,
        cleanPrice,
        cleanYearlyPrice,
        billing_interval === 'yearly' ? 'yearly' : 'monthly',
        JSON.stringify(parsedFeatures),
        Number(max_staff) || 0,
        JSON.stringify(cleanLimits),
        JSON.stringify(cleanFlags),
        Boolean(is_popular),
        Number(sort_order) || 0,
      ]
    );

    return NextResponse.json({
      success: true,
      plan: res.rows[0],
      message: 'Plan created successfully',
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/plans/route.ts');
  }
}

