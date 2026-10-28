import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTenant(request);
  if (auth.error) return auth.error;

  const salonId = auth.session.salonId;
  const client = await pool.connect();
  try {
    const { id: appointmentId } = await params;

    await client.query('BEGIN');

    // 1. Fetch appointment scoped strictly to this salon
    const apptRes = await client.query(
      `SELECT a.id, a.salon_id, a.customer_id, a.staff_id, a.service_id, a.status,
              sv.name as service_name, sv.price as service_price
       FROM appointments a
       JOIN services sv ON a.service_id = sv.id
       WHERE a.id = $1 AND a.salon_id = $2 FOR UPDATE`,
      [appointmentId, salonId]
    );

    if (apptRes.rows.length === 0) {
      throw new Error('Appointment not found in this salon');
    }
    const appt = apptRes.rows[0];

    // 2. Create active session for this salon
    const sessRes = await client.query(
      `INSERT INTO sessions (salon_id, customer_id, status, started_at)
       VALUES ($1, $2, 'active', now())
       RETURNING *`,
      [salonId, appt.customer_id]
    );
    const sessionId = sessRes.rows[0].id;

    // 3. Add the service from appointment into session_items
    await client.query(
      `INSERT INTO session_items (session_id, kind, ref_id, name, staff_id, qty, unit_price)
       VALUES ($1, 'service', $2, $3, $4, 1, $5)`,
      [sessionId, appt.service_id, appt.service_name, appt.staff_id, appt.service_price]
    );

    // 4. Mark appointment status as arrived
    await client.query(
      "UPDATE appointments SET status = 'arrived' WHERE id = $1 AND salon_id = $2",
      [appointmentId, salonId]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      session_id: sessionId,
      message: 'Active session started from appointment! Moved to Live Studio floor.',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
