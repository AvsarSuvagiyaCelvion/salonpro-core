import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool, { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { DEMO_INVOICES } from '@/lib/demo-data';
import { getSalonInvoicePrefix, formatInvoiceNumber } from '@/lib/invoice-helper';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({
        invoices: DEMO_INVOICES,
        pagination: {
          page: 1,
          pageSize: 50,
          totalRecords: DEMO_INVOICES.length,
          totalPages: 1,
        },
      });
    }

    const salonId = auth.session.salonId;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const statusFilter = searchParams.get('status')?.trim().toLowerCase() || 'all';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
    const offset = (page - 1) * pageSize;

    let baseSql = `
      SELECT i.id, i.number, i.receipt_token, i.session_id, i.subtotal, i.discount_type, 
              i.discount_value, i.discount_amount, i.tax_rate, i.tax_amount, i.total, i.whatsapp_sent, i.created_at,
              c.id as customer_id, c.name as customer_name, c.mobile as customer_mobile,
              s.name as salon_name, s.phone as salon_phone, s.address as salon_address, s.logo_url,
              COALESCE(SUM(p.amount), 0)::numeric(10,2) as paid_amount,
              (i.total - COALESCE(SUM(p.amount), 0))::numeric(10,2) as due_amount,
              CASE 
                WHEN (i.total - COALESCE(SUM(p.amount), 0)) <= 0 THEN 'paid'
                WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'partial'
                ELSE 'pending'
              END as status,
              COUNT(*) OVER() as full_count
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN salons s ON i.salon_id = s.id
      LEFT JOIN payments p ON i.id = p.invoice_id
      WHERE i.salon_id = $1
    `;
    const params: any[] = [salonId];
    let idx = 2;

    if (q) {
      params.push(`%${q}%`);
      baseSql += ` AND (i.number ILIKE $${idx} OR c.name ILIKE $${idx} OR c.mobile ILIKE $${idx}) `;
      idx++;
    }

    baseSql += ` GROUP BY i.id, c.id, s.id `;

    if (statusFilter === 'paid') {
      baseSql += ` HAVING (i.total - COALESCE(SUM(p.amount), 0)) <= 0 `;
    } else if (statusFilter === 'partial') {
      baseSql += ` HAVING (i.total - COALESCE(SUM(p.amount), 0)) > 0 AND COALESCE(SUM(p.amount), 0) > 0 `;
    } else if (statusFilter === 'pending') {
      baseSql += ` HAVING COALESCE(SUM(p.amount), 0) = 0 `;
    }

    baseSql += ` ORDER BY i.created_at DESC `;
    baseSql += ` LIMIT $${idx++} OFFSET $${idx++} `;
    params.push(pageSize, offset);

    const res = await query(baseSql, params);

    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Fetch session items for these invoices to show breakdown on receipt
    const sessionIds = res.rows.map((r) => r.session_id).filter(Boolean);
    const itemsMap: Record<string, any[]> = {};

    if (sessionIds.length > 0) {
      const itemsRes = await query(
        `SELECT session_id, kind, name, qty, unit_price 
         FROM session_items 
         WHERE session_id = ANY($1::uuid[])`,
        [sessionIds]
      );
      for (const item of itemsRes.rows) {
        if (!itemsMap[item.session_id]) itemsMap[item.session_id] = [];
        itemsMap[item.session_id].push(item);
      }
    }

    const invoices = res.rows.map((inv) => {
      const { full_count, ...cleanedInv } = inv;
      return {
        ...cleanedInv,
        items: cleanedInv.session_id ? itemsMap[cleanedInv.session_id] || [] : [],
      };
    });

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/billing/route.ts:GET');
  }
}

/**
 * Direct POS Invoice Creation Endpoint
 */
