import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const {
      services_discount_type = 'none', // 'none' | 'percent' | 'fixed'
      services_discount_value = 0,
      products_discount_type = 'none',
      products_discount_value = 0,
    } = body;

    await client.query('BEGIN');

    // 1. Fetch session
    const sessRes = await client.query(
      'SELECT id, salon_id, customer_id, status FROM sessions WHERE id = $1 FOR UPDATE',
      [sessionId]
    );

    if (sessRes.rows.length === 0) {
      throw new Error('Session not found');
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
    const finalTotal = Math.max(0, totalSubtotal - totalDiscountAmount);

    // 4. Generate next invoice number
    const countRes = await client.query(
      'SELECT COUNT(*) as count FROM invoices WHERE salon_id = $1',
      [session.salon_id]
    );
    const invSeq = Number(countRes.rows[0].count) + 1;
    const invNumber = `INV-2026-${invSeq.toString().padStart(4, '0')}`;

    // 5. Create invoice
    const invRes = await client.query(
      `INSERT INTO invoices (
        salon_id, session_id, number, customer_id, subtotal, 
        discount_type, discount_value, discount_amount, total, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      RETURNING *`,
      [
        session.salon_id,
        session.id,
        invNumber,
        session.customer_id,
        totalSubtotal,
        services_discount_type !== 'none' ? services_discount_type : products_discount_type,
        services_discount_value || products_discount_value || 0,
        totalDiscountAmount,
        finalTotal,
      ]
    );

    // 6. Reduce inventory stock for all products used
    for (const prodItem of productItems) {
      await client.query(
        `UPDATE products 
         SET stock = GREATEST(0, stock - $1)
         WHERE id = $2`,
        [prodItem.qty, prodItem.ref_id]
      );
    }

    // 7. Mark session as completed
    await client.query(
      "UPDATE sessions SET status = 'completed' WHERE id = $1",
      [sessionId]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      invoice: invRes.rows[0],
      message: `Session completed. Invoice ${invNumber} generated for collection.`,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
