import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { createRazorpayOrder, getRazorpayKeys } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request, { allowExpired: true });
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const body = await request.json();
    const { planId, interval = 'monthly' } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Please select a plan.' }, { status: 400 });
    }

    // 1. Fetch salon details
    const salonRes = await query('SELECT id, name, phone FROM salons WHERE id = $1 LIMIT 1', [salonId]);
    if (salonRes.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found.' }, { status: 404 });
    }
    const salon = salonRes.rows[0];

    // 2. Fetch plan details
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

    // 3. Create order on Razorpay
    const { keyId } = getRazorpayKeys();
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

    // 4. Record order in database
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
    });
  } catch (error: any) {
    console.error('Create Razorpay Order Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create payment order.' }, { status: 500 });
  }
}

