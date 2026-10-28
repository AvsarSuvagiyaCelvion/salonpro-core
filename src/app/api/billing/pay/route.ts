import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { invoice_id, method, amount, reference, note } = await request.json();

    if (!invoice_id || !method || !amount) {
      return NextResponse.json(
        { error: 'Invoice ID, payment method, and amount are required' },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount required' }, { status: 400 });
    }

    // Verify invoice belongs to caller's salon
    const invCheck = await query(
      'SELECT id FROM invoices WHERE id = $1 AND salon_id = $2 LIMIT 1',
      [invoice_id, salonId]
    );
    if (invCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found in this salon' }, { status: 404 });
    }

    const payRes = await query(
      `INSERT INTO payments (invoice_id, method, amount, reference, note, created_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *`,
      [invoice_id, method, numericAmount, reference || null, note || null]
    );

    return NextResponse.json({
      payment: payRes.rows[0],
      message: 'Payment recorded successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
