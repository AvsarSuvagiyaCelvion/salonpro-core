import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'salons'; // 'salons' | 'subscriptions' | 'overview'
    const period = searchParams.get('period') || 'all';
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

    // 1. SALONS MASTER DIRECTORY
    if (type === 'salons') {
      const res = await query(
        `SELECT 
           s.name as salon_name,
           s.slug,
           u.full_name as owner_name,
           u.email as owner_email,
           COALESCE(s.phone, u.phone, '-') as phone,
           s.city,
           COALESCE(sp.name, s.plan, 'Free Trial') as plan_name,
           COALESCE(s.subscription_status, 'active') as status,
           COUNT(DISTINCT st.id) as staff_count,
           COUNT(DISTINCT c.id) as customer_count,
           COUNT(DISTINCT a.id) as appointments_count,
           COALESCE(SUM(i.total), 0)::numeric(12,2) as total_revenue,
           s.created_at
         FROM salons s
         LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
         LEFT JOIN LATERAL (
           SELECT full_name, email, phone FROM users WHERE salon_id = s.id AND role = 'owner' LIMIT 1
         ) u ON true
         LEFT JOIN staff st ON s.id = st.salon_id
         LEFT JOIN customers c ON s.id = c.salon_id
         LEFT JOIN appointments a ON s.id = a.salon_id
         LEFT JOIN invoices i ON s.id = i.salon_id
         WHERE s.created_at >= $1 AND s.created_at <= $2
         GROUP BY s.id, s.name, s.slug, u.full_name, u.email, s.phone, u.phone, s.city, sp.name, s.plan, s.subscription_status, s.created_at
         ORDER BY s.created_at DESC`,
        [startIso, endIso]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    // 2. SUBSCRIPTION PAYMENTS HISTORY
    if (type === 'subscriptions') {
      const res = await query(
        `SELECT 
           s.name as salon_name,
           s.slug as salon_slug,
           sp.name as plan_name,
           sp.billing_interval,
           pay.amount::numeric(10,2) as amount,
           pay.razorpay_payment_id,
           pay.razorpay_order_id,
           pay.status,
           pay.created_at
         FROM subscription_payments pay
         JOIN salons s ON pay.salon_id = s.id
         JOIN subscription_plans sp ON pay.subscription_plan_id = sp.id
         WHERE pay.created_at >= $1 AND pay.created_at <= $2
         ORDER BY pay.created_at DESC`,
        [startIso, endIso]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    // 3. PLATFORM OVERVIEW SUMMARY
    if (type === 'overview') {
      const [salonsRes, custRes, apptRes, revRes] = await Promise.all([
        query('SELECT count(*)::int as total_salons FROM salons'),
        query('SELECT count(*)::int as total_customers FROM customers'),
        query('SELECT count(*)::int as total_appointments FROM appointments'),
        query('SELECT COALESCE(SUM(total), 0)::numeric(12,2) as total_volume FROM invoices'),
      ]);

      const data = [
        { metric: 'Total Registered Salons', value: salonsRes.rows[0]?.total_salons || 0 },
        { metric: 'Total Platform Clients', value: custRes.rows[0]?.total_customers || 0 },
        { metric: 'Total Appointments Booked', value: apptRes.rows[0]?.total_appointments || 0 },
        { metric: 'Total Gross GMV Volume (₹)', value: revRes.rows[0]?.total_volume || 0 },
      ];

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Invalid admin export type' }, { status: 400 });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/export/route.ts');
  }
}

