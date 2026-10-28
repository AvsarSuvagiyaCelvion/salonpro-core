import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { clearSalonCache } from '@/lib/salon';

// 1. GET Current Salon Subscription & Trial Status
export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;

    const res = await query(`
      SELECT 
        s.id,
        s.name,
        s.slug,
        s.created_at,
        s.trial_ends_at,
        s.subscription_status,
        s.subscription_ends_at,
        s.subscription_plan_id,
        sp.name as plan_name,
        sp.price as plan_price,
        sp.billing_interval as plan_interval,
        sp.features as plan_features
      FROM salons s
      LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
      WHERE s.id = $1
      LIMIT 1
    `, [salonId]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    const salon = res.rows[0];

    // Compute trial remaining
    const now = new Date();
    const trialEnd = salon.trial_ends_at ? new Date(salon.trial_ends_at) : null;
    const isTrial = salon.subscription_status === 'trial';
    const isTrialExpired = isTrial && (!trialEnd || trialEnd.getTime() <= now.getTime());
    
    let trialDaysRemaining = 0;
    if (isTrial && trialEnd && trialEnd.getTime() > now.getTime()) {
      trialDaysRemaining = Math.max(1, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const isActive = salon.subscription_status === 'active' || (isTrial && !isTrialExpired);

    return NextResponse.json({
      success: true,
      subscription: {
        status: salon.subscription_status,
        isActive,
        isTrial,
        isTrialExpired,
        trialEndsAt: salon.trial_ends_at,
        trialDaysRemaining,
        subscriptionEndsAt: salon.subscription_ends_at,
        currentPlan: salon.subscription_plan_id ? {
          id: salon.subscription_plan_id,
          name: salon.plan_name,
          price: salon.plan_price,
          interval: salon.plan_interval,
          features: salon.plan_features,
        } : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST Activate / Upgrade Plan (Supports Razorpay/Card/UPI instant confirmation)
export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const body = await request.json();
    const { planId, paymentMethod = 'UPI / Online Gateway', transactionId } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Please select a subscription plan.' }, { status: 400 });
    }

    // Verify plan exists
    const planRes = await query('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true', [planId]);
    if (planRes.rows.length === 0) {
      return NextResponse.json({ error: 'Selected plan not found or inactive.' }, { status: 404 });
    }

    const plan = planRes.rows[0];
    const durationInterval = plan.billing_interval === 'yearly' ? "'1 year'" : "'1 month'";

    // Update salon subscription
    const updateRes = await query(`
      UPDATE salons 
      SET 
        subscription_status = 'active',
        subscription_plan_id = $1,
        subscription_ends_at = NOW() + INTERVAL ${durationInterval},
        plan = $2
      WHERE id = $3
      RETURNING *
    `, [plan.id, plan.slug || 'pro', salonId]);

    clearSalonCache();

    return NextResponse.json({
      success: true,
      message: `Congratulations! Your salon is now subscribed to the ${plan.name} plan.`,
      salon: updateRes.rows[0],
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        interval: plan.billing_interval,
      },
      payment: {
        method: paymentMethod,
        ref: transactionId || `TXN-${Date.now()}`,
        status: 'PAID',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

