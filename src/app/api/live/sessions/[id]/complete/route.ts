import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { sendWhatsAppInvoiceReceipt } from '@/lib/whatsapp';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTenant(request);
  if (auth.error) return auth.error;

  const salonId = auth.session.salonId;
  const client = await pool.connect();
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const {
      services_discount_type = 'none', // 'none' | 'percent' | 'fixed'
      services_discount_value = 0,
      products_discount_type = 'none',
      products_discount_value = 0,
      tax_rate = 0,
      auto_deliver_whatsapp = true,
    } = body;

    await client.query('BEGIN');

    // 1. Fetch session scoped strictly to caller's salon
    const sessRes = await client.query(
      `SELECT s.id, s.salon_id, s.customer_id, s.status,
              c.name as customer_name, c.mobile as customer_mobile,
              sal.name as salon_name, sal.phone as salon_phone
       FROM sessions s
       JOIN customers c ON s.customer_id = c.id
       JOIN salons sal ON s.salon_id = sal.id
       WHERE s.id = $1 AND s.salon_id = $2 FOR UPDATE`,
      [sessionId, salonId]
    );

    if (sessRes.rows.length === 0) {
      throw new Error('Session not found in this salon');
    }
    const session = sessRes.rows[0];

    if (session.status === 'completed') {
      throw new Error('Session is already completed');
    }

    // 2. Fetch session items
    const itemsRes = await client.query(
      'SELECT id, kind, ref_id, name, qty, unit_price, staff_id FROM session_items WHERE session_id = $1',
      [sessionId]
    );

    let servicesSubtotal = 0;
    let productsSubtotal = 0;
    const productItems: any[] = [];

    for (const item of itemsRes.rows) {
      const lineTotal = Number(item.qty) * Number(item.unit_price);
      if (item.kind === 'service') {
        servicesSubtotal += lineTotal;
      } else {
        productsSubtotal += lineTotal;
        productItems.push(item);
      }
    }

    // 3. Calculate discounts
    let srvDiscAmount = 0;
    if (services_discount_type === 'percent') {
      srvDiscAmount = (servicesSubtotal * Number(services_discount_value)) / 100;
    } else if (services_discount_type === 'fixed') {
      srvDiscAmount = Math.min(servicesSubtotal, Number(services_discount_value));
    }

    let prodDiscAmount = 0;
    if (products_discount_type === 'percent') {
      prodDiscAmount = (productsSubtotal * Number(products_discount_value)) / 100;
    } else if (products_discount_type === 'fixed') {
      prodDiscAmount = Math.min(productsSubtotal, Number(products_discount_value));
    }

    const totalSubtotal = servicesSubtotal + productsSubtotal;
    const totalDiscountAmount = srvDiscAmount + prodDiscAmount;
    const netTaxable = Math.max(0, totalSubtotal - totalDiscountAmount);
    
    // Calculate Tax
    const numericTaxRate = Math.max(0, parseFloat(tax_rate) || 0);
    const taxAmount = Number(((netTaxable * numericTaxRate) / 100).toFixed(2));
    const finalTotal = Number((netTaxable + taxAmount).toFixed(2));

    // 4. Generate next invoice number for this salon
    const countRes = await client.query(
      'SELECT COUNT(*) as count FROM invoices WHERE salon_id = $1',
      [salonId]
    );
    const invSeq = Number(countRes.rows[0].count) + 1;
    const invNumber = `INV-2026-${invSeq.toString().padStart(4, '0')}`;

    // 5. Create invoice with tax breakdown
    const invRes = await client.query(
      `INSERT INTO invoices (
        salon_id, session_id, number, customer_id, subtotal, 
        discount_type, discount_value, discount_amount, tax_rate, tax_amount, total, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
      RETURNING *`,
      [
        salonId,
        session.id,
        invNumber,
        session.customer_id,
        totalSubtotal,
        services_discount_type !== 'none' ? services_discount_type : products_discount_type,
        services_discount_value || products_discount_value || 0,
        totalDiscountAmount,
        numericTaxRate,
        taxAmount,
        finalTotal,
      ]
    );

    // 6. Reduce inventory stock for all products used (scoped to this salon)
    for (const prodItem of productItems) {
      await client.query(
        `UPDATE products 
         SET stock = GREATEST(0, stock - $1)
         WHERE id = $2 AND salon_id = $3`,
        [prodItem.qty, prodItem.ref_id, salonId]
      );
    }

    // 7. Mark session as completed
    await client.query(
      "UPDATE sessions SET status = 'completed' WHERE id = $1 AND salon_id = $2",
      [sessionId, salonId]
    );

    await client.query('COMMIT');

    const createdInvoice = invRes.rows[0];

    // 8. Automatic WhatsApp delivery on checkout completion
    let waDelivery = null;
    if (auto_deliver_whatsapp) {
      try {
        waDelivery = await sendWhatsAppInvoiceReceipt({
          salonId,
          salonName: session.salon_name,
          salonPhone: session.salon_phone,
          invoiceId: createdInvoice.id,
          invoiceNumber: createdInvoice.number,
          customerId: session.customer_id,
          customerName: session.customer_name,
          customerMobile: session.customer_mobile,
          subtotal: totalSubtotal,
          taxAmount,
          total: finalTotal,
          balanceDue: finalTotal,
        });
      } catch (waErr) {
        console.error('Auto-WhatsApp delivery exception on session completion:', waErr);
      }
    }

    return NextResponse.json({
      invoice: createdInvoice,
      delivery: waDelivery,
      message: `Session completed. Invoice ${invNumber} generated for collection.`,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
