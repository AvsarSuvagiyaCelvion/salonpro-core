import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request, { allowExpired: true });
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;

    const res = await query(
      `SELECT sp.*, p.name as plan_name, p.slug as plan_slug
       FROM subscription_payments sp
       JOIN subscription_plans p ON sp.plan_id = p.id
       WHERE sp.salon_id = $1
       ORDER BY sp.created_at DESC
       LIMIT 20`,
      [salonId]
    );

    return NextResponse.json({
      success: true,
      payments: res.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
