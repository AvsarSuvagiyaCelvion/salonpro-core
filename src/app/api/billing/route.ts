import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { DEMO_INVOICES } from '@/lib/demo-data';

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
      // Remove internal full_count from client object
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
    return serverError(error, 'src/app/api/billing/route.ts');
  }
}
