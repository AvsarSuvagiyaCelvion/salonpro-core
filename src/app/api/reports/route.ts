import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDefaultSalonId } from '@/lib/salon';

export async function GET(request: Request) {
  try {
    const salonId = await getDefaultSalonId();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    let days = 30;
    if (period === 'today') days = 1;
    else if (period === '7d') days = 7;
    else if (period === 'all') days = 3650;

    const startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period !== 'all') {
      startDate.setDate(startDate.getDate() - (days - 1));
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setFullYear(2000, 0, 1);
    }
    const startIso = startDate.toISOString();

    // 1. Overview KPIs
    // Total Revenue from payments
    const revRes = await query(
      `SELECT COALESCE(SUM(p.amount), 0)::numeric(10,2) as total_revenue,
              COUNT(p.id) as payment_count
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE i.salon_id = $1 AND p.created_at >= $2`,
      [salonId, startIso]
    );
    const totalRevenue = Number(revRes.rows[0]?.total_revenue || 0);

    // Total Completed Sessions
    const sessRes = await query(
      `SELECT COUNT(*) as total_sessions
       FROM sessions
       WHERE salon_id = $1 AND status = 'completed' AND started_at >= $2`,
      [salonId, startIso]
    );
    const totalSessions = Number(sessRes.rows[0]?.total_sessions || 0);

    // Average Session Value
    const avgSessionValue = totalSessions > 0 ? Math.round(totalRevenue / totalSessions) : 0;

    // 2. Revenue by Payment Method
    const methodRes = await query(
      `SELECT p.method,
              COALESCE(SUM(p.amount), 0)::numeric(10,2) as total_amount,
              COUNT(p.id) as transaction_count
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE i.salon_id = $1 AND p.created_at >= $2
       GROUP BY p.method
       ORDER BY total_amount DESC`,
      [salonId, startIso]
    );

    const paymentMethods = methodRes.rows.map((r) => {
      const amount = Number(r.total_amount);
      const pct = totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : '0';
      return {
        method: r.method,
        amount,
        count: Number(r.transaction_count),
        percentage: Number(pct),
      };
    });

    // 3. Payment Status Breakdown
    const statusRes = await query(
      `SELECT 
         CASE 
           WHEN (i.total - COALESCE(SUM(p.amount), 0)) <= 0 THEN 'paid'
           WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'partial'
           ELSE 'pending'
         END as status,
         COUNT(DISTINCT i.id) as count,
         COALESCE(SUM(i.total), 0)::numeric(10,2) as total_value
       FROM invoices i
       LEFT JOIN payments p ON i.id = p.invoice_id
       WHERE i.salon_id = $1 AND i.created_at >= $2
       GROUP BY i.id, i.total`,
      [salonId, startIso]
    );

    const paymentStatuses = {
      paid: { count: 0, amount: 0 },
      partial: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
    };

    statusRes.rows.forEach((r) => {
      const s = r.status as 'paid' | 'partial' | 'pending';
      if (paymentStatuses[s]) {
        paymentStatuses[s].count++;
        paymentStatuses[s].amount += Number(r.total_value);
      }
    });

    // 4. Staff Performance & Commission Data
    const staffRes = await query(
      `SELECT s.id, s.name, s.role_title,
              s.service_commission_pct, s.product_commission_pct,
              COUNT(DISTINCT sess.id) as sessions,
              COALESCE(SUM(CASE WHEN si.kind = 'service' THEN si.unit_price * si.qty ELSE 0 END), 0)::numeric(10,2) as services_revenue,
              COALESCE(SUM(CASE WHEN si.kind = 'product' THEN si.unit_price * si.qty ELSE 0 END), 0)::numeric(10,2) as products_revenue
       FROM staff s
       LEFT JOIN session_items si ON s.id = si.staff_id
       LEFT JOIN sessions sess ON si.session_id = sess.id AND sess.started_at >= $2
       WHERE s.salon_id = $1 AND s.active = true
       GROUP BY s.id, s.name, s.role_title, s.service_commission_pct, s.product_commission_pct
       ORDER BY services_revenue DESC, s.name ASC`,
      [salonId, startIso]
    );

    const staffReport = staffRes.rows.map((st) => {
      const servicesRev = Number(st.services_revenue);
      const productsRev = Number(st.products_revenue);
      const totalRev = servicesRev + productsRev;
      const svcCommPct = Number(st.service_commission_pct) || 10;
      const prodCommPct = Number(st.product_commission_pct) || 5;
      const commission = (servicesRev * svcCommPct) / 100 + (productsRev * prodCommPct) / 100;

      return {
        id: st.id,
        name: st.name,
        roleTitle: st.role_title,
        sessions: Number(st.sessions),
        servicesRevenue: servicesRev,
        productsRevenue: productsRev,
        totalRevenue: totalRev,
        serviceCommissionPct: svcCommPct,
        productCommissionPct: prodCommPct,
        commissionEarned: Math.round(commission),
      };
    });

    return NextResponse.json({
      period,
      overview: {
        totalRevenue,
        totalSessions,
        avgSessionValue,
        paymentMethods,
        paymentStatuses,
      },
      staffReport,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
