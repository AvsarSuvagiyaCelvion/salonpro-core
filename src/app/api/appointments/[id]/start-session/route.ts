import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const { id: appointmentId } = await params;

    await client.query('BEGIN');

    // 1. Fetch appointment
    const apptRes = await client.query(
      `SELECT a.id, a.salon_id, a.customer_id, a.staff_id, a.service_id, a.status,
              sv.name as service_name, sv.price as service_price
       FROM appointments a
       JOIN services sv ON a.service_id = sv.id
       WHERE a.id = $1 FOR UPDATE`,
      [appointmentId]
    );

    if (apptRes.rows.length === 0) {
      throw new Error('Appointment not found');
    }
    const appt = apptRes.rows[0];

    // 2. Create active session
    const sessRes = await client.query(
      `INSERT INTO sessions (salon_id, customer_id, status, started_at)
       VALUES ($1, $2, 'active', now())
       RETURNING *`,
      [appt.salon_id, appt.customer_id]
    );
    const sessionId = sessRes.rows[0].id;

    // 3. Add the service from appointment into session_items
    await client.query(
      `INSERT INTO session_items (session_id, kind, ref_id, name, staff_id, qty, unit_price)
       VALUES ($1, 'service', $2, $3, $4, 1, $5)`,
      [sessionId, appt.service_id, appt.service_name, appt.staff_id, appt.service_price]
    );

    // 4. Mark appointment status as arrived / in progress
    await client.query(
      "UPDATE appointments SET status = 'arrived' WHERE id = $1",
      [appointmentId]
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
