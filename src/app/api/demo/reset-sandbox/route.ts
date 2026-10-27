import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';
import { clearSalonCache } from '@/lib/salon';

export async function POST() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete temporary test bookings, sessions, invoices, and waiting list
    await client.query('DELETE FROM session_items');
    await client.query('DELETE FROM sessions');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM invoices');
    await client.query('DELETE FROM waiting');
    await client.query('DELETE FROM appointments');

    // Ensure demo salon has booking_enabled = false so real external bookings cannot be made
    await client.query(
      `UPDATE salons SET booking_enabled = false WHERE slug = 'glow-studio' OR id = 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d'`
    );

    await client.query('COMMIT');
    clearSalonCache();

    return NextResponse.json({
      success: true,
      message: 'Demo sandbox reset successfully! All test appointments, sessions, and invoices have been cleared.',
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

// GET to quickly reset on page load if ?clean=true
export async function GET() {
  return POST();
}
