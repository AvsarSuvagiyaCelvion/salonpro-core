import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    // Execute all 8 platform analytical queries concurrently
    const [
      salonsCountRes,
      customersCountRes,
      appointmentsCountRes,
      staffCountRes,
      revenueRes,
      paidRes,
      salonsListRes,
      recentAppointmentsRes,
    ] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM salons`),
      query(`SELECT COUNT(*) as count FROM customers`),
      query(`SELECT COUNT(*) as count FROM appointments`),
      query(`SELECT COUNT(*) as count FROM staff`),
      query(`SELECT COALESCE(SUM(total), 0)::numeric(12,2) as total_rev FROM invoices`),
      query(`SELECT COALESCE(SUM(amount), 0)::numeric(12,2) as total_paid FROM payments`),
      query(`
        SELECT 
          s.id,
          s.name,
          s.slug,
          s.brand_color,
          s.open_time,
          s.close_time,
          s.created_at,
          COALESCE(st.cnt, 0) as staff_count,
          COALESCE(c.cnt, 0) as customer_count,
          COALESCE(a.cnt, 0) as appointment_count,
          COALESCE(i.rev, 0)::numeric(10,2) as total_revenue
        FROM salons s
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as cnt FROM staff WHERE salon_id = s.id
        ) st ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as cnt FROM customers WHERE salon_id = s.id
        ) c ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as cnt FROM appointments WHERE salon_id = s.id
        ) a ON true
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(total), 0) as rev FROM invoices WHERE salon_id = s.id
        ) i ON true
        ORDER BY s.created_at ASC
      `),
      query(`
        SELECT 
          a.id,
          a.starts_at,
          a.status,
          a.source,
          s.name as salon_name,
          s.slug as salon_slug,
          c.name as customer_name,
          c.mobile as customer_mobile,
          sv.name as service_name,
          sv.price as service_price
        FROM appointments a
        JOIN salons s ON a.salon_id = s.id
        JOIN customers c ON a.customer_id = c.id
        JOIN services sv ON a.service_id = sv.id
        ORDER BY a.created_at DESC
        LIMIT 6
      `),
    ]);

    return NextResponse.json({
      metrics: {
        totalSalons: parseInt(salonsCountRes.rows[0]?.count || '0', 10),
        totalCustomers: parseInt(customersCountRes.rows[0]?.count || '0', 10),
        totalAppointments: parseInt(appointmentsCountRes.rows[0]?.count || '0', 10),
        totalStaff: parseInt(staffCountRes.rows[0]?.count || '0', 10),
        totalRevenue: parseFloat(revenueRes.rows[0]?.total_rev || '0'),
        totalPaid: parseFloat(paidRes.rows[0]?.total_paid || '0'),
      },
      salons: salonsListRes.rows,
      recentAppointments: recentAppointmentsRes.rows,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/overview/route.ts');
  }
}
