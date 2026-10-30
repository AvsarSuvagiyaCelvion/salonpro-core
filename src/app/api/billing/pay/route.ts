import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { sendWhatsAppInvoiceReceipt } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { invoice_id, method, amount, reference, note, auto_deliver_whatsapp = true } = await request.json();

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

    // Verify invoice belongs to caller's salon & load details for auto-delivery
    const invCheck = await query(
      `SELECT i.*, 
              s.name as salon_name, s.phone as salon_phone,
              c.name as customer_name, c.mobile as customer_mobile
       FROM invoices i
       JOIN salons s ON i.salon_id = s.id
       JOIN customers c ON i.customer_id = c.id
       WHERE i.id = $1 AND i.salon_id = $2 LIMIT 1`,
      [invoice_id, salonId]
    );

    if (invCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found in this salon' }, { status: 404 });
    }

    const inv = invCheck.rows[0];

    const payRes = await query(
      `INSERT INTO payments (invoice_id, method, amount, reference, note, created_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *`,
      [invoice_id, method, numericAmount, reference || null, note || null]
    );

    // Calculate total payments including new payment
    const allPays = await query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1',
      [invoice_id]
    );
    const totalPaid = parseFloat(allPays.rows[0]?.total_paid || 0);
    const balanceDue = Math.max(0, parseFloat(inv.total) - totalPaid);

    // Trigger AUTOMATIC delivery via WhatsApp Cloud API / Twilio
    let waDelivery = null;
    if (auto_deliver_whatsapp) {
      try {
        waDelivery = await sendWhatsAppInvoiceReceipt({
          salonId,
          salonName: inv.salon_name,
          salonPhone: inv.salon_phone,
          invoiceId: inv.id,
          invoiceNumber: inv.number,
          customerId: inv.customer_id,
          customerName: inv.customer_name,
          customerMobile: inv.customer_mobile,
          subtotal: parseFloat(inv.subtotal),
          taxAmount: parseFloat(inv.tax_amount || 0),
          total: parseFloat(inv.total),
          balanceDue,
        });
      } catch (waErr) {
        console.error('Auto-WhatsApp delivery exception on checkout:', waErr);
      }
    }

    return NextResponse.json({
      payment: payRes.rows[0],
      delivery: waDelivery,
      totalPaid,
      balanceDue,
      message: 'Payment recorded and invoice processed successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
