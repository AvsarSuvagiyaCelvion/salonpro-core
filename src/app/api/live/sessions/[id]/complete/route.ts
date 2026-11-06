import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { sendWhatsAppInvoiceReceipt } from '@/lib/whatsapp';
import { getSalonInvoicePrefix, formatInvoiceNumber } from '@/lib/invoice-helper';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTenant(request);
  if (auth.error) return auth.error;

  const salonId = auth.session.salonId;
  const client = await pool.connect();
  let inTransaction = false;

  try {
    const { id: sessionId } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      services_discount_type = 'none', // 'none' | 'percent' | 'fixed'
      services_discount_value = 0,
      products_discount_type = 'none',
      products_discount_value = 0,
      tax_rate = 0,
      auto_deliver_whatsapp = true,
    } = body;

    // Validate discount_type
    const validDiscountTypes = ['none', 'percent', 'fixed'];
    if (!validDiscountTypes.includes(services_discount_type) || !validDiscountTypes.includes(products_discount_type)) {
      return NextResponse.json(
        { error: "Invalid discount type. Must be 'none', 'percent', or 'fixed'." },
        { status: 400 }
      );
    }

    // Validate discount_value (>= 0; if percent <= 100)
    const sDiscVal = parseFloat(services_discount_value) || 0;
    const pDiscVal = parseFloat(products_discount_value) || 0;

    if (sDiscVal < 0 || pDiscVal < 0) {
      return NextResponse.json({ error: 'Discount value cannot be negative.' }, { status: 400 });
    }

    if (services_discount_type === 'percent' && sDiscVal > 100) {
      return NextResponse.json({ error: 'Services discount percentage cannot exceed 100%.' }, { status: 400 });
    }
    if (products_discount_type === 'percent' && pDiscVal > 100) {
      return NextResponse.json({ error: 'Products discount percentage cannot exceed 100%.' }, { status: 400 });
    }

    // Validate tax_rate between 0 and 28
    const numericTaxRate = Math.max(0, parseFloat(tax_rate) || 0);
    if (numericTaxRate < 0 || numericTaxRate > 28) {
      return NextResponse.json({ error: 'Tax rate must be between 0% and 28%.' }, { status: 400 });
    }

    await client.query('BEGIN');
    inTransaction = true;

    // 1. Fetch session scoped strictly to caller's salon
    const sessRes = await client.query(
      `SELECT s.id, s.salon_id, s.customer_id, s.status,
              c.name as customer_name, c.mobile as customer_mobile,
              sal.name as salon_name, sal.slug as salon_slug, sal.phone as salon_phone,
              sal.invoice_prefix as salon_invoice_prefix
       FROM sessions s
       JOIN customers c ON s.customer_id = c.id
       JOIN salons sal ON s.salon_id = sal.id
       WHERE s.id = $1 AND s.salon_id = $2 FOR UPDATE`,
      [sessionId, salonId]
    );

    if (sessRes.rows.length === 0) {
      await client.query('ROLLBACK');
      inTransaction = false;
      return NextResponse.json({ error: 'Session not found in this salon' }, { status: 404 });
    }
    const session = sessRes.rows[0];

    if (session.status === 'completed') {
      await client.query('ROLLBACK');
      inTransaction = false;
      return NextResponse.json({ error: 'Session is already completed' }, { status: 400 });
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

    // 3. Concurrency check & stock validation for all retail products in session
    for (const prodItem of productItems) {
      const prodCheck = await client.query(
        `SELECT id, name, stock FROM products WHERE id = $1 AND salon_id = $2 FOR UPDATE`,
        [prodItem.ref_id, salonId]
      );

      if (prodCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        inTransaction = false;
        return NextResponse.json(
          { error: `Product '${prodItem.name}' not found in inventory.` },
          { status: 400 }
        );
      }

      const availableStock = Number(prodCheck.rows[0].stock);
      const neededQty = Number(prodItem.qty);

      if (availableStock < neededQty) {
        await client.query('ROLLBACK');
        inTransaction = false;
        return NextResponse.json(
          { error: `Insufficient stock for '${prodItem.name}'. Only ${availableStock} units remaining.` },
          { status: 400 }
        );
      }

      // Atomically decrement stock
      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2 AND salon_id = $3`,
        [neededQty, prodItem.ref_id, salonId]
      );
    }

    // 4. Server-side totals calculation: total = Math.max(0, subtotal - discount + tax)
    let srvDiscAmount = 0;
    if (services_discount_type === 'percent') {
      srvDiscAmount = (servicesSubtotal * sDiscVal) / 100;
    } else if (services_discount_type === 'fixed') {
      srvDiscAmount = Math.min(servicesSubtotal, sDiscVal);
    }

    let prodDiscAmount = 0;
    if (products_discount_type === 'percent') {
      prodDiscAmount = (productsSubtotal * pDiscVal) / 100;
    } else if (products_discount_type === 'fixed') {
      prodDiscAmount = Math.min(productsSubtotal, pDiscVal);
    }

    const totalSubtotal = servicesSubtotal + productsSubtotal;
    const totalDiscountAmount = Math.min(totalSubtotal, srvDiscAmount + prodDiscAmount);
    const netTaxable = Math.max(0, totalSubtotal - totalDiscountAmount);
    
    // Calculate Tax & final non-negative total
    const taxAmount = Number(((netTaxable * numericTaxRate) / 100).toFixed(2));
    const finalTotal = Math.max(0, Number((netTaxable + taxAmount).toFixed(2)));

    // 5. Generate next invoice number for this salon using row-lock counter & current year
    const currentYear = new Date().getFullYear();
    const counterRes = await client.query(
      `UPDATE salons 
       SET invoice_counter = COALESCE(invoice_counter, 0) + 1 
       WHERE id = $1 
       RETURNING invoice_counter, name, slug, invoice_prefix`,
      [salonId]
    );
    const invSeq = Number(counterRes.rows[0].invoice_counter);
    const prefix = getSalonInvoicePrefix({
      invoice_prefix: counterRes.rows[0].invoice_prefix ?? session.salon_invoice_prefix,
      slug: counterRes.rows[0].slug ?? session.salon_slug,
      name: counterRes.rows[0].name ?? session.salon_name,
    });
    const invNumber = formatInvoiceNumber(prefix, currentYear, invSeq);
    const receiptToken = crypto.randomBytes(16).toString('hex');

    // 6. Create invoice with tax breakdown and unguessable token
    const invRes = await client.query(
      `INSERT INTO invoices (
        salon_id, session_id, number, receipt_token, customer_id, subtotal, 
        discount_type, discount_value, discount_amount, tax_rate, tax_amount, total, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      RETURNING *`,
      [
        salonId,
        session.id,
        invNumber,
        receiptToken,
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

    // 7. Mark session as completed
    await client.query(
      "UPDATE sessions SET status = 'completed' WHERE id = $1 AND salon_id = $2",
      [sessionId, salonId]
    );

    await client.query('COMMIT');
    inTransaction = false;

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
          receiptToken: createdInvoice.receipt_token,
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
    if (inTransaction) {
      try {
        await client.query('ROLLBACK');
      } catch {}
    }
    console.error('Session completion error:', error);
    return serverError(error, 'src/app/api/live/sessions/[id]/complete/route.ts');
  } finally {
    client.release();
  }
}
