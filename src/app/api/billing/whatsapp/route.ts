import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { checkLimit, incrementUsage } from '@/lib/plan';
import { sendWhatsAppInvoiceReceipt } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;

    // Check monthly WhatsApp messaging quota (Basic: 0, Pro: 200, Premium: 1000)
    const limitCheck = await checkLimit('wa_per_month', salonId);
    if (!limitCheck.success) {
      return limitCheck.error;
    }

    const { invoice_id } = await request.json();
    if (!invoice_id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Fetch invoice along with salon and customer details
    const invRes = await query(
      `SELECT i.*, 
              s.name as salon_name, s.phone as salon_phone,
              c.name as customer_name, c.mobile as customer_mobile
       FROM invoices i
       JOIN salons s ON i.salon_id = s.id
       JOIN customers c ON i.customer_id = c.id
       WHERE i.id = $1 AND i.salon_id = $2
       LIMIT 1`,
      [invoice_id, salonId]
    );

    if (invRes.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found in this salon' }, { status: 404 });
    }

    const inv = invRes.rows[0];

    // Check total paid so far
    const payRes = await query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1',
      [inv.id]
    );
    const totalPaid = parseFloat(payRes.rows[0]?.total_paid || 0);
    const balanceDue = Math.max(0, parseFloat(inv.total) - totalPaid);

    // Call WhatsApp delivery engine
    const waResult = await sendWhatsAppInvoiceReceipt({
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

    // Increment usage counter for this month
    const newCount = await incrementUsage(salonId, 'wa_messages', 1);

    return NextResponse.json({
      success: true,
      invoice: {
        id: inv.id,
        number: inv.number,
        whatsapp_sent: true,
      },
      delivery: waResult,
      usedThisMonth: newCount,
      message: waResult.success
        ? 'Digital bill delivered directly to customer WhatsApp!'
        : waResult.missingCredentials
        ? 'WhatsApp delivery queued. Provider credentials required in environment.'
        : 'WhatsApp delivery attempted.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
