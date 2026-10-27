import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const allowed = ['scheduled', 'arrived', 'done', 'cancelled'];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json({ error: 'Valid status required' }, { status: 400 });
    }

    const res = await query(
      `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const appt = res.rows[0];

    // If marked arrived, add to waiting queue
    if (status === 'arrived') {
      await query(
        `INSERT INTO waiting (salon_id, customer_id)
         VALUES ($1, $2)`,
        [appt.salon_id, appt.customer_id]
      );
    }

    return NextResponse.json({
      appointment: appt,
      message: `Appointment marked as ${status}${status === 'arrived' ? ' and added to Waiting queue' : ''}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query('DELETE FROM appointments WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Appointment deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
