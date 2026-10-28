import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { id } = await params;
    const body = await request.json();
    const { name, category, description, duration_min, price, online_enabled } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const duration = parseInt(duration_min, 10);
    const numericPrice = parseFloat(price);

    const res = await query(
      `UPDATE services 
       SET name = $1, category = $2, description = $3, duration_min = $4, price = $5, online_enabled = $6
       WHERE id = $7 AND salon_id = $8
       RETURNING *`,
      [
        name.trim(),
        category.trim(),
        description?.trim() || null,
        duration,
        numericPrice,
        online_enabled,
        id,
        salonId,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Service not found in this salon' }, { status: 404 });
    }

    return NextResponse.json({ service: res.rows[0], message: 'Service updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { id } = await params;
    const body = await request.json();
    const { online_enabled } = body;

    const res = await query(
      `UPDATE services 
       SET online_enabled = $1
       WHERE id = $2 AND salon_id = $3
       RETURNING *`,
      [Boolean(online_enabled), id, salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Service not found in this salon' }, { status: 404 });
    }

    return NextResponse.json({ service: res.rows[0], message: 'Online booking status updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { id } = await params;

    const res = await query(
      'DELETE FROM services WHERE id = $1 AND salon_id = $2 RETURNING id',
      [id, salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Service not found in this salon' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Service deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
