import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDefaultSalonId } from '@/lib/salon';

export async function GET() {
  try {
    const salonId = await getDefaultSalonId();
    const res = await query(
      `SELECT id, salon_id, name, category, description, duration_min, price, online_enabled, created_at
       FROM services
       WHERE salon_id = $1
       ORDER BY category ASC, name ASC`,
      [salonId]
    );

    return NextResponse.json({ services: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const salonId = await getDefaultSalonId();
    const body = await request.json();
    const { name, category, description, duration_min, price, online_enabled } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    const duration = parseInt(duration_min, 10);
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json({ error: 'Duration must be a positive number of minutes' }, { status: 400 });
    }
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Price must be a valid non-negative number' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO services (salon_id, name, category, description, duration_min, price, online_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        salonId,
        name.trim(),
        category.trim(),
        description?.trim() || null,
        duration,
        numericPrice,
        online_enabled ?? true,
      ]
    );

    return NextResponse.json({ service: res.rows[0], message: 'Service added successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
