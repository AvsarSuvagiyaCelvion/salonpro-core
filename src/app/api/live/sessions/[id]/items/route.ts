import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { kind, ref_id, staff_id, qty = 1 } = body;

    if (!kind || !['service', 'product'].includes(kind)) {
      return NextResponse.json({ error: 'Kind must be service or product' }, { status: 400 });
    }

    if (kind === 'service') {
      const srvRes = await query('SELECT id, name, price FROM services WHERE id = $1', [ref_id]);
      if (srvRes.rows.length === 0) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
      const service = srvRes.rows[0];

      const itemRes = await query(
        `INSERT INTO session_items (session_id, kind, ref_id, name, staff_id, qty, unit_price)
         VALUES ($1, 'service', $2, $3, $4, $5, $6)
         RETURNING *`,
        [sessionId, service.id, service.name, staff_id || null, qty, service.price]
      );

      return NextResponse.json({ item: itemRes.rows[0], message: 'Service added to session' });
    } else {
      // Product
      const prodRes = await query('SELECT id, name, price, stock FROM products WHERE id = $1', [ref_id]);
      if (prodRes.rows.length === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      const product = prodRes.rows[0];

      if (product.stock <= 0) {
        return NextResponse.json(
          { error: `Cannot add product "${product.name}" - Stock is 0 (Out of stock)!` },
          { status: 400 }
        );
      }

      if (product.stock < qty) {
        return NextResponse.json(
          { error: `Cannot add ${qty} units. Only ${product.stock} in stock.` },
          { status: 400 }
        );
      }

      const itemRes = await query(
        `INSERT INTO session_items (session_id, kind, ref_id, name, staff_id, qty, unit_price)
         VALUES ($1, 'product', $2, $3, $4, $5, $6)
         RETURNING *`,
        [sessionId, product.id, product.name, staff_id || null, qty, product.price]
      );

      return NextResponse.json({ item: itemRes.rows[0], message: 'Product added to session' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
