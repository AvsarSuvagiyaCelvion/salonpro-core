import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Static Demo Reports Showcase for Dixa Beauty Salon (Instant Sandbox Demo)
    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      const demoStats = period === 'today'
        ? {
            totalRevenue: 14250,
            totalExpenses: 1050,
            netProfit: 13200,
            expenseCount: 3,
            totalSessions: 8,
            avgSessionValue: 1781,
            paymentMethods: [
              { method: 'Cash', amount: 6400, count: 4, percentage: 44.9 },
              { method: 'UPI', amount: 5850, count: 3, percentage: 41.1 },
              { method: 'Card', amount: 2000, count: 1, percentage: 14.0 },
            ],
            paymentStatuses: {
              paid: { count: 8, amount: 14250 },
              partial: { count: 0, amount: 0 },
              pending: { count: 0, amount: 0 },
            },
            staffReport: [
              { id: 'demo-st-1', name: 'Priya Patel', roleTitle: 'Creative Master Stylist', sessions: 4, servicesRevenue: 6800, productsRevenue: 1200, totalRevenue: 8000, serviceCommissionPct: 15, productCommissionPct: 10, commissionEarned: 1140 },
              { id: 'demo-st-2', name: 'Neha Shah', roleTitle: 'Senior Skin & Spa Specialist', sessions: 3, servicesRevenue: 4250, productsRevenue: 800, totalRevenue: 5050, serviceCommissionPct: 15, productCommissionPct: 10, commissionEarned: 718 },
              { id: 'demo-st-3', name: 'Ananya Sharma', roleTitle: 'Celebrity Makeup & Nails', sessions: 1, servicesRevenue: 1200, productsRevenue: 0, totalRevenue: 1200, serviceCommissionPct: 15, productCommissionPct: 10, commissionEarned: 180 },
            ],
          }
        : period === '7d'
        ? {
            totalRevenue: 48600,
            totalExpenses: 2850,
            netProfit: 45750,
            expenseCount: 7,
            totalSessions: 32,
            avgSessionValue: 1519,
            paymentMethods: [
              { method: 'UPI', amount: 24300, count: 16, percentage: 50.0 },
              { method: 'Cash', amount: 17500, count: 12, percentage: 36.0 },
              { method: 'Card', amount: 6800, count: 4, percentage: 14.0 },
            ],
            paymentStatuses: {
              paid: { count: 30, amount: 45600 },
              partial: { count: 2, amount: 3000 },
              pending: { count: 0, amount: 0 },
            },
            staffReport: [
              { id: 'demo-st-1', name: 'Priya Patel', roleTitle: 'Creative Master Stylist', sessions: 16, servicesRevenue: 24000, productsRevenue: 3500, totalRevenue: 27500, serviceCommissionPct: 15, productCommissionPct: 10, commissionEarned: 3950 },
              { id: 'demo-st-2', name: 'Neha Shah', roleTitle: 'Senior Skin & Spa Specialist', sessions: 11, servicesRevenue: 14500, productsRevenue: 2200, totalRevenue: 16700, serviceCommissionPct: 15, productCommissionPct: 10, commissionEarned: 2395 },
              { id: 'demo-st-3', name: 'Ananya Sharma', roleTitle: 'Celebrity Makeup & Nails', sessions: 5, servicesRevenue: 4400, productsRevenue: 0, totalRevenue: 4400, serviceCommissionPct: 15, productCommissionPct: 10, commissionEarned: 660 },
            ],
          }
        : {
            totalRevenue: 184500,
            totalExpenses: 11400,
            netProfit: 173100,
            expenseCount: 24,
            totalSessions: 128,
            avgSessionValue: 1441,
            paymentMethods: [
              { method: 'UPI', amount: 96000, count: 68, percentage: 52.0 },
              { method: 'Cash', amount: 64500, count: 44, percentage: 35.0 },
              { method: 'Card', amount: 24000, count: 16, percentage: 13.0 },
            ],
            paymentStatuses: {
              paid: { count: 122, amount: 176500 },
              partial: { count: 6, amount: 8000 },
              pending: { count: 0, amount: 0 },
            },
            staffReport: [
              { id: 'demo-st-1', name: 'Priya Patel', roleTitle: 'Creative Master Stylist', sessions: 64, servicesRevenue: 92000, productsRevenue: 14000, totalRevenue: 106000, serviceCommissionPct: 15, productCommissionPct: 10, commissionEarned: 15200 },
              { id: 'demo-st-2', name: 'Neha Shah', roleTitle: 'Senior Skin & Spa Specialist', sessions: 44, servicesRevenue: 54000, productsRevenue: 8500, totalRevenue: 62500, serviceCommissionPct: 15, productCommissionPct: 10, commissionEarned: 8950 },
              { id: 'demo-st-3', name: 'Ananya Sharma', roleTitle: 'Celebrity Makeup & Nails', sessions: 20, servicesRevenue: 16000, productsRevenue: 0, totalRevenue: 16000, serviceCommissionPct: 15, productCommissionPct: 10, commissionEarned: 2400 },
            ],
          };

      return NextResponse.json({
        period,
        canViewCommission: true,
        overview: {
          totalRevenue: demoStats.totalRevenue,
          totalExpenses: demoStats.totalExpenses,
          netProfit: demoStats.netProfit,
          expenseCount: demoStats.expenseCount,
          totalSessions: demoStats.totalSessions,
          avgSessionValue: demoStats.avgSessionValue,
          paymentMethods: demoStats.paymentMethods,
          paymentStatuses: demoStats.paymentStatuses,
        },
        staffReport: demoStats.staffReport,
      });
    }

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

    // Execute all 5 analytics queries in parallel
    const [revRes, sessRes, methodRes, statusRes, staffRes, expRes] = await Promise.all([
      // 1. Total Revenue from payments
      query(
        `SELECT COALESCE(SUM(p.amount), 0)::numeric(10,2) as total_revenue,
                COUNT(p.id) as payment_count
         FROM payments p
         JOIN invoices i ON p.invoice_id = i.id
         WHERE i.salon_id = $1 AND p.created_at >= $2`,
        [salonId, startIso]
      ),
      // 2. Total Completed Sessions
      query(
        `SELECT COUNT(*) as total_sessions
         FROM sessions
         WHERE salon_id = $1 AND status = 'completed' AND started_at >= $2`,
        [salonId, startIso]
      ),
      // 3. Revenue by Payment Method
      query(
        `SELECT p.method,
                COALESCE(SUM(p.amount), 0)::numeric(10,2) as total_amount,
                COUNT(p.id) as transaction_count
         FROM payments p
         JOIN invoices i ON p.invoice_id = i.id
         WHERE i.salon_id = $1 AND p.created_at >= $2
         GROUP BY p.method
         ORDER BY total_amount DESC`,
        [salonId, startIso]
      ),
      // 4. Payment Status Breakdown
      query(
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
      ),
      // 5. Staff Performance & Commission Data
      query(
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
      ),
      // 6. Total Expenses & Cash Outflow
      auth.session.salonSlug === 'dixa-beauty-salon'
        ? Promise.resolve({ rows: [{ total_expenses: 1050, expense_count: 3 }] })
        : query(
            `SELECT COALESCE(SUM(amount), 0)::numeric(10,2) as total_expenses,
                    COUNT(id) as expense_count
             FROM expenses
             WHERE salon_id = $1 AND expense_date >= $2::date`,
            [salonId, startDate.toISOString().split('T')[0]]
          ),
    ]);

    const totalRevenue = Number(revRes.rows[0]?.total_revenue) || 0;
    const totalSessions = Number(sessRes.rows[0]?.total_sessions) || 0;
    const avgSessionValue = totalSessions > 0 ? Math.round(totalRevenue / totalSessions) : 0;
    const totalExpenses = Number(expRes.rows[0]?.total_expenses) || 0;
    const expenseCount = Number(expRes.rows[0]?.expense_count) || 0;
    const netProfit = totalRevenue - totalExpenses;

    const paymentMethods = methodRes.rows.map((r) => {
      const amount = Number(r.total_amount) || 0;
      const pct = totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : '0';
      const numPct = Number(pct);
      return {
        method: r.method || 'Other',
        amount,
        count: Number(r.transaction_count) || 0,
        percentage: isNaN(numPct) ? 0 : numPct,
      };
    });

    const paymentStatuses = {
      paid: { count: 0, amount: 0 },
      partial: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
    };

    statusRes.rows.forEach((r) => {
      const s = r.status as 'paid' | 'partial' | 'pending';
      if (paymentStatuses[s]) {
        paymentStatuses[s].count = (paymentStatuses[s].count || 0) + 1;
        paymentStatuses[s].amount = (paymentStatuses[s].amount || 0) + (Number(r.total_value) || 0);
      }
    });

    const canViewCommission = Boolean(auth.session.plan?.flags.commission_report);

    const staffReport = staffRes.rows.map((st) => {
      const servicesRev = Number(st.services_revenue) || 0;
      const productsRev = Number(st.products_revenue) || 0;
      const totalRev = servicesRev + productsRev;
      const svcCommPct = canViewCommission ? (Number(st.service_commission_pct) || 10) : 0;
      const prodCommPct = canViewCommission ? (Number(st.product_commission_pct) || 5) : 0;
      const rawComm = canViewCommission
        ? (servicesRev * svcCommPct) / 100 + (productsRev * prodCommPct) / 100
        : 0;
      const commission = isNaN(rawComm) ? 0 : Math.round(rawComm);

      return {
        id: st.id,
        name: st.name || 'Stylist',
        roleTitle: st.role_title,
        sessions: Number(st.sessions) || 0,
        servicesRevenue: servicesRev,
        productsRevenue: productsRev,
        totalRevenue: totalRev,
        serviceCommissionPct: svcCommPct,
        productCommissionPct: prodCommPct,
        commissionEarned: commission,
      };
    });

    return NextResponse.json({
      period,
      canViewCommission,
      overview: {
        totalRevenue,
        totalExpenses,
        netProfit,
        expenseCount,
        totalSessions,
        avgSessionValue,
        paymentMethods,
        paymentStatuses,
      },
      staffReport,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/reports/route.ts');
  }
}
