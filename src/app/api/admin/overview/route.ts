import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    // 1. Overall Platform Counts
    const salonsCountRes = await query(`SELECT COUNT(*) as count FROM salons`);
    const customersCountRes = await query(`SELECT COUNT(*) as count FROM customers`);
    const appointmentsCountRes = await query(`SELECT COUNT(*) as count FROM appointments`);
    const staffCountRes = await query(`SELECT COUNT(*) as count FROM staff`);
    const revenueRes = await query(`SELECT COALESCE(SUM(total), 0)::numeric(12,2) as total_rev FROM invoices`);
    const paidRes = await query(`SELECT COALESCE(SUM(amount), 0)::numeric(12,2) as total_paid FROM payments`);

    // 2. Salons list with computed statistics
    const salonsListRes = await query(`
      SELECT 
        s.id,
        s.name,
        s.slug,
        s.brand_color,
        s.open_time,
        s.close_time,
        s.created_at,
        COUNT(DISTINCT st.id) as staff_count,
        COUNT(DISTINCT c.id) as customer_count,
        COUNT(DISTINCT a.id) as appointment_count,
        COALESCE(SUM(i.total), 0)::numeric(10,2) as total_revenue
      FROM salons s
      LEFT JOIN staff st ON s.id = st.salon_id
      LEFT JOIN customers c ON s.id = c.salon_id
      LEFT JOIN appointments a ON s.id = a.salon_id
      LEFT JOIN invoices i ON s.id = i.salon_id
      GROUP BY s.id
      ORDER BY s.created_at ASC
    `);

    // 3. Recent Platform Appointments
    const recentAppointmentsRes = await query(`
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
    `);

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
