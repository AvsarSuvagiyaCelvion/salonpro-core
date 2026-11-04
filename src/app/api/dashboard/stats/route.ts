import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';

    const now = new Date();
    // Get current date in Indian Standard Time (Asia/Kolkata)
    const todayIST = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // "YYYY-MM-DD"

    let startIso: string;
    let daysCount = 1;
    if (period === 'today') {
      startIso = `${todayIST}T00:00:00+05:30`;
      daysCount = 1;
    } else {
      daysCount = period === '30d' ? 30 : 7;
      const target = new Date(`${todayIST}T00:00:00+05:30`);
      target.setDate(target.getDate() - (daysCount - 1));
      const pastDateIST = target.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      startIso = `${pastDateIST}T00:00:00+05:30`;
    }

    // Execute all 10 independent dashboard analytical queries in parallel
    const [
      revRes,
      sessRes,
      custRes,
      staffRes,
      dailyRevRes,
      servicesRes,
      topStaffRes,
      statusRes,
      apptsRes,
      lowStockRes,
    ] = await Promise.all([
      // 1. Revenue from payments in this period
      query(
        `SELECT COALESCE(SUM(p.amount), 0)::numeric(10,2) as total_revenue,
                COUNT(p.id) as payment_count
         FROM payments p
         JOIN invoices i ON p.invoice_id = i.id
         WHERE i.salon_id = $1 AND p.created_at >= $2`,
        [salonId, startIso]
      ),
      // 2. Completed sessions in this period
      query(
        `SELECT COUNT(*) as completed_sessions
         FROM sessions
         WHERE salon_id = $1 AND status = 'completed' AND started_at >= $2`,
        [salonId, startIso]
      ),
      // 3. Customers count (total in salon)
      query(
        `SELECT COUNT(*) as total_customers FROM customers WHERE salon_id = $1`,
        [salonId]
      ),
      // 4. Active staff count
      query(
        `SELECT COUNT(*) as active_staff FROM staff WHERE salon_id = $1 AND active = true`,
        [salonId]
      ),
      // 5. Daily Revenue Series for Chart
      query(
        `SELECT DATE(p.created_at AT TIME ZONE 'Asia/Kolkata') as pay_date,
                COALESCE(SUM(p.amount), 0)::numeric(10,2) as amount
         FROM payments p
         JOIN invoices i ON p.invoice_id = i.id
         WHERE i.salon_id = $1 AND p.created_at >= $2
         GROUP BY DATE(p.created_at AT TIME ZONE 'Asia/Kolkata')
         ORDER BY pay_date ASC`,
        [salonId, startIso]
      ),
      // 6. Popular Services (Top 5)
      query(
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
      ),
      // 7. Top Staff (Top 5 by revenue)
      query(
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
      ),
      // 8. Invoice Payment Status Counts (Overall or in period)
      query(
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
      ),
      // 9. Upcoming Appointments (Next 5)
      query(
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
      ),
      // 10. Low stock products
      query(
        `SELECT name, stock, min_stock, price
         FROM products
         WHERE salon_id = $1 AND stock <= min_stock
         ORDER BY stock ASC`,
        [salonId]
      ),
    ]);

    const totalRevenue = Number(revRes.rows[0]?.total_revenue || 0);
    const completedSessions = Number(sessRes.rows[0]?.completed_sessions || 0);
    const totalCustomers = Number(custRes.rows[0]?.total_customers || 0);
    const activeStaff = Number(staffRes.rows[0]?.active_staff || 0);

    // Fill all days in range for smooth chart
    const dailyMap: Record<string, number> = {};
    dailyRevRes.rows.forEach((r) => {
      const dStr = typeof r.pay_date === 'string' ? r.pay_date.slice(0, 10) : new Date(r.pay_date).toISOString().slice(0, 10);
      dailyMap[dStr] = Number(r.amount);
    });

    const chartData = [];
    if (period === 'today') {
      chartData.push({
        date: todayIST,
        label: 'Today',
        amount: dailyMap[todayIST] || 0,
      });
    } else {
      const loopDate = new Date(`${todayIST}T00:00:00+05:30`);
      loopDate.setDate(loopDate.getDate() - (daysCount - 1));
      const endDate = new Date(`${todayIST}T00:00:00+05:30`);
      while (loopDate <= endDate) {
        const dStr = loopDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const label = loopDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });
        chartData.push({
          date: dStr,
          label,
          amount: dailyMap[dStr] || 0,
        });
        loopDate.setDate(loopDate.getDate() + 1);
      }
    }

    const paymentStatusCounts = { paid: 0, partial: 0, pending: 0 };
    statusRes.rows.forEach((r) => {
      if (r.status === 'paid') paymentStatusCounts.paid++;
      else if (r.status === 'partial') paymentStatusCounts.partial++;
      else if (r.status === 'pending') paymentStatusCounts.pending++;
    });

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
    return serverError(error, 'src/app/api/dashboard/stats/route.ts');
  }
}
