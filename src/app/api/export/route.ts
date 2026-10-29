import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { requireFeature } from '@/lib/plan';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;

    // Feature gating: export (Pro and Premium only)
    const featureCheck = await requireFeature('export', salonId);
    if (!featureCheck.success) return featureCheck.error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'invoices'; // 'invoices' | 'customers' | 'appointments' | 'staff'

    if (type === 'customers') {
      const res = await query(
        'SELECT name, mobile, email, created_at FROM customers WHERE salon_id = $1 ORDER BY created_at DESC',
        [salonId]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    if (type === 'appointments') {
      const res = await query(
        `SELECT a.starts_at, a.ends_at, a.status, c.name as customer_name, c.mobile as customer_mobile, sv.name as service_name, st.name as staff_name
         FROM appointments a
         JOIN customers c ON a.customer_id = c.id
         JOIN services sv ON a.service_id = sv.id
         JOIN staff st ON a.staff_id = st.id
         WHERE a.salon_id = $1
         ORDER BY a.starts_at DESC`,
        [salonId]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    if (type === 'staff') {
      const res = await query(
        'SELECT name, role_title, service_commission_pct, product_commission_pct, active, created_at FROM staff WHERE salon_id = $1 ORDER BY name ASC',
        [salonId]
      );
      return NextResponse.json({ success: true, data: res.rows });
    }

    // Default: invoices
    const res = await query(
      `SELECT i.number, i.subtotal, i.discount_amount, i.tax_amount, i.total, i.whatsapp_sent, i.created_at, c.name as customer_name, c.mobile as customer_mobile
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       WHERE i.salon_id = $1
       ORDER BY i.created_at DESC`,
      [salonId]
    );

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

