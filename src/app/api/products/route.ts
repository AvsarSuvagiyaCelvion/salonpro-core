import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDefaultSalonId } from '@/lib/salon';

export async function GET(request: Request) {
  try {
    const salonId = await getDefaultSalonId();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all | low_stock | active
    const q = searchParams.get('q')?.trim() || '';

    let sql = `
      SELECT id, name, brand, sku, price, cost_price, stock, min_stock, active, created_at,
             (stock <= min_stock) as is_low_stock
      FROM products
      WHERE salon_id = $1
    `;
    const params: any[] = [salonId];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (name ILIKE $${params.length} OR brand ILIKE $${params.length} OR sku ILIKE $${params.length}) `;
    }

    if (filter === 'low_stock') {
      sql += ` AND stock <= min_stock `;
    } else if (filter === 'active') {
      sql += ` AND active = true `;
    }

    sql += ` ORDER BY (stock <= min_stock) DESC, name ASC `;

    const res = await query(sql, params);

    return NextResponse.json({
      products: res.rows,
      totalCount: res.rows.length,
      lowStockCount: res.rows.filter((p) => p.is_low_stock).length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const salonId = await getDefaultSalonId();
    const body = await request.json();

    const {
      name,
      brand,
      sku,
      price,
      cost_price = 0,
      stock = 0,
      min_stock = 5,
      active = true,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Product name and selling price are required.' },
        { status: 400 }
      );
    }

    const res = await query(
      `INSERT INTO products (
        salon_id, name, brand, sku, price, cost_price, stock, min_stock, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        salonId,
        name.trim(),
        brand ? brand.trim() : null,
        sku ? sku.trim() : null,
        Number(price),
        Number(cost_price),
        parseInt(stock, 10) || 0,
        parseInt(min_stock, 10) || 5,
        Boolean(active),
      ]
    );

    return NextResponse.json({
      product: res.rows[0],
      message: 'Product added successfully',
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
