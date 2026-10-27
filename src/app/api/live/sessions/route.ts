import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getDefaultSalonId } from '@/lib/salon';

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const salonId = await getDefaultSalonId();
    const { customer_id, waiting_id } = await request.json();

    if (!customer_id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Create active session
    const sessRes = await client.query(
      `INSERT INTO sessions (salon_id, customer_id, status, started_at)
       VALUES ($1, $2, 'active', now())
       RETURNING *`,
      [salonId, customer_id]
    );

    // 2. Remove from waiting queue if waiting_id provided
    if (waiting_id) {
      await client.query('DELETE FROM waiting WHERE id = $1', [waiting_id]);
    } else {
      await client.query(
        'DELETE FROM waiting WHERE salon_id = $1 AND customer_id = $2',
        [salonId, customer_id]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      session: sessRes.rows[0],
      message: 'Session started successfully',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
