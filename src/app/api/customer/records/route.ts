import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { CUSTOMER_COOKIE_NAME, verifyCustomerSessionToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const payload = await verifyCustomerSessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Session expired. Please login again.' }, { status: 401 });
    }

    const customerId = payload.customerId;

    // 1. Customer details
    const custRes = await query(
      `SELECT id, salon_id, name, mobile, email, created_at FROM customers WHERE id = $1 LIMIT 1`,
      [customerId]
    );

    if (custRes.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    const customer = custRes.rows[0];

    // 2. Salon details
    const salonRes = await query(
      `SELECT id, name, slug, address, phone, brand_color FROM salons WHERE id = $1 LIMIT 1`,
      [customer.salon_id]
    );
    const salon = salonRes.rows[0];

    // 3. Appointments (Upcoming & Past)
    const apptsRes = await query(
      `SELECT a.id, a.starts_at, a.ends_at, a.status, a.source, a.note, a.created_at,
              sv.name as service_name, sv.duration_min, sv.price as service_price,
              st.name as staff_name, st.role_title as staff_role
       FROM appointments a
       JOIN services sv ON a.service_id = sv.id
       JOIN staff st ON a.staff_id = st.id
       WHERE a.customer_id = $1
       ORDER BY a.starts_at DESC`,
      [customerId]
    );

    const now = new Date();
    const upcomingAppointments = apptsRes.rows.filter(
      (a) => new Date(a.ends_at) >= now && a.status !== 'cancelled'
    );
    const pastAppointments = apptsRes.rows.filter(
      (a) => new Date(a.ends_at) < now || a.status === 'cancelled' || a.status === 'done'
    );

    // 4. Invoices / Digital Bills
    const invRes = await query(
      `SELECT i.id, i.number, i.subtotal, i.discount_value, i.discount_amount, i.total, i.created_at,
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

    // 5. Active Memberships & Packages
    const plansRes = await query(
      `SELECT cp.id, cp.kind, cp.starts_on, cp.expires_on, cp.amount_paid,
              CASE WHEN cp.kind = 'membership' THEN mp.name ELSE pp.name END as plan_name,
              mp.services_discount_pct, mp.products_discount_pct,
              (cp.expires_on >= CURRENT_DATE) as is_active
       FROM customer_plans cp
       LEFT JOIN membership_plans mp ON (cp.kind = 'membership' AND cp.plan_id = mp.id)
       LEFT JOIN package_plans pp ON (cp.kind = 'package' AND cp.plan_id = pp.id)
       WHERE cp.customer_id = $1
       ORDER BY cp.expires_on DESC`,
      [customerId]
    );

    return NextResponse.json({
      customer,
      salon,
      upcomingAppointments,
      pastAppointments,
      invoices: invRes.rows,
      plans: plansRes.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
