import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    let days = 7;
    if (period === 'today') days = 1;
    else if (period === '30d') days = 30;

    const startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(startDate.getDate() - (days - 1));
      startDate.setHours(0, 0, 0, 0);
    }
    const startIso = startDate.toISOString();

    // 1. Revenue from payments in this period
    const revRes = await query(
      `SELECT COALESCE(SUM(p.amount), 0)::numeric(10,2) as total_revenue,
              COUNT(p.id) as payment_count
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE i.salon_id = $1 AND p.created_at >= $2`,
      [salonId, startIso]
    );
    const totalRevenue = Number(revRes.rows[0]?.total_revenue || 0);

    // 2. Completed sessions in this period
    const sessRes = await query(
      `SELECT COUNT(*) as completed_sessions
       FROM sessions
       WHERE salon_id = $1 AND status = 'completed' AND started_at >= $2`,
      [salonId, startIso]
    );
    const completedSessions = Number(sessRes.rows[0]?.completed_sessions || 0);

    // 3. Customers count (total in salon)
    const custRes = await query(
      `SELECT COUNT(*) as total_customers FROM customers WHERE salon_id = $1`,
      [salonId]
    );
    const totalCustomers = Number(custRes.rows[0]?.total_customers || 0);

    // 4. Active staff count
    const staffRes = await query(
      `SELECT COUNT(*) as active_staff FROM staff WHERE salon_id = $1 AND active = true`,
      [salonId]
    );
    const activeStaff = Number(staffRes.rows[0]?.active_staff || 0);

    // 5. Daily Revenue Series for Chart
    const dailyRevRes = await query(
      `SELECT DATE(p.created_at AT TIME ZONE 'Asia/Kolkata') as pay_date,
              COALESCE(SUM(p.amount), 0)::numeric(10,2) as amount
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE i.salon_id = $1 AND p.created_at >= $2
       GROUP BY DATE(p.created_at AT TIME ZONE 'Asia/Kolkata')
       ORDER BY pay_date ASC`,
      [salonId, startIso]
    );

    // Fill all days in range for smooth chart
    const dailyMap: Record<string, number> = {};
    dailyRevRes.rows.forEach((r) => {
      // Format YYYY-MM-DD
      const dStr = new Date(r.pay_date).toISOString().slice(0, 10);
      dailyMap[dStr] = Number(r.amount);
    });

    const chartData = [];
    const loopDate = new Date(startDate);
    const today = new Date();
    while (loopDate <= today) {
      const dStr = loopDate.toISOString().slice(0, 10);
      const label = loopDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      chartData.push({
        date: dStr,
        label,
        amount: dailyMap[dStr] || 0,
      });
      loopDate.setDate(loopDate.getDate() + 1);
    }

    // 6. Popular Services (Top 5)
    const servicesRes = await query(
      `SELECT si.name, 
              COUNT(*) as count, 
              SUM(si.unit_price * si.qty)::numeric(10,2) as revenue
       FROM session_items si
       JOIN sessions s ON si.session_id = s.id
       WHERE s.salon_id = $1 
         AND si.kind = 'service' 
         AND s.started_at >= $2
       GROUP BY si.name
       ORDER BY count DESC, revenue DESC
       LIMIT 5`,
      [salonId, startIso]
    );

    // 7. Top Staff (Top 5 by revenue)
    const topStaffRes = await query(
      `SELECT st.id, st.name, st.role_title,
              COUNT(DISTINCT s.id) as sessions,
              COALESCE(SUM(si.unit_price * si.qty), 0)::numeric(10,2) as revenue
       FROM staff st
       LEFT JOIN session_items si ON st.id = si.staff_id
       LEFT JOIN sessions s ON si.session_id = s.id AND s.started_at >= $2
       WHERE st.salon_id = $1 AND st.active = true
       GROUP BY st.id, st.name, st.role_title
       ORDER BY revenue DESC
       LIMIT 5`,
      [salonId, startIso]
    );

    // 8. Invoice Payment Status Counts (Overall or in period)
    const statusRes = await query(
      `SELECT 
         CASE 
           WHEN (i.total - COALESCE(SUM(p.amount), 0)) <= 0 THEN 'paid'
           WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'partial'
           ELSE 'pending'
         END as status,
         COUNT(DISTINCT i.id) as count
       FROM invoices i
       LEFT JOIN payments p ON i.id = p.invoice_id
       WHERE i.salon_id = $1 AND i.created_at >= $2
       GROUP BY i.id, i.total`,
      [salonId, startIso]
    );

    const paymentStatusCounts = { paid: 0, partial: 0, pending: 0 };
    statusRes.rows.forEach((r) => {
      if (r.status === 'paid') paymentStatusCounts.paid++;
      else if (r.status === 'partial') paymentStatusCounts.partial++;
      else if (r.status === 'pending') paymentStatusCounts.pending++;
    });

    // 9. Upcoming Appointments (Next 5)
    const apptsRes = await query(
      `SELECT a.id, a.starts_at, a.status,
              c.name as customer_name,
              st.name as staff_name,
              sv.name as service_name,
              sv.price
       FROM appointments a
       JOIN customers c ON a.customer_id = c.id
       JOIN staff st ON a.staff_id = st.id
       JOIN services sv ON a.service_id = sv.id
       WHERE a.salon_id = $1 AND a.status IN ('scheduled', 'arrived')
       ORDER BY a.starts_at ASC
       LIMIT 5`,
      [salonId]
    );

    // 10. Low stock products
    const lowStockRes = await query(
      `SELECT name, stock, min_stock, price
       FROM products
       WHERE salon_id = $1 AND stock <= min_stock
       ORDER BY stock ASC`,
      [salonId]
    );

    return NextResponse.json({
      period,
      totalRevenue,
      completedSessions,
      totalCustomers,
      activeStaff,
      chartData,
      popularServices: servicesRes.rows,
      topStaff: topStaffRes.rows,
      paymentStatusCounts,
      recentAppointments: apptsRes.rows,
      lowStockProducts: lowStockRes.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
