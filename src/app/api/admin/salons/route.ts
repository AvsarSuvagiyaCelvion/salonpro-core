import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { clearSalonCache } from '@/lib/salon';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const salons = await query(`
      SELECT 
        s.*,
        sp.name as subscription_plan_name,
        sp.billing_interval as subscription_plan_interval,
        u.email as owner_email,
        u.full_name as owner_name,
        u.phone as owner_phone,
        COALESCE(st.cnt, 0) as staff_count,
        COALESCE(sv.cnt, 0) as services_count,
        COALESCE(c.cnt, 0) as customer_count,
        COALESCE(a.cnt, 0) as appointments_count,
        COALESCE(i.rev, 0)::numeric(10,2) as total_revenue
      FROM salons s
      LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
      LEFT JOIN LATERAL (
        SELECT email, full_name, phone FROM users WHERE salon_id = s.id AND role = 'owner' LIMIT 1
      ) u ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as cnt FROM staff WHERE salon_id = s.id
      ) st ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as cnt FROM services WHERE salon_id = s.id
      ) sv ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as cnt FROM customers WHERE salon_id = s.id
      ) c ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as cnt FROM appointments WHERE salon_id = s.id
      ) a ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(total), 0) as rev FROM invoices WHERE salon_id = s.id
      ) i ON true
      ORDER BY s.created_at ASC
    `);

    return NextResponse.json({ salons: salons.rows });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/salons/route.ts');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { name, slug, brand_color, open_time, close_time, phone, address } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Salon name and slug are required.' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');

    // Check slug uniqueness
    const exists = await query(`SELECT id FROM salons WHERE slug = $1 LIMIT 1`, [cleanSlug]);
    if (exists.rows.length > 0) {
      return NextResponse.json({ error: 'Salon with this slug already exists.' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO salons (
        name, slug, brand_color, open_time, close_time, phone, address
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      ) RETURNING *`,
      [
        name.trim(),
        cleanSlug,
        brand_color || '#D4A77F',
        open_time || '10:00:00',
        close_time || '19:00:00',
        phone || null,
        address || null,
      ]
    );
    const newSalon = res.rows[0];

    // Clear salon cache
    clearSalonCache();

    return NextResponse.json({ success: true, salon: newSalon });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/salons/route.ts');
  }
}
