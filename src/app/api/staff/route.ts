import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { checkLimit } from '@/lib/plan';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const staffRes = await query(
      `SELECT s.id, s.salon_id, s.name, s.role_title, 
              s.service_commission_pct, s.product_commission_pct, 
              s.active, s.show_online, s.created_at,
              COALESCE(
                json_agg(
                  json_build_object('id', sv.id, 'name', sv.name)
                ) FILTER (WHERE sv.id IS NOT NULL), 
                '[]'
              ) as services,
              COALESCE(serv.services_done, 0)::int as services_count,
              COALESCE(serv.service_revenue, 0)::numeric(10,2) as service_revenue,
              (COALESCE(serv.service_revenue, 0) * (s.service_commission_pct / 100))::numeric(10,2) as service_commission_earned,
              COALESCE(prod.products_sold, 0)::int as products_sold_count,
              COALESCE(prod.product_revenue, 0)::numeric(10,2) as product_sales_revenue,
              (COALESCE(prod.product_revenue, 0) * (s.product_commission_pct / 100))::numeric(10,2) as product_commission_earned,
              ((COALESCE(serv.service_revenue, 0) * (s.service_commission_pct / 100)) + 
               (COALESCE(prod.product_revenue, 0) * (s.product_commission_pct / 100)))::numeric(10,2) as total_commission_earned
       FROM staff s
       LEFT JOIN staff_services ss ON s.id = ss.staff_id
       LEFT JOIN services sv ON ss.service_id = sv.id
       LEFT JOIN LATERAL (
         SELECT 
           COUNT(si.id) as services_done,
           SUM(si.qty * si.unit_price) as service_revenue
         FROM session_items si
         JOIN sessions sess ON si.session_id = sess.id
         WHERE si.staff_id = s.id AND si.kind = 'service' AND sess.salon_id = s.salon_id
       ) serv ON true
       LEFT JOIN LATERAL (
         SELECT 
           SUM(si.qty) as products_sold,
           SUM(si.qty * si.unit_price) as product_revenue
         FROM session_items si
         JOIN sessions sess ON si.session_id = sess.id
         WHERE si.staff_id = s.id AND si.kind = 'product' AND sess.salon_id = s.salon_id
       ) prod ON true
       WHERE s.salon_id = $1
       GROUP BY s.id, serv.services_done, serv.service_revenue, prod.products_sold, prod.product_revenue
       ORDER BY s.created_at ASC`,
      [salonId]
    );

    // Mask commissions if current plan doesn't include commission_report flag
    const canViewCommission = Boolean(auth.session.plan?.flags.commission_report);
    const rows = canViewCommission
      ? staffRes.rows
      : staffRes.rows.map((r) => ({
          ...r,
          service_commission_pct: 0,
          product_commission_pct: 0,
          service_commission_earned: '0.00',
          product_commission_earned: '0.00',
          total_commission_earned: '0.00',
        }));

    return NextResponse.json({ staff: rows, canViewCommission });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;

    // Check staff plan limits (e.g. Basic: 3 staff max)
    const limitCheck = await checkLimit('max_staff', salonId);
    if (!limitCheck.success) {
      return limitCheck.error;
    }
    const body = await request.json();
    const {
      name,
      role_title,
      service_commission_pct,
      product_commission_pct,
      services, // array of service_ids
      show_online,
      active,
    } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Staff name is required' }, { status: 400 });
    }

    const sComm = parseFloat(service_commission_pct) || 0;
    const pComm = parseFloat(product_commission_pct) || 0;

    const staffRes = await query(
      `INSERT INTO staff (salon_id, name, role_title, service_commission_pct, product_commission_pct, active, show_online)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        salonId,
        name.trim(),
        role_title?.trim() || 'Stylist',
        sComm,
        pComm,
        active ?? true,
        show_online ?? true,
      ]
    );

    const newStaff = staffRes.rows[0];

    // Map staff services if provided (scoped to services of caller's salon)
    if (Array.isArray(services) && services.length > 0) {
      for (const srvId of services) {
        // Verify service belongs to caller's salon
        const srvCheck = await query(
          'SELECT id FROM services WHERE id = $1 AND salon_id = $2 LIMIT 1',
          [srvId, salonId]
        );
        if (srvCheck.rows.length > 0) {
          await query(
            `INSERT INTO staff_services (staff_id, service_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [newStaff.id, srvId]
          );
        }
      }
    }

    return NextResponse.json({ staff: newStaff, message: 'Staff member added successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
