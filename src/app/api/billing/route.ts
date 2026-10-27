import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDefaultSalonId } from '@/lib/salon';

export async function GET(request: Request) {
  try {
    const salonId = await getDefaultSalonId();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const statusFilter = searchParams.get('status')?.trim().toLowerCase() || 'all';

    let sql = `
      SELECT i.id, i.number, i.session_id, i.subtotal, i.discount_type, 
              i.discount_value, i.discount_amount, i.total, i.whatsapp_sent, i.created_at,
              c.id as customer_id, c.name as customer_name, c.mobile as customer_mobile,
              COALESCE(SUM(p.amount), 0)::numeric(10,2) as paid_amount,
              (i.total - COALESCE(SUM(p.amount), 0))::numeric(10,2) as due_amount,
              CASE 
                WHEN (i.total - COALESCE(SUM(p.amount), 0)) <= 0 THEN 'paid'
                WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'partial'
                ELSE 'pending'
              END as status
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN payments p ON i.id = p.invoice_id
      WHERE i.salon_id = $1
    `;
    const params: any[] = [salonId];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (i.number ILIKE $2 OR c.name ILIKE $2 OR c.mobile ILIKE $2) `;
    }

    sql += ` GROUP BY i.id, c.id `;

    if (statusFilter === 'paid') {
      sql += ` HAVING (i.total - COALESCE(SUM(p.amount), 0)) <= 0 `;
    } else if (statusFilter === 'partial') {
      sql += ` HAVING (i.total - COALESCE(SUM(p.amount), 0)) > 0 AND COALESCE(SUM(p.amount), 0) > 0 `;
    } else if (statusFilter === 'pending') {
      sql += ` HAVING COALESCE(SUM(p.amount), 0) = 0 `;
    }

    sql += ` ORDER BY i.created_at DESC `;

    const res = await query(sql, params);

    // Fetch session items for these invoices to show breakdown on receipt
    const sessionIds = res.rows.map((r) => r.session_id).filter(Boolean);
    let itemsMap: Record<string, any[]> = {};

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

    const invoices = res.rows.map((inv) => ({
      ...inv,
      items: inv.session_id ? itemsMap[inv.session_id] || [] : [],
    }));

    return NextResponse.json({ invoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
