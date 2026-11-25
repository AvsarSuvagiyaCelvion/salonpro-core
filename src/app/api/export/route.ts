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
    const isDemoSalon = auth.session.salonSlug === 'dixa-beauty-salon';

    // Feature gating: export (Pro and Premium only, always allowed on demo showcase)
    if (!isDemoSalon) {
      const featureCheck = await requireFeature('export', salonId);
      if (!featureCheck.success) return featureCheck.error;
    }

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

      if (res.rows.length === 0 && isDemoSalon) {
        const demoInvoices = [
          { number: 'INV-2026-089', created_at: new Date().toISOString(), customer_name: 'Ananya Iyer (Demo)', customer_mobile: '9999900001', subtotal: 2400, discount_amount: 360, tax_amount: 367.2, total: 2407.2, paid_amount: 2407.2, due_amount: 0, payment_method: 'UPI', status: 'PAID' },
          { number: 'INV-2026-088', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), customer_name: 'Pooja Shah (Demo)', customer_mobile: '9999900002', subtotal: 1800, discount_amount: 0, tax_amount: 324, total: 2124, paid_amount: 2124, due_amount: 0, payment_method: 'Cash', status: 'PAID' },
          { number: 'INV-2026-087', created_at: new Date(Date.now() - 3600000 * 5).toISOString(), customer_name: 'Riya Patel (Demo)', customer_mobile: '9999900003', subtotal: 3500, discount_amount: 525, tax_amount: 535.5, total: 3510.5, paid_amount: 2000, due_amount: 1510.5, payment_method: 'UPI', status: 'PARTIAL' },
          { number: 'INV-2026-086', created_at: new Date(Date.now() - 86400000).toISOString(), customer_name: 'Kavita Mehta (Demo)', customer_mobile: '9999900004', subtotal: 4200, discount_amount: 0, tax_amount: 756, total: 4956, paid_amount: 4956, due_amount: 0, payment_method: 'Card', status: 'PAID' },
          { number: 'INV-2026-085', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), customer_name: 'Sneha Joshi (Demo)', customer_mobile: '9999900005', subtotal: 1200, discount_amount: 0, tax_amount: 216, total: 1416, paid_amount: 1416, due_amount: 0, payment_method: 'Cash', status: 'PAID' },
          { number: 'INV-2026-084', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), customer_name: 'Tanvi Desai (Demo)', customer_mobile: '9999900006', subtotal: 6500, discount_amount: 975, tax_amount: 994.5, total: 6519.5, paid_amount: 6519.5, due_amount: 0, payment_method: 'UPI', status: 'PAID' },
        ];
        return NextResponse.json({ success: true, data: demoInvoices });
      }

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

      if (res.rows.length === 0 && isDemoSalon) {
        const demoStaff = [
          { id: 'st-demo-1', name: 'Priya Patel', role_title: 'Creative Master Stylist', service_commission_pct: 15, product_commission_pct: 10, sessions_count: 64, services_revenue: 92000, products_revenue: 14000, total_revenue: 106000, total_commission: 15200 },
          { id: 'st-demo-2', name: 'Neha Shah', role_title: 'Senior Skin & Spa Specialist', service_commission_pct: 15, product_commission_pct: 10, sessions_count: 44, services_revenue: 54000, products_revenue: 8500, total_revenue: 62500, total_commission: 8950 },
          { id: 'st-demo-3', name: 'Ananya Sharma', role_title: 'Celebrity Makeup & Nails', service_commission_pct: 15, product_commission_pct: 10, sessions_count: 20, services_revenue: 16000, products_revenue: 0, total_revenue: 16000, total_commission: 2400 },
        ];
        return NextResponse.json({ success: true, data: demoStaff });
      }

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

      if (res.rows.length === 0 && isDemoSalon) {
        const demoServices = [
          { id: 'svc-1', name: 'Signature Haircut & Styling', category: 'Hair', price: 650, duration_minutes: 45, times_booked: 64, total_revenue: 41600 },
          { id: 'svc-2', name: 'Hydra Glow Luxury Facial', category: 'Skin', price: 1800, duration_minutes: 60, times_booked: 48, total_revenue: 86400 },
          { id: 'svc-3', name: 'Deep Conditioning Hair Spa', category: 'Hair', price: 1200, duration_minutes: 50, times_booked: 35, total_revenue: 42000 },
          { id: 'svc-4', name: 'Bridal Makeup & Draping', category: 'Makeup', price: 4500, duration_minutes: 120, times_booked: 18, total_revenue: 81000 },
          { id: 'svc-5', name: 'Beard Sculpting & Spa', category: 'Grooming', price: 450, duration_minutes: 30, times_booked: 42, total_revenue: 18900 },
        ];
        return NextResponse.json({ success: true, data: demoServices });
      }

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

      if (res.rows.length === 0 && isDemoSalon) {
        const demoCustomers = [
          { id: 'c-1', name: 'Ananya Iyer (Demo)', mobile: '9999900001', email: 'ananya.demo@example.com', created_at: new Date().toISOString(), total_appointments: 8, total_spent: 14200, last_visit: new Date().toISOString() },
          { id: 'c-2', name: 'Pooja Shah (Demo)', mobile: '9999900002', email: 'pooja.demo@example.com', created_at: new Date(Date.now() - 86400000 * 10).toISOString(), total_appointments: 5, total_spent: 9800, last_visit: new Date(Date.now() - 86400000).toISOString() },
          { id: 'c-3', name: 'Riya Patel (Demo)', mobile: '9999900003', email: 'riya.demo@example.com', created_at: new Date(Date.now() - 86400000 * 20).toISOString(), total_appointments: 12, total_spent: 24500, last_visit: new Date(Date.now() - 86400000 * 2).toISOString() },
          { id: 'c-4', name: 'Kavita Mehta (Demo)', mobile: '9999900004', email: 'kavita.demo@example.com', created_at: new Date(Date.now() - 86400000 * 30).toISOString(), total_appointments: 6, total_spent: 12400, last_visit: new Date(Date.now() - 86400000 * 3).toISOString() },
        ];
        return NextResponse.json({ success: true, data: demoCustomers });
      }

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

      if (res.rows.length === 0 && isDemoSalon) {
        const demoProducts = [
          { id: 'p-1', name: 'L\'Oreal Professionnel Serie Expert Mask', brand: 'L\'Oreal', retail_price: 950, stock: 18, min_stock: 5, units_sold: 28, total_revenue: 26600 },
          { id: 'p-2', name: 'Moroccan Argan Treatment Hair Oil', brand: 'Moroccanoil', retail_price: 1850, stock: 12, min_stock: 4, units_sold: 14, total_revenue: 25900 },
          { id: 'p-3', name: 'Schwarzkopf Bonacure Moisture Kick', brand: 'Schwarzkopf', retail_price: 850, stock: 22, min_stock: 6, units_sold: 19, total_revenue: 16150 },
          { id: 'p-4', name: 'Wella Professionals Fusion Shampoo', brand: 'Wella', retail_price: 750, stock: 15, min_stock: 5, units_sold: 21, total_revenue: 15750 },
        ];
        return NextResponse.json({ success: true, data: demoProducts });
      }

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

      if (res.rows.length === 0 && isDemoSalon) {
        const demoAppointments = [
          { starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + 2700000).toISOString(), status: 'confirmed', customer_name: 'Ananya Iyer (Demo)', customer_mobile: '9999900001', service_name: 'Signature Haircut & Styling', service_price: 650, staff_name: 'Priya Patel' },
          { starts_at: new Date(Date.now() + 3600000).toISOString(), ends_at: new Date(Date.now() + 7200000).toISOString(), status: 'confirmed', customer_name: 'Pooja Shah (Demo)', customer_mobile: '9999900002', service_name: 'Hydra Glow Luxury Facial', service_price: 1800, staff_name: 'Neha Shah' },
          { starts_at: new Date(Date.now() + 7200000).toISOString(), ends_at: new Date(Date.now() + 10200000).toISOString(), status: 'pending', customer_name: 'Riya Patel (Demo)', customer_mobile: '9999900003', service_name: 'Deep Conditioning Hair Spa', service_price: 1200, staff_name: 'Priya Patel' },
        ];
        return NextResponse.json({ success: true, data: demoAppointments });
      }

      return NextResponse.json({ success: true, data: res.rows });
    }

    return NextResponse.json({ error: 'Invalid export type requested' }, { status: 400 });
  } catch (error: any) {
    return serverError(error, 'src/app/api/export/route.ts');
  }
}
