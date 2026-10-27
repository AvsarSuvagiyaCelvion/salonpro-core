import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
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
