import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';
import { clearSalonCache } from '@/lib/salon';
import { requireTenant } from '@/lib/api-auth';

export async function POST(request: Request) {
  // 1. Strict DEMO_MODE guard
  if (process.env.DEMO_MODE !== 'true') {
    return NextResponse.json(
      { error: 'Forbidden: Sandbox reset is only enabled when DEMO_MODE=true is configured.' },
      { status: 403 }
    );
  }

  // 2. Caller must be an authenticated tenant session
  const auth = await requireTenant(request);
  if (auth.error) {
    return auth.error;
  }

  // 3. Must identify demo salon and ensure we do NOT touch other tenants
  const salonRes = await query(
    `SELECT id, slug, is_demo FROM salons WHERE slug = 'glow-studio' OR is_demo = true LIMIT 1`
  );
  if (salonRes.rows.length === 0) {
    return NextResponse.json(
      { error: 'No demo salon configured in the platform.' },
      { status: 404 }
    );
  }

  const demoSalonId = salonRes.rows[0].id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Scoped deletes strictly for demoSalonId
    await client.query(
      `DELETE FROM session_items WHERE session_id IN (SELECT id FROM sessions WHERE salon_id = $1)`,
      [demoSalonId]
    );
    await client.query(`DELETE FROM sessions WHERE salon_id = $1`, [demoSalonId]);
    await client.query(
      `DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE salon_id = $1)`,
      [demoSalonId]
    );
    await client.query(`DELETE FROM invoices WHERE salon_id = $1`, [demoSalonId]);
    await client.query(`DELETE FROM waiting WHERE salon_id = $1`, [demoSalonId]);
    await client.query(`DELETE FROM appointments WHERE salon_id = $1`, [demoSalonId]);

    // Keep booking disabled for demo salon so random internet bookings don't pollute
    await client.query(
      `UPDATE salons SET booking_enabled = false WHERE id = $1`,
      [demoSalonId]
    );

    await client.query('COMMIT');
    clearSalonCache();

    return NextResponse.json({
      success: true,
      message: 'Demo sandbox reset successfully! Test appointments and sessions have been cleared.',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json(
      { error: error.message || 'Failed to reset demo sandbox' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
