import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;

    // 1. Fetch all invoices for this specific customer
    const invoicesRes = await query(
      `SELECT i.id, i.number, i.session_id, i.subtotal, i.discount_type, 
              i.discount_value, i.discount_amount, i.total, i.whatsapp_sent, i.created_at,
              COALESCE(SUM(p.amount), 0)::numeric(10,2) as paid_amount,
              (i.total - COALESCE(SUM(p.amount), 0))::numeric(10,2) as due_amount,
              CASE 
                WHEN (i.total - COALESCE(SUM(p.amount), 0)) <= 0 THEN 'paid'
                WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'partial'
                ELSE 'pending'
              END as status
       FROM invoices i
       LEFT JOIN payments p ON i.id = p.invoice_id
       WHERE i.customer_id = $1
       GROUP BY i.id
       ORDER BY i.created_at DESC`,
      [customerId]
    );

    const sessionIds = invoicesRes.rows.map((r) => r.session_id).filter(Boolean);
    let itemsMap: Record<string, any[]> = {};

    if (sessionIds.length > 0) {
      const itemsRes = await query(
        `SELECT si.session_id, si.kind, si.name, si.qty, si.unit_price,
                st.name as staff_name
         FROM session_items si
         LEFT JOIN staff st ON si.staff_id = st.id
         WHERE si.session_id = ANY($1::uuid[])
         ORDER BY si.id ASC`,
        [sessionIds]
      );

      for (const item of itemsRes.rows) {
        if (!itemsMap[item.session_id]) itemsMap[item.session_id] = [];
        itemsMap[item.session_id].push(item);
      }
    }

    const invoices = invoicesRes.rows.map((inv) => ({
      ...inv,
      items: inv.session_id ? itemsMap[inv.session_id] || [] : [],
    }));

    return NextResponse.json({ invoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