export async function POST(request: Request) {
  const auth = await requireTenant(request);
  if (auth.error) return auth.error;

  const salonId = auth.session.salonId;
  const isDemo = auth.session.salonSlug === 'dixa-beauty-salon';

  const body = await request.json().catch(() => ({}));
  const {
    customerId: inputCustomerId,
    customerName,
    customerMobile,
    items = [],
    discountType = 'none',
    discountValue = 0,
    taxRate = 0,
    paymentMethod = 'cash',
    paidAmount = 0,
    paymentReference = '',
  } = body;

  const cleanName = customerName?.trim() || 'Valued Client';
  const cleanMobile = (customerMobile?.trim() || '').replace(/[^0-9]/g, '');

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Please add at least one service or retail product to generate an invoice.' },
      { status: 400 }
    );
  }

  // Calculate Subtotal
  let subtotal = 0;
  for (const item of items) {
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
    subtotal += qty * unitPrice;
  }

  // Calculate Discount
  let discountAmount = 0;
  const dVal = Math.max(0, parseFloat(discountValue) || 0);
  if (discountType === 'percent') {
    discountAmount = (subtotal * Math.min(100, dVal)) / 100;
  } else if (discountType === 'fixed') {
    discountAmount = Math.min(subtotal, dVal);
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  // Calculate Tax (e.g., 18%)
  const numericTaxRate = Math.max(0, parseFloat(taxRate) || 0);
  const taxAmount = (discountedSubtotal * numericTaxRate) / 100;
  const grandTotal = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

  const numPaid = Math.max(0, parseFloat(paidAmount) || 0);

  if (isDemo) {
    const mockInvId = `demo-${Date.now()}`;
    const mockToken = `tok-${Date.now()}`;
    const mockNumber = `DIXA-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      success: true,
      invoice: {
        id: mockInvId,
        number: mockNumber,
        receipt_token: mockToken,
        customer_name: cleanName,
        customer_mobile: cleanMobile || '9876543210',
        subtotal: subtotal.toFixed(2),
        discount_amount: discountAmount.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: grandTotal.toFixed(2),
        paid_amount: Math.min(grandTotal, numPaid).toFixed(2),
        due_amount: Math.max(0, grandTotal - numPaid).toFixed(2),
        status: numPaid >= grandTotal ? 'paid' : numPaid > 0 ? 'partial' : 'pending',
        created_at: new Date().toISOString(),
        items,
      },
    });
  }

  const client = await pool.connect();
  let inTransaction = false;

  try {
    await client.query('BEGIN');
    inTransaction = true;

    // 1. Resolve or create customer
    let resolvedCustomerId = inputCustomerId;
    if (!resolvedCustomerId) {
      if (cleanMobile) {
        const findCust = await client.query(
          `SELECT id FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1`,
          [salonId, cleanMobile]
        );
        if (findCust.rows.length > 0) {
          resolvedCustomerId = findCust.rows[0].id;
        }
      }

      if (!resolvedCustomerId) {
        const newCust = await client.query(
          `INSERT INTO customers (salon_id, name, mobile)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [salonId, cleanName, cleanMobile || `WALK-${Date.now()}`]
        );
        resolvedCustomerId = newCust.rows[0].id;
      }
    }

    // 2. Fetch salon details and increment invoice counter
    const salonRes = await client.query(
      `SELECT name, slug, phone, address, logo_url, invoice_prefix, COALESCE(invoice_counter, 0) as invoice_counter
       FROM salons
       WHERE id = $1
       FOR UPDATE`,
      [salonId]
    );

    if (salonRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Salon workspace not found' }, { status: 404 });
    }

    const salon = salonRes.rows[0];
    const prefix = getSalonInvoicePrefix(salon);
    const nextSeq = parseInt(salon.invoice_counter, 10) + 1;
    const year = new Date().getFullYear();
    const invoiceNumber = formatInvoiceNumber(prefix, year, nextSeq);

    await client.query(
      `UPDATE salons SET invoice_counter = $1 WHERE id = $2`,
      [nextSeq, salonId]
    );

    // 3. Create completed session and line items
    const sessRes = await client.query(
      `INSERT INTO sessions (salon_id, customer_id, status)
       VALUES ($1, $2, 'completed')
       RETURNING id`,
      [salonId, resolvedCustomerId]
    );
    const sessionId = sessRes.rows[0].id;

    for (const it of items) {
      const itQty = Math.max(1, parseInt(it.qty, 10) || 1);
      const itPrice = Math.max(0, parseFloat(it.unit_price) || 0);
      const itKind = it.kind === 'product' ? 'product' : 'service';

      await client.query(
        `INSERT INTO session_items (session_id, kind, ref_id, name, qty, unit_price, staff_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sessionId, itKind, it.id || null, it.name, itQty, itPrice, it.staff_id || null]
      );

      // Decrement retail product stock if product
      if (itKind === 'product' && it.id) {
        await client.query(
          `UPDATE products 
           SET stock = GREATEST(0, stock - $1) 
           WHERE id = $2 AND salon_id = $3`,
          [itQty, it.id, salonId]
        );
      }
    }

    // 4. Create Invoice
    const receiptToken = crypto.randomBytes(16).toString('hex');
    const invRes = await client.query(
      `INSERT INTO invoices (
        salon_id, customer_id, session_id, number, receipt_token,
        subtotal, discount_type, discount_value, discount_amount,
        tax_rate, tax_amount, total
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, number, receipt_token, subtotal, discount_amount, tax_amount, total, created_at`,
      [
        salonId,
        resolvedCustomerId,
        sessionId,
        invoiceNumber,
        receiptToken,
        subtotal.toFixed(2),
        discountType,
        dVal.toFixed(2),
        discountAmount.toFixed(2),
        numericTaxRate.toFixed(2),
        taxAmount.toFixed(2),
        grandTotal.toFixed(2),
      ]
    );

    const newInvoice = invRes.rows[0];

    // 5. Record Payment if paid amount > 0
    if (numPaid > 0) {
      const allowedMethods = ['cash', 'card', 'upi', 'online'];
      const cleanMethod = allowedMethods.includes(paymentMethod) ? paymentMethod : 'cash';

      await client.query(
        `INSERT INTO payments (invoice_id, method, amount, reference, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [newInvoice.id, cleanMethod, Math.min(grandTotal, numPaid).toFixed(2), paymentReference || null, 'POS Direct Settlement']
      );
    }

    await client.query('COMMIT');
    inTransaction = false;

    return NextResponse.json({
      success: true,
      invoice: {
        id: newInvoice.id,
        number: newInvoice.number,
        receipt_token: newInvoice.receipt_token,
        customer_name: cleanName,
        customer_mobile: cleanMobile,
        subtotal: newInvoice.subtotal,
        discount_amount: newInvoice.discount_amount,
        tax_amount: newInvoice.tax_amount,
        total: newInvoice.total,
        paid_amount: Math.min(grandTotal, numPaid).toFixed(2),
        due_amount: Math.max(0, grandTotal - numPaid).toFixed(2),
        status: numPaid >= grandTotal ? 'paid' : numPaid > 0 ? 'partial' : 'pending',
        created_at: newInvoice.created_at,
        items,
      },
    });
  } catch (error: any) {
    if (inTransaction) {
      await client.query('ROLLBACK');
    }
    return serverError(error, 'src/app/api/billing/route.ts:POST');
  } finally {
    client.release();
  }
}
