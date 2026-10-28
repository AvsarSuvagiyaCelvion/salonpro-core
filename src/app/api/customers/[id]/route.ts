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
    const { name, mobile, email, note, birthday } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!mobile || mobile.trim().length < 6) {
      return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
    }

    const res = await query(
      `UPDATE customers
       SET name = $1, mobile = $2, email = $3, note = $4, birthday = $5
       WHERE id = $6 AND salon_id = $7
       RETURNING *`,
      [name.trim(), mobile.trim(), email?.trim() || null, note?.trim() || null, birthday || null, id, salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found in this salon' }, { status: 404 });
    }

    return NextResponse.json({ customer: res.rows[0], message: 'Customer updated successfully' });
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
      'DELETE FROM customers WHERE id = $1 AND salon_id = $2 RETURNING id',
      [id, salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found in this salon' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Customer deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
