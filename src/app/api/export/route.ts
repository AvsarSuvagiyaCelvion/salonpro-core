import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { requireFeature } from '@/lib/plan';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;

    // Feature gating: export (Pro and Premium only)
    const featureCheck = await requireFeature('export', salonId);
    if (!featureCheck.success) return featureCheck.error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'invoices'; // 'invoices' | 'staff' | 'services' | 'customers' | 'products' | 'appointments'
    const period = searchParams.get('period') || '30d'; // 'today' | '7d' | '30d' | 'month' | 'custom' | 'all'
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    let startDate = new Date();
    let endDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'custom' && customStart) {
      startDate = new Date(customStart);
      startDate.setHours(0, 0, 0, 0);
      if (customEnd) {
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (period === 'all') {
      startDate = new Date('2020-01-01T00:00:00Z');
      endDate = new Date('2099-12-31T23:59:59Z');
    }

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // 1. INVOICES REGISTER
    if (type === 'invoices') {
      const res = await query(
        `SELECT i.number, 
                i.created_at, 
                c.name as customer_name, 
                c.mobile as customer_mobile,
                i.subtotal, 
                i.discount_amount, 
                i.tax_amount, 
                i.total,
                COALESCE(SUM(p.amount), 0)::numeric(10,2) as paid_amount,
                (i.total - COALESCE(SUM(p.amount), 0))::numeric(10,2) as due_amount,
                COALESCE(STRING_AGG(DISTINCT p.method, ', '), 'Unpaid') as payment_method,
                CASE 
                  WHEN (i.total - COALESCE(SUM(p.amount), 0)) <= 0 THEN 'PAID'
                  WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'PARTIAL'
                  ELSE 'PENDING'
                END as status
         FROM invoices i
         LEFT JOIN customers c ON i.customer_id = c.id
         LEFT JOIN payments p ON i.id = p.invoice_id
         WHERE i.salon_id = $1 AND i.created_at >= $2 AND i.created_at <= $3
         GROUP BY i.id, c.name, c.mobile
         ORDER BY i.created_at DESC`,
        [salonId, startIso, endIso]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    // 2. STAFF PERFORMANCE & COMMISSION
    if (type === 'staff') {
      const res = await query(
        `SELECT s.id, 
                s.name, 
                COALESCE(s.role_title, 'Stylist') as role_title,
                s.service_commission_pct, 
                s.product_commission_pct,
                COUNT(DISTINCT sess.id) as sessions_count,
                COALESCE(SUM(CASE WHEN si.kind = 'service' THEN si.unit_price * si.qty ELSE 0 END), 0)::numeric(10,2) as services_revenue,
                COALESCE(SUM(CASE WHEN si.kind = 'product' THEN si.unit_price * si.qty ELSE 0 END), 0)::numeric(10,2) as products_revenue,
                (COALESCE(SUM(CASE WHEN si.kind = 'service' THEN si.unit_price * si.qty ELSE 0 END), 0) +
                 COALESCE(SUM(CASE WHEN si.kind = 'product' THEN si.unit_price * si.qty ELSE 0 END), 0))::numeric(10,2) as total_revenue,
                (COALESCE(SUM(CASE WHEN si.kind = 'service' THEN (si.unit_price * si.qty) * (s.service_commission_pct / 100.0) ELSE 0 END), 0) +
                 COALESCE(SUM(CASE WHEN si.kind = 'product' THEN (si.unit_price * si.qty) * (s.product_commission_pct / 100.0) ELSE 0 END), 0))::numeric(10,2) as total_commission
         FROM staff s
         LEFT JOIN session_items si ON s.id = si.staff_id
         LEFT JOIN sessions sess ON si.session_id = sess.id AND sess.started_at >= $2 AND sess.started_at <= $3
         WHERE s.salon_id = $1 AND s.active = true
         GROUP BY s.id, s.name, s.role_title, s.service_commission_pct, s.product_commission_pct
         ORDER BY total_revenue DESC, s.name ASC`,
        [salonId, startIso, endIso]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    // 3. SERVICES CATALOG PERFORMANCE
    if (type === 'services') {
      const res = await query(
        `SELECT sv.id, 
                sv.name, 
                sv.category, 
                sv.price, 
                sv.duration_minutes,
                COUNT(DISTINCT si.id) as times_booked,
                COALESCE(SUM(si.unit_price * si.qty), 0)::numeric(10,2) as total_revenue
         FROM services sv
         LEFT JOIN session_items si ON sv.name = si.name AND si.kind = 'service'
         LEFT JOIN sessions sess ON si.session_id = sess.id AND sess.started_at >= $2 AND sess.started_at <= $3
         WHERE sv.salon_id = $1
         GROUP BY sv.id, sv.name, sv.category, sv.price, sv.duration_minutes
         ORDER BY total_revenue DESC, times_booked DESC, sv.name ASC`,
        [salonId, startIso, endIso]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    // 4. CUSTOMERS CRM & RETENTION
    if (type === 'customers') {
      const res = await query(
        `SELECT c.id, 
                c.name, 
                c.mobile, 
                c.email, 
                c.created_at,
                COUNT(DISTINCT a.id) as total_appointments,
                COALESCE(SUM(i.total), 0)::numeric(10,2) as total_spent,
                MAX(a.starts_at) as last_visit
         FROM customers c
         LEFT JOIN appointments a ON c.id = a.customer_id
         LEFT JOIN invoices i ON c.id = i.customer_id
         WHERE c.salon_id = $1
         GROUP BY c.id, c.name, c.mobile, c.email, c.created_at
         ORDER BY total_spent DESC, c.created_at DESC`,
        [salonId]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    // 5. PRODUCTS INVENTORY & SALES
    if (type === 'products') {
      const res = await query(
        `SELECT p.id, 
                p.name, 
                p.brand, 
                p.retail_price, 
                p.stock, 
                p.min_stock,
                COALESCE(SUM(si.qty), 0)::int as units_sold,
                COALESCE(SUM(si.unit_price * si.qty), 0)::numeric(10,2) as total_revenue
         FROM products p
         LEFT JOIN session_items si ON p.name = si.name AND si.kind = 'product'
         LEFT JOIN sessions sess ON si.session_id = sess.id AND sess.started_at >= $2 AND sess.started_at <= $3
         WHERE p.salon_id = $1
         GROUP BY p.id, p.name, p.brand, p.retail_price, p.stock, p.min_stock
         ORDER BY units_sold DESC, p.name ASC`,
        [salonId, startIso, endIso]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    // 6. APPOINTMENTS SCHEDULE
    if (type === 'appointments') {
      const res = await query(
        `SELECT a.starts_at, 
                a.ends_at, 
                a.status, 
                c.name as customer_name, 
                c.mobile as customer_mobile, 
                sv.name as service_name, 
                sv.price as service_price,
                st.name as staff_name
         FROM appointments a
         JOIN customers c ON a.customer_id = c.id
         JOIN services sv ON a.service_id = sv.id
         JOIN staff st ON a.staff_id = st.id
         WHERE a.salon_id = $1 AND a.starts_at >= $2 AND a.starts_at <= $3
         ORDER BY a.starts_at DESC`,
        [salonId, startIso, endIso]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    return NextResponse.json({ error: 'Invalid export type requested' }, { status: 400 });
  } catch (error: any) {
    return serverError(error, 'src/app/api/export/route.ts');
  }
}
