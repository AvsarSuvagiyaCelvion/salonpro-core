import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { createRazorpayOrder, getRazorpayKeys } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request, { allowExpired: true });
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const body = await request.json().catch(() => ({}));
    const { planId, interval } = body;

    // Validate interval is exactly 'monthly' or 'yearly'
    if (interval !== 'monthly' && interval !== 'yearly') {
      return NextResponse.json(
        { error: "Invalid interval. Must be either 'monthly' or 'yearly'." },
        { status: 400 }
      );
    }

    if (!planId) {
      return NextResponse.json({ error: 'Please select a plan.' }, { status: 400 });
    }

    // 1. Fetch salon details
    const salonRes = await query('SELECT id, name, phone FROM salons WHERE id = $1 LIMIT 1', [salonId]);
    if (salonRes.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found.' }, { status: 404 });
    }
    const salon = salonRes.rows[0];

    // 2. Fetch plan details and strictly use DB prices
    const planRes = await query('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true', [planId]);
    if (planRes.rows.length === 0) {
      return NextResponse.json({ error: 'Selected plan not found or inactive.' }, { status: 404 });
    }
    const plan = planRes.rows[0];

    const isYearly = interval === 'yearly';
    const amountInRupees = isYearly ? Number(plan.yearly_price) : Number(plan.price);

    if (amountInRupees <= 0) {
      return NextResponse.json({ error: 'Invalid plan price.' }, { status: 400 });
    }

    const { keyId } = getRazorpayKeys();

    // 3. Reuse pending 'created' order for the same plan created in the last 10 minutes
    const existingOrderRes = await query(
      `SELECT * FROM subscription_payments 
       WHERE salon_id = $1 
         AND plan_id = $2 
         AND billing_interval = $3 
         AND status = 'created'
         AND created_at > NOW() - INTERVAL '10 minutes'
       ORDER BY created_at DESC 
       LIMIT 1`,
      [salonId, plan.id, interval]
    );

    if (existingOrderRes.rows.length > 0) {
      const existing = existingOrderRes.rows[0];
      return NextResponse.json({
        success: true,
        orderId: existing.razorpay_order_id,
        amount: Math.round(Number(existing.amount) * 100), // in paise
        currency: existing.currency || 'INR',
        keyId,
        planName: plan.name,
        salonName: salon.name,
        salonPhone: salon.phone || '',
        salonEmail: auth.session.email || '',
        reused: true,
      });
    }

    // 4. Create order on Razorpay
    const orderReceipt = `sub_${Date.now()}`;
    const order = await createRazorpayOrder({
      amount: amountInRupees,
      currency: 'INR',
      receipt: orderReceipt,
      notes: {
        salon_id: salonId,
        salon_name: salon.name,
        plan_id: plan.id,
        plan_slug: plan.slug,
        interval,
      },
    });

    // 5. Record order in database
    await query(
      `INSERT INTO subscription_payments (
        salon_id, plan_id, billing_interval, amount, currency,
        razorpay_order_id, status
      ) VALUES ($1, $2, $3, $4, 'INR', $5, 'created')`,
      [salonId, plan.id, interval, amountInRupees, order.id]
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount, // in paise
      currency: order.currency,
      keyId,
      planName: plan.name,
      salonName: salon.name,
      salonPhone: salon.phone || '',
      salonEmail: auth.session.email || '',
    });
  } catch (error: any) {
    console.error('Create Razorpay Order Error:', error);
    return serverError(error, 'src/app/api/subscription/razorpay/create-order/route.ts');
  }
}
