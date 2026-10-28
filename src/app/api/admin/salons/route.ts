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
        u.email as owner_email,
        u.full_name as owner_name,
        u.phone as owner_phone,
        COUNT(DISTINCT st.id) as staff_count,
        COUNT(DISTINCT sv.id) as services_count,
        COUNT(DISTINCT c.id) as customer_count,
        COUNT(DISTINCT a.id) as appointments_count,
        COALESCE(SUM(i.total), 0)::numeric(10,2) as total_revenue
      FROM salons s
      LEFT JOIN LATERAL (
        SELECT email, full_name, phone FROM users WHERE salon_id = s.id AND role = 'owner' LIMIT 1
      ) u ON true
      LEFT JOIN staff st ON s.id = st.salon_id
      LEFT JOIN services sv ON s.id = sv.salon_id
      LEFT JOIN customers c ON s.id = c.salon_id
      LEFT JOIN appointments a ON s.id = a.salon_id
      LEFT JOIN invoices i ON s.id = i.salon_id
      GROUP BY s.id, u.email, u.full_name, u.phone
      ORDER BY s.created_at ASC
    `);

    return NextResponse.json({ salons: salons.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
        brand_color || '#b3135b',
        open_time || '10:00:00',
        close_time || '19:00:00',
        phone || null,
        address || null,
      ]
    );
    const newSalon = res.rows[0];

    // Clear salon cache
    clearSalonCache();

    // Seed standard starter services for immediate live client booking demo
    const s1 = await query(
      `INSERT INTO services (salon_id, name, category, description, duration_min, price, online_enabled)
       VALUES ($1, 'Haircut & Styling', 'Hair', 'Precision haircut, hair wash and styling finish', 30, 500, true) RETURNING id`,
      [newSalon.id]
    );
    const s2 = await query(
      `INSERT INTO services (salon_id, name, category, description, duration_min, price, online_enabled)
       VALUES ($1, 'Hair Spa & Conditioning', 'Hair', 'Deep conditioning spa treatment for hair repair and shine', 45, 1000, true) RETURNING id`,
      [newSalon.id]
    );
    const s3 = await query(
      `INSERT INTO services (salon_id, name, category, description, duration_min, price, online_enabled)
       VALUES ($1, 'Facial & Glow Therapy', 'Skin', 'Deep pore cleansing and refreshing skin hydration', 45, 800, true) RETURNING id`,
      [newSalon.id]
    );

    // Seed 1 default staff stylist
    const staffRes = await query(
      `INSERT INTO staff (salon_id, name, role_title, service_commission_pct, product_commission_pct, active, show_online)
       VALUES ($1, 'Senior Stylist', 'Hair & Beauty Specialist', 10, 5, true, true) RETURNING id`,
      [newSalon.id]
    );

    // Map staff to services
    if (staffRes.rows.length > 0) {
      const staffId = staffRes.rows[0].id;
      for (const s of [s1, s2, s3]) {
        if (s.rows.length > 0) {
          await query(
            `INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [staffId, s.rows[0].id]
          );
        }
      }
    }

    return NextResponse.json({ success: true, salon: newSalon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
