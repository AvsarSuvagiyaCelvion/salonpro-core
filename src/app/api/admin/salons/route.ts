import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAdminSessionToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const salons = await query(`
      SELECT 
        s.*,
        COUNT(DISTINCT st.id) as staff_count,
        COUNT(DISTINCT sv.id) as services_count,
        COUNT(DISTINCT c.id) as customer_count,
        COUNT(DISTINCT a.id) as appointments_count
      FROM salons s
      LEFT JOIN staff st ON s.id = st.salon_id
      LEFT JOIN services sv ON s.id = sv.salon_id
      LEFT JOIN customers c ON s.id = c.salon_id
      LEFT JOIN appointments a ON s.id = a.salon_id
      GROUP BY s.id
      ORDER BY s.created_at ASC
    `);

    return NextResponse.json({ salons: salons.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAdminSessionToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    return NextResponse.json({ success: true, salon: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
