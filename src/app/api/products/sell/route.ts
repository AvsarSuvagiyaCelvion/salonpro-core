import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

// 1. GET Recent Retail Product Sales History
export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { searchParams } = new URL(request.url);
    const staffFilter = searchParams.get('staff_id');

    let sql = `
      SELECT 
        si.id as item_id,
        si.name as product_name,
        si.qty,
        si.unit_price,
        (si.qty * si.unit_price)::numeric(10,2) as total_price,
        s.started_at as sold_at,
        st.id as staff_id,
        st.name as staff_name,
        st.product_commission_pct,
        ((si.qty * si.unit_price) * (st.product_commission_pct / 100))::numeric(10,2) as staff_commission_earned,
        c.id as customer_id,
        c.name as customer_name,
        c.mobile as customer_mobile,
        i.id as invoice_id,
        i.number as invoice_number,
        COALESCE(p.method, 'cash') as payment_method
      FROM session_items si
      JOIN sessions s ON si.session_id = s.id
      JOIN customers c ON s.customer_id = c.id
      LEFT JOIN staff st ON si.staff_id = st.id
      LEFT JOIN invoices i ON i.session_id = s.id
      LEFT JOIN payments p ON p.invoice_id = i.id
      WHERE s.salon_id = $1 AND si.kind = 'product'
    `;
    const params: any[] = [salonId];

    if (staffFilter) {
      params.push(staffFilter);
      sql += ` AND si.staff_id = $${params.length}`;
    }

    sql += ` ORDER BY s.started_at DESC LIMIT 100`;

    const res = await query(sql, params);

    // Compute summary stats
    const statsRes = await query(`
      SELECT 
        COUNT(si.id)::int as total_product_sales_count,
        COALESCE(SUM(si.qty), 0)::int as total_units_sold,
        COALESCE(SUM(si.qty * si.unit_price), 0)::numeric(10,2) as total_retail_revenue,
        COALESCE(SUM((si.qty * si.unit_price) * (COALESCE(st.product_commission_pct, 0) / 100)), 0)::numeric(10,2) as total_staff_commission_paid
      FROM session_items si
      JOIN sessions s ON si.session_id = s.id
      LEFT JOIN staff st ON si.staff_id = st.id
      WHERE s.salon_id = $1 AND si.kind = 'product'
    `, [salonId]);

    return NextResponse.json({
      success: true,
      sales: res.rows,
      stats: statsRes.rows[0] || {
        total_product_sales_count: 0,
        total_units_sold: 0,
        total_retail_revenue: 0,
        total_staff_commission_paid: 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST Record a New Retail Product Sale to Customer by Staff
export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const body = await request.json();

    const {
      productId,
      qty = 1,
      staffId,
      customerId,
      customerName,
      customerMobile,
      paymentMethod = 'cash',
      discountAmount = 0,
      note,
    } = body;

    const quantity = parseInt(qty, 10);
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: 'Product is required' }, { status: 400 });
    }

    if (!staffId) {
      return NextResponse.json({ error: 'Please select which staff member made/recommended this sale' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Verify Product & Check Stock
    const prodRes = await client.query(
      `SELECT id, name, brand, price, cost_price, stock, min_stock 
       FROM products 
       WHERE id = $1 AND salon_id = $2 
       FOR UPDATE`,
      [productId, salonId]
    );

    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Product not found in this salon' }, { status: 404 });
    }

    const product = prodRes.rows[0];
    if (product.stock < quantity) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: `Insufficient inventory stock. Only ${product.stock} units remaining.` },
        { status: 400 }
      );
    }

    // 2. Verify Staff Member
    const staffRes = await client.query(
      `SELECT id, name, product_commission_pct FROM staff WHERE id = $1 AND salon_id = $2`,
      [staffId, salonId]
    );

    if (staffRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Selected staff member not found in this salon' }, { status: 404 });
    }

    const staffMember = staffRes.rows[0];

    // 3. Find or Create Customer
    let activeCustomerId = customerId;
    let finalCustomerName = customerName?.trim() || 'Walk-in Customer';
    let finalCustomerMobile = customerMobile?.trim() || '';

    if (!activeCustomerId) {
      if (finalCustomerMobile) {
        // Find existing by mobile
        const existCust = await client.query(
          `SELECT id, name, mobile FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1`,
          [salonId, finalCustomerMobile]
        );
        if (existCust.rows.length > 0) {
          activeCustomerId = existCust.rows[0].id;
          finalCustomerName = existCust.rows[0].name;
        } else {
          // Insert new customer
          const newCust = await client.query(
            `INSERT INTO customers (salon_id, name, mobile, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id, name, mobile`,
            [salonId, finalCustomerName, finalCustomerMobile]
          );
          activeCustomerId = newCust.rows[0].id;
        }
      } else {
        // Generic walk-in customer
        const walkIn = await client.query(
          `SELECT id FROM customers WHERE salon_id = $1 AND (name ILIKE '%walk-in%' OR mobile = '0000000000') LIMIT 1`,
          [salonId]
        );
        if (walkIn.rows.length > 0) {
          activeCustomerId = walkIn.rows[0].id;
        } else {
          const createWalkIn = await client.query(
            `INSERT INTO customers (salon_id, name, mobile, created_at)
             VALUES ($1, 'Walk-in Client', '0000000000', NOW())
             RETURNING id`,
            [salonId]
          );
          activeCustomerId = createWalkIn.rows[0].id;
        }
      }
    } else {
      const custInfo = await client.query(
        `SELECT name, mobile FROM customers WHERE id = $1 AND salon_id = $2`,
        [activeCustomerId, salonId]
      );
      if (custInfo.rows.length > 0) {
        finalCustomerName = custInfo.rows[0].name;
        finalCustomerMobile = custInfo.rows[0].mobile;
      }
    }

    // 4. Deduct inventory stock
    const updatedStock = product.stock - quantity;
    await client.query(
      `UPDATE products SET stock = $1 WHERE id = $2`,
      [updatedStock, product.id]
    );

    // 5. Create Completed Beauty/Retail Session
    const sessRes = await client.query(
      `INSERT INTO sessions (salon_id, customer_id, status, started_at)
       VALUES ($1, $2, 'completed', NOW())
       RETURNING id`,
      [salonId, activeCustomerId]
    );
    const sessionId = sessRes.rows[0].id;

    // 6. Create Session Item (Kind = 'product', linked to staffId)
    const unitPrice = parseFloat(product.price);
    await client.query(
      `INSERT INTO session_items (session_id, kind, ref_id, name, staff_id, qty, unit_price)
       VALUES ($1, 'product', $2, $3, $4, $5, $6)`,
      [sessionId, product.id, product.name, staffMember.id, quantity, unitPrice]
    );

    // 7. Calculate Invoice Total & Staff Commission
    const subtotal = unitPrice * quantity;
    const discount = Math.min(subtotal, Math.max(0, parseFloat(discountAmount) || 0));
    const total = subtotal - discount;
    const commissionPct = parseFloat(staffMember.product_commission_pct) || 0;
    const commissionEarned = (total * (commissionPct / 100));

    // Generate Invoice Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `RET-${dateStr}-${randomSuffix}`;

    // 8. Create Invoice
    const invRes = await client.query(
      `INSERT INTO invoices (
        salon_id, session_id, number, customer_id, subtotal, discount_type, discount_value, discount_amount, total, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'fixed', $6, $6, $7, NOW())
      RETURNING *`,
      [salonId, sessionId, invoiceNumber, activeCustomerId, subtotal, discount, total]
    );
    const newInvoice = invRes.rows[0];

    // 9. Record Payment
    await client.query(
      `INSERT INTO payments (invoice_id, method, amount, reference, note, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [newInvoice.id, paymentMethod, total, `RETAIL-SALE`, note || `Sold by ${staffMember.name}`]
    );

    // Fetch salon name for receipt
    const salonRes = await client.query('SELECT name, phone FROM salons WHERE id = $1', [salonId]);
    const salonName = salonRes.rows[0]?.name || 'Our Salon';

    await client.query('COMMIT');

    // 10. Generate WhatsApp Receipt Link
    const cleanMobile = finalCustomerMobile.replace(/[^0-9]/g, '');
    let whatsappUrl = null;
    if (cleanMobile.length >= 10) {
      const waMsg = [
        `🧾 *TAX INVOICE / RECEIPT*`,
        `*${salonName}*`,
        `-----------------------------`,
        `Invoice No: *#${invoiceNumber}*`,
        `Date: ${new Date().toLocaleDateString('en-IN')}`,
        `Client: ${finalCustomerName}`,
        `Staff Attendant: *${staffMember.name}*`,
        `-----------------------------`,
        `🛍️ *Retail Product:*`,
        `• ${product.name} (x${quantity}) - ₹${subtotal.toLocaleString('en-IN')}`,
        discount > 0 ? `Discount: -₹${discount.toLocaleString('en-IN')}` : null,
        `-----------------------------`,
        `*Total Paid:* ₹${total.toLocaleString('en-IN')} (${paymentMethod.toUpperCase()})`,
        `-----------------------------`,
        `Thank you for visiting ${salonName}! Have a glowing day! ✨`,
      ]
        .filter(Boolean)
        .join('\n');

      const fullMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
      whatsappUrl = `https://wa.me/${fullMobile}?text=${encodeURIComponent(waMsg)}`;
    }

    return NextResponse.json({
      success: true,
      message: `Product sold successfully! Credited ₹${commissionEarned.toFixed(2)} commission to ${staffMember.name}.`,
      invoice: {
        id: newInvoice.id,
        number: invoiceNumber,
        total,
        customerName: finalCustomerName,
        customerMobile: finalCustomerMobile,
      },
      product: {
        id: product.id,
        name: product.name,
        qty: quantity,
        remainingStock: updatedStock,
        isLowStock: updatedStock <= product.min_stock,
      },
      staff: {
        id: staffMember.id,
        name: staffMember.name,
        commissionPct,
        commissionEarned: Number(commissionEarned.toFixed(2)),
      },
      whatsappUrl,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
