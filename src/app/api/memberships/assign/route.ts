import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_id, kind, plan_id, amount_paid } = body;

    if (!customer_id || !kind || !plan_id) {
      return NextResponse.json(
        { error: 'customer_id, kind, and plan_id are required' },
        { status: 400 }
      );
    }

    // Fetch validity days
    let validityDays = 365;
    if (kind === 'membership') {
      const planRes = await query('SELECT validity_days, price FROM membership_plans WHERE id = $1', [plan_id]);
      if (planRes.rows.length === 0) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      validityDays = planRes.rows[0].validity_days || 365;
    } else {
      const planRes = await query('SELECT validity_days, price FROM package_plans WHERE id = $1', [plan_id]);
      if (planRes.rows.length === 0) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
      validityDays = planRes.rows[0].validity_days || 90;
    }

    const res = await query(
      `INSERT INTO customer_plans (
        customer_id, kind, plan_id, starts_on, expires_on, amount_paid
      ) VALUES (
        $1, $2, $3, CURRENT_DATE, CURRENT_DATE + ($4 || ' days')::interval, $5
      ) RETURNING *`,
      [customer_id, kind, plan_id, validityDays.toString(), Number(amount_paid) || 0]
    );

    return NextResponse.json({
      customerPlan: res.rows[0],
      message: 'Plan successfully assigned to customer',
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
