import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      brand,
      sku,
      price,
      cost_price,
      stock,
      min_stock,
      active,
    } = body;

    const res = await query(
      `UPDATE products
       SET name = COALESCE($1, name),
           brand = $2,
           sku = $3,
           price = COALESCE($4, price),
           cost_price = COALESCE($5, cost_price),
           stock = COALESCE($6, stock),
           min_stock = COALESCE($7, min_stock),
           active = COALESCE($8, active)
       WHERE id = $9
       RETURNING *`,
      [
        name ? name.trim() : null,
        brand ? brand.trim() : null,
        sku ? sku.trim() : null,
        price !== undefined ? Number(price) : null,
        cost_price !== undefined ? Number(cost_price) : null,
        stock !== undefined ? parseInt(stock, 10) : null,
        min_stock !== undefined ? parseInt(min_stock, 10) : null,
        active !== undefined ? Boolean(active) : null,
        id,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      product: res.rows[0],
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query('DELETE FROM products WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
