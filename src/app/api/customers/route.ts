import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';

    let sql = `
      SELECT c.id, c.salon_id, c.name, c.mobile, c.email, c.note, c.birthday, c.created_at,
             COUNT(DISTINCT i.id)::int as visits,
             COALESCE(SUM(i.total), 0)::numeric(10,2) as total_spent
      FROM customers c
      LEFT JOIN invoices i ON c.id = i.customer_id
      WHERE c.salon_id = $1
    `;
    const params: any[] = [salonId];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (c.name ILIKE $2 OR c.mobile ILIKE $2 OR c.email ILIKE $2) `;
    }

    sql += ` GROUP BY c.id ORDER BY c.created_at DESC`;

    const res = await query(sql, params);
    return NextResponse.json({ customers: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const body = await request.json();
    const { name, mobile, email, note, birthday } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    if (!mobile || typeof mobile !== 'string' || mobile.trim().length < 6) {
      return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO customers (salon_id, name, mobile, email, note, birthday, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        salonId,
        name.trim(),
        mobile.trim(),
        email?.trim() || null,
        note?.trim() || null,
        birthday || null,
      ]
    );

    return NextResponse.json({
      customer: { ...res.rows[0], visits: 0, total_spent: 0 },
      message: 'Customer added successfully',
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
