import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function POST(request: Request) {
  const auth = await requireTenant(request);
  if (auth.error) return auth.error;

  const salonId = auth.session.salonId;
  const client = await pool.connect();
  try {
    const { customer_id, waiting_id } = await request.json();

    if (!customer_id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // Verify customer belongs to caller's salon
    const custRes = await client.query(
      'SELECT id FROM customers WHERE id = $1 AND salon_id = $2 LIMIT 1',
      [customer_id, salonId]
    );
    if (custRes.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found in this salon' }, { status: 404 });
    }

    await client.query('BEGIN');

    // 1. Create active session scoped to caller's salon
    const sessRes = await client.query(
      `INSERT INTO sessions (salon_id, customer_id, status, started_at)
       VALUES ($1, $2, 'active', now())
       RETURNING *`,
      [salonId, customer_id]
    );

    // 2. Remove from waiting queue scoped to caller's salon
    if (waiting_id) {
      await client.query('DELETE FROM waiting WHERE id = $1 AND salon_id = $2', [waiting_id, salonId]);
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
