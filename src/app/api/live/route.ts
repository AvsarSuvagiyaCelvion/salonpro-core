import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({
        waiting: [
          {
            id: 'wait-demo-1',
            created_at: new Date(Date.now() - 600000).toISOString(),
            customer_id: 'cust-2',
            customer_name: 'Ritu Sharma',
            customer_mobile: '9825100002',
          },
        ],
        sessions: [
          {
            id: 'sess-demo-1',
            started_at: new Date(Date.now() - 1800000).toISOString(),
            status: 'active',
            customer_id: 'cust-1',
            customer_name: 'Diya Joshi',
            customer_mobile: '9825100001',
            items: [
              {
                id: 'item-demo-1',
                kind: 'service',
                name: 'Signature Haircut & Styling',
                unit_price: 650,
                qty: 1,
                staff_name: 'Priya Patel',
              },
            ],
          },
        ],
      });
    }

    const salonId = auth.session.salonId;

    // 1. Waiting customers
    const waitingRes = await query(
      `SELECT w.id, w.created_at,
              c.id as customer_id, c.name as customer_name, c.mobile as customer_mobile
       FROM waiting w
       JOIN customers c ON w.customer_id = c.id
       WHERE w.salon_id = $1
       ORDER BY w.created_at ASC`,
      [salonId]
    );

    // 2. Active Sessions with items and customer active membership details
    const sessionsRes = await query(
      `SELECT s.id, s.started_at, s.status,
              c.id as customer_id, c.name as customer_name, c.mobile as customer_mobile,
              mp.name as membership_plan_name,
              mp.services_discount_pct as membership_services_discount,
              mp.products_discount_pct as membership_products_discount
       FROM sessions s
       JOIN customers c ON s.customer_id = c.id
       LEFT JOIN LATERAL (
         SELECT mp_inner.name, mp_inner.services_discount_pct, mp_inner.products_discount_pct
         FROM customer_plans cp
         JOIN membership_plans mp_inner ON cp.plan_id = mp_inner.id
         WHERE cp.customer_id = c.id AND cp.kind = 'membership' AND cp.expires_on >= CURRENT_DATE
         ORDER BY cp.expires_on DESC
         LIMIT 1
       ) mp ON true
       WHERE s.salon_id = $1 AND s.status = 'active'
       ORDER BY s.started_at ASC`,
      [salonId]
    );

    const sessionIds = sessionsRes.rows.map((s) => s.id);
    let itemsBySession: Record<string, any[]> = {};

    if (sessionIds.length > 0) {
      const itemsRes = await query(
        `SELECT si.id, si.session_id, si.kind, si.ref_id, si.name, 
                si.qty, si.unit_price, si.staff_id,
                st.name as staff_name
         FROM session_items si
         LEFT JOIN staff st ON si.staff_id = st.id
         WHERE si.session_id = ANY($1::uuid[])
         ORDER BY si.id ASC`,
        [sessionIds]
      );

      for (const item of itemsRes.rows) {
        if (!itemsBySession[item.session_id]) {
          itemsBySession[item.session_id] = [];
        }
        itemsBySession[item.session_id].push(item);
      }
    }

    const activeSessions = sessionsRes.rows.map((s) => ({
      ...s,
      items: itemsBySession[s.id] || [],
    }));

    // 3. To Collect (invoices pending payment or created in last 24h)
    const invoicesRes = await query(
      `SELECT i.id, i.number, i.receipt_token, i.session_id, i.subtotal, i.discount_type, 
              i.discount_value, i.discount_amount, i.total, i.created_at,
              c.id as customer_id, c.name as customer_name, c.mobile as customer_mobile,
              COALESCE(SUM(p.amount), 0)::numeric(10,2) as paid_amount,
              (i.total - COALESCE(SUM(p.amount), 0))::numeric(10,2) as due_amount
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       LEFT JOIN payments p ON i.id = p.invoice_id
       WHERE i.salon_id = $1
       GROUP BY i.id, c.id
       HAVING (i.total - COALESCE(SUM(p.amount), 0)) > 0 OR i.created_at >= (now() - INTERVAL '2 hours')
       ORDER BY i.created_at DESC
       LIMIT 15`,
      [salonId]
    );

    // 4. Attach items to toCollect invoices (for receipts & WhatsApp PDF generation)
    const invoiceSessionIds = invoicesRes.rows
      .map((i) => i.session_id)
      .filter((sid) => sid && !itemsBySession[sid]);

    if (invoiceSessionIds.length > 0) {
      const moreItemsRes = await query(
        `SELECT si.session_id, si.kind, si.name, si.qty, si.unit_price
         FROM session_items si
         WHERE si.session_id = ANY($1::uuid[])`,
        [invoiceSessionIds]
      );
      for (const item of moreItemsRes.rows) {
        if (!itemsBySession[item.session_id]) {
          itemsBySession[item.session_id] = [];
        }
        itemsBySession[item.session_id].push(item);
      }
    }

    const toCollect = invoicesRes.rows.map((inv) => ({
      ...inv,
      items: inv.session_id ? itemsBySession[inv.session_id] || [] : [],
    }));

    // 5. Reference catalogs (services, active staff, products with stock)
    const [servicesRes, staffRes, productsRes] = await Promise.all([
      query(
        `SELECT id, name, category, duration_min, price 
         FROM services WHERE salon_id = $1 ORDER BY name ASC`,
        [salonId]
      ),
      query(
        `SELECT id, name, role_title 
         FROM staff WHERE salon_id = $1 AND active = true ORDER BY name ASC`,
        [salonId]
      ),
      query(
        `SELECT id, name, brand, sku, price, stock, min_stock 
         FROM products WHERE salon_id = $1 AND active = true ORDER BY name ASC`,
        [salonId]
      ),
    ]);

    return NextResponse.json({
      waiting: waitingRes.rows,
      activeSessions,
      toCollect,
      services: servicesRes.rows,
      staff: staffRes.rows,
      products: productsRes.rows,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/live/route.ts');
  }
}
