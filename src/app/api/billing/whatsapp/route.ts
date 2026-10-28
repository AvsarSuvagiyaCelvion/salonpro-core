import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { invoice_id } = await request.json();
    if (!invoice_id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const res = await query(
      'UPDATE invoices SET whatsapp_sent = true WHERE id = $1 AND salon_id = $2 RETURNING id, number, whatsapp_sent',
      [invoice_id, salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found in this salon' }, { status: 404 });
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
