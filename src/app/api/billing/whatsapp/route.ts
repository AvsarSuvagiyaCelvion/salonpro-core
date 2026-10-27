import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { invoice_id } = await request.json();
    if (!invoice_id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const res = await query(
      'UPDATE invoices SET whatsapp_sent = true WHERE id = $1 RETURNING id, number, whatsapp_sent',
      [invoice_id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invoice: res.rows[0],
      message: 'Marked as sent on WhatsApp with two blue ticks!',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
