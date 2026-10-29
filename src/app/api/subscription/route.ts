import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { clearSalonCache } from '@/lib/salon';
import { getSalonPlan, getSalonUsage } from '@/lib/plan';

// 1. GET Current Salon Subscription, Plan Details, and Live Usage vs Limits
export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request, { allowExpired: true });
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;

    const res = await query(
      `SELECT 
        s.id,
        s.name,
        s.slug,
        s.created_at,
        s.trial_ends_at,
        s.subscription_status,
        s.subscription_ends_at,
        s.subscription_plan_id,
        s.custom_domain_verified,
        sp.id as plan_id,
        sp.slug as plan_slug,
        sp.name as plan_name,
        sp.price as plan_price,
        sp.yearly_price as plan_yearly_price,
        sp.billing_interval as plan_interval,
        sp.features as plan_features,
        sp.limits as plan_limits,
        sp.flags as plan_flags
      FROM salons s
      LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
      WHERE s.id = $1
      LIMIT 1`,
      [salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    const salon = res.rows[0];

    // Compute trial & plan status via plan context
    const planContextResult = await getSalonPlan(salonId);
    const planContext = planContextResult.plan;

    const now = new Date();
    const trialEnd = salon.trial_ends_at ? new Date(salon.trial_ends_at) : null;
    const subEnd = salon.subscription_ends_at ? new Date(salon.subscription_ends_at) : null;

    const isTrial = salon.subscription_status === 'trial';
    const isTrialActive = Boolean(isTrial && trialEnd && trialEnd.getTime() > now.getTime());
    const isTrialExpired = Boolean(isTrial && (!trialEnd || trialEnd.getTime() <= now.getTime()));

    const isSubActive = Boolean(
      salon.subscription_status === 'active' &&
      (!subEnd || subEnd.getTime() > now.getTime())
    );
    const isSubExpired = Boolean(
      salon.subscription_status === 'active' &&
      subEnd &&
      subEnd.getTime() <= now.getTime()
    );

    let trialDaysRemaining = 0;
    if (isTrialActive && trialEnd) {
      trialDaysRemaining = Math.max(1, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Get live usage vs limits
    const usage = await getSalonUsage(salonId);

    const limits = planContext?.limits || {
      max_staff: salon.plan_limits?.max_staff ?? 3,
      max_services: salon.plan_limits?.max_services ?? 30,
      wa_per_month: salon.plan_limits?.wa_per_month ?? 0,
    };

    const flags = planContext?.flags || salon.plan_flags || {};

    return NextResponse.json({
      success: true,
      subscription: {
        status: isTrialExpired || isSubExpired ? 'expired' : salon.subscription_status,
        isActive: Boolean(planContext?.isActive),
        isTrial,
        isTrialActive,
        isTrialExpired,
        isSubscriptionExpired: isSubExpired,
        isExpired: isTrialExpired || isSubExpired || salon.subscription_status === 'expired',
        trialEndsAt: salon.trial_ends_at,
        trialDaysRemaining,
        subscriptionEndsAt: salon.subscription_ends_at,
        customDomainVerified: Boolean(salon.custom_domain_verified),
        currentPlan: planContext ? {
          id: salon.subscription_plan_id,
          slug: planContext.planSlug,
          name: planContext.planName,
          price: salon.plan_price || 0,
          yearlyPrice: salon.plan_yearly_price || 0,
          interval: salon.plan_interval || 'monthly',
          features: salon.plan_features || [],
          limits,
          flags,
        } : null,
        usage: {
          staffCount: usage.staffCount,
          maxStaff: limits.max_staff,
          servicesCount: usage.servicesCount,
          maxServices: limits.max_services,
          waMessagesCount: usage.waMessagesCount,
          maxWaMessages: limits.wa_per_month,
          period: usage.period,
        },
        flags,
        limits,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST Activate / Upgrade Plan (Supports monthly and yearly subscriptions)
export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request, { allowExpired: true });
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const body = await request.json();
    const { planId, billingInterval = 'monthly', paymentMethod = 'UPI / Online Gateway', transactionId } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Please select a subscription plan.' }, { status: 400 });
    }

    // Verify plan exists
    const planRes = await query('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true', [planId]);
    if (planRes.rows.length === 0) {
      return NextResponse.json({ error: 'Selected plan not found or inactive.' }, { status: 404 });
    }

    const plan = planRes.rows[0];
    const isYearly = billingInterval === 'yearly';
    const intervalSql = isYearly ? "'1 year'" : "'1 month'";

    // Update salon subscription
    const updateRes = await query(
      `UPDATE salons 
       SET 
         subscription_status = 'active',
         subscription_plan_id = $1,
         subscription_ends_at = NOW() + INTERVAL ${intervalSql},
         plan = $2
       WHERE id = $3
       RETURNING *`,
      [plan.id, plan.slug || 'pro', salonId]
    );

    clearSalonCache();

    return NextResponse.json({
      success: true,
      message: `Congratulations! Your salon is now subscribed to the ${plan.name} plan.`,
      salon: updateRes.rows[0],
      plan: {
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        price: isYearly ? plan.yearly_price : plan.price,
        interval: billingInterval,
        limits: plan.limits,
        flags: plan.flags,
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
