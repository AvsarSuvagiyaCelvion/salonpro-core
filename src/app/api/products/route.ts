import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { DEMO_PRODUCTS } from '@/lib/demo-data';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({ products: DEMO_PRODUCTS });
    }

    const salonId = auth.session.salonId;
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
    return serverError(error, 'src/app/api/products/route.ts');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
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

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO products (
        salon_id, name, brand, sku, price, cost_price, stock, min_stock, active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [
        salonId,
        name.trim(),
        brand?.trim() || null,
        sku?.trim() || null,
        numericPrice,
        parseFloat(cost_price) || 0,
        parseInt(stock, 10) || 0,
        parseInt(min_stock, 10) || 5,
        Boolean(active),
      ]
    );

    return NextResponse.json(
      {
        product: { ...res.rows[0], is_low_stock: (parseInt(stock, 10) || 0) <= (parseInt(min_stock, 10) || 5) },
        message: 'Product added successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return serverError(error, 'src/app/api/products/route.ts');
  }
}
