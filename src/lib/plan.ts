import { NextResponse } from 'next/server';
import { query } from './db';

export interface PlanLimits {
  max_staff: number; // 0 = unlimited
  max_services: number; // 0 = unlimited
  wa_per_month: number;
}

export interface PlanFlags {
  logo_upload: boolean;
  commission_report: boolean;
  memberships: boolean;
  calendar_view: boolean;
  customer_cancel: boolean;
  export: boolean;
  coupons: boolean;
  reviews: boolean;
  loyalty: boolean;
  custom_domain: boolean;
  multi_branch: boolean;
  priority_support: boolean;
}

export interface SalonPlanContext {
  salonId: string;
  salonName: string;
  planSlug: 'basic' | 'pro' | 'premium';
  planName: string;
  status: 'trial' | 'active' | 'expired';
  isTrial: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  customDomainVerified: boolean;
  limits: PlanLimits;
  flags: PlanFlags;
  planId?: string;
  isActive: boolean;
}

const DEFAULT_PRO_LIMITS: PlanLimits = {
  max_staff: 10,
  max_services: 100,
  wa_per_month: 200,
};

const DEFAULT_PRO_FLAGS: PlanFlags = {
  logo_upload: true,
  commission_report: true,
  memberships: true,
  calendar_view: true,
  customer_cancel: true,
  export: true,
  coupons: true,
  reviews: false,
  loyalty: false,
  custom_domain: false,
  multi_branch: false,
  priority_support: false,
};

const DEFAULT_BASIC_LIMITS: PlanLimits = {
  max_staff: 3,
  max_services: 30,
  wa_per_month: 0,
};

const DEFAULT_BASIC_FLAGS: PlanFlags = {
  logo_upload: false,
  commission_report: false,
  memberships: false,
  calendar_view: false,
  customer_cancel: false,
  export: false,
  coupons: false,
  reviews: false,
  loyalty: false,
  custom_domain: false,
  multi_branch: false,
  priority_support: false,
};

/**
 * Retrieves the salon's active plan, limits, and feature flags.
 * Enforces is_active and subscription expiry rules.
 */
export async function getSalonPlan(salonId: string): Promise<
  | { plan: SalonPlanContext; error: null }
  | { plan: null; error: NextResponse }
> {
  const res = await query(
    `SELECT 
      s.id,
      s.name,
      s.is_active,
      s.trial_ends_at,
      s.subscription_status,
      s.subscription_ends_at,
      s.subscription_plan_id,
      s.custom_domain_verified,
      sp.id as plan_id,
      sp.name as plan_name,
      sp.slug as plan_slug,
      sp.limits as plan_limits,
      sp.flags as plan_flags
    FROM salons s
    LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
    WHERE s.id = $1
    LIMIT 1`,
    [salonId]
  );

  if (res.rows.length === 0) {
    return {
      plan: null,
      error: NextResponse.json({ error: 'Salon workspace not found', code: 'SALON_NOT_FOUND' }, { status: 404 }),
    };
  }

  const s = res.rows[0];

  // Rule: Re-check salons.is_active on every request
  if (!s.is_active) {
    return {
      plan: null,
      error: NextResponse.json(
        { error: 'Salon workspace is suspended or inactive.', code: 'SALON_INACTIVE' },
        { status: 403 }
      ),
    };
  }

  const now = new Date();
  const trialEnd = s.trial_ends_at ? new Date(s.trial_ends_at) : null;
  const isTrial = s.subscription_status === 'trial';
  const isTrialActive = Boolean(isTrial && trialEnd && trialEnd.getTime() > now.getTime());
  const isTrialExpired = Boolean(isTrial && (!trialEnd || trialEnd.getTime() <= now.getTime()));

  let trialDaysRemaining = 0;
  if (isTrialActive && trialEnd) {
    trialDaysRemaining = Math.max(1, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // 1. During an active trial: treat salon as Pro
  if (isTrialActive) {
    return {
      plan: {
        salonId: s.id,
        salonName: s.name,
        planSlug: 'pro',
        planName: 'Pro (7-Day Trial)',
        status: 'trial',
        isTrial: true,
        isTrialExpired: false,
        trialDaysRemaining,
        trialEndsAt: s.trial_ends_at,
        subscriptionEndsAt: null,
        customDomainVerified: Boolean(s.custom_domain_verified),
        limits: s.plan_limits || DEFAULT_PRO_LIMITS,
        flags: s.plan_flags ? { ...DEFAULT_PRO_FLAGS, ...s.plan_flags } : DEFAULT_PRO_FLAGS,
        planId: s.plan_id,
        isActive: true,
      },
      error: null,
    };
  }

  // 2. If trial expired and no active subscription -> Block ALL tenant APIs with HTTP 402
  if (isTrialExpired && s.subscription_status !== 'active') {
    return {
      plan: null,
      error: NextResponse.json(
        {
          error: 'Your 7-day free trial has expired. Please select a plan to continue accessing your salon ERP.',
          code: 'SUBSCRIPTION_EXPIRED',
          isTrialExpired: true,
        },
        { status: 402 }
      ),
    };
  }

  // 3. Active Subscription check
  if (s.subscription_status === 'active') {
    const subEnd = s.subscription_ends_at ? new Date(s.subscription_ends_at) : null;
    if (subEnd && subEnd.getTime() <= now.getTime()) {
      return {
        plan: null,
        error: NextResponse.json(
          {
            error: 'Your subscription has ended. Please renew your plan to continue accessing your salon ERP.',
            code: 'SUBSCRIPTION_EXPIRED',
            isExpired: true,
          },
          { status: 402 }
        ),
      };
    }

    // Active paid plan
    const limits: PlanLimits = {
      max_staff: s.plan_limits?.max_staff ?? DEFAULT_BASIC_LIMITS.max_staff,
      max_services: s.plan_limits?.max_services ?? DEFAULT_BASIC_LIMITS.max_services,
      wa_per_month: s.plan_limits?.wa_per_month ?? DEFAULT_BASIC_LIMITS.wa_per_month,
    };

    const flags: PlanFlags = {
      ...DEFAULT_BASIC_FLAGS,
      ...(s.plan_flags || {}),
    };

    const slug = (s.plan_slug as 'basic' | 'pro' | 'premium') || 'basic';

    return {
      plan: {
        salonId: s.id,
        salonName: s.name,
        planSlug: slug,
        planName: s.plan_name || (slug.charAt(0).toUpperCase() + slug.slice(1)),
        status: 'active',
        isTrial: false,
        isTrialExpired: false,
        trialDaysRemaining: 0,
        trialEndsAt: s.trial_ends_at,
        subscriptionEndsAt: s.subscription_ends_at,
        customDomainVerified: Boolean(s.custom_domain_verified),
        limits,
        flags,
        planId: s.plan_id,
        isActive: true,
      },
      error: null,
    };
  }

  // Fallback for any other expired or undefined state
  return {
    plan: null,
    error: NextResponse.json(
      {
        error: 'Subscription expired or inactive. Please subscribe to a plan.',
        code: 'SUBSCRIPTION_EXPIRED',
      },
      { status: 402 }
    ),
  };
}

/**
 * Returns HTTP 403 {code:"UPGRADE_REQUIRED", feature, requiredPlan} if feature flag is false.
 */
export async function requireFeature(
  flag: keyof PlanFlags,
  salonId: string
): Promise<{ success: true; plan: SalonPlanContext } | { success: false; error: NextResponse }> {
  const planCheck = await getSalonPlan(salonId);
  if (planCheck.error) {
    return { success: false, error: planCheck.error };
  }

  const { plan } = planCheck;
  if (!plan.flags[flag]) {
    const premiumOnlyFlags: (keyof PlanFlags)[] = [
      'custom_domain',
      'reviews',
      'loyalty',
      'multi_branch',
      'priority_support',
    ];
    const requiredPlan = premiumOnlyFlags.includes(flag) ? 'Premium' : 'Pro';

    return {
      success: false,
      error: NextResponse.json(
        {
          error: `The feature '${flag}' is not included in your current ${plan.planName} plan. Upgrade to ${requiredPlan} to unlock this feature.`,
          code: 'UPGRADE_REQUIRED',
          feature: flag,
          requiredPlan,
          currentPlan: plan.planSlug,
        },
        { status: 403 }
      ),
    };
  }

  return { success: true, plan };
}

/**
 * For staff and services compares current count with limits; returns 403 {code:"LIMIT_REACHED"} when exceeded.
 * Downgrade rule: Never delete existing data; only block creating new items beyond limit.
 */
export async function checkLimit(
  metric: 'max_staff' | 'max_services' | 'wa_per_month',
  salonId: string
): Promise<{ success: true; plan: SalonPlanContext } | { success: false; error: NextResponse }> {
  const planCheck = await getSalonPlan(salonId);
  if (planCheck.error) {
    return { success: false, error: planCheck.error };
  }

  const { plan } = planCheck;
  const limit = plan.limits[metric];

  // 0 means unlimited
  if (limit === 0 && metric !== 'wa_per_month') {
    return { success: true, plan };
  }

  if (metric === 'max_staff') {
    const countRes = await query('SELECT count(*)::int as count FROM staff WHERE salon_id = $1', [salonId]);
    const current = countRes.rows[0]?.count || 0;

    if (limit > 0 && current >= limit) {
      const requiredPlan = plan.planSlug === 'basic' ? 'Pro' : 'Premium';
      return {
        success: false,
        error: NextResponse.json(
          {
            error: `Staff limit reached: Your ${plan.planName} plan allows up to ${limit} staff members. You currently have ${current}. Please upgrade to ${requiredPlan} to add more staff.`,
            code: 'LIMIT_REACHED',
            metric,
            limit,
            current,
            requiredPlan,
          },
          { status: 403 }
        ),
      };
    }
  } else if (metric === 'max_services') {
    const countRes = await query('SELECT count(*)::int as count FROM services WHERE salon_id = $1', [salonId]);
    const current = countRes.rows[0]?.count || 0;

    if (limit > 0 && current >= limit) {
      const requiredPlan = plan.planSlug === 'basic' ? 'Pro' : 'Premium';
      return {
        success: false,
        error: NextResponse.json(
          {
            error: `Service limit reached: Your ${plan.planName} plan allows up to ${limit} services. You currently have ${current}. Please upgrade to ${requiredPlan} to add more services.`,
            code: 'LIMIT_REACHED',
            metric,
            limit,
            current,
            requiredPlan,
          },
          { status: 403 }
        ),
      };
    }
  } else if (metric === 'wa_per_month') {
    const period = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const countRes = await query(
      'SELECT count FROM usage_counters WHERE salon_id = $1 AND metric = $2 AND period = $3',
      [salonId, 'wa_messages', period]
    );
    const current = countRes.rows[0]?.count || 0;

    if (limit === 0 || current >= limit) {
      const requiredPlan = plan.planSlug === 'basic' ? 'Pro' : 'Premium';
      return {
        success: false,
        error: NextResponse.json(
          {
            error: `Monthly WhatsApp messages limit reached: Your ${plan.planName} plan allows ${limit} messages per month. You have used ${current}. Please upgrade to ${requiredPlan} to send more messages.`,
            code: 'LIMIT_REACHED',
            metric,
            limit,
            current,
            requiredPlan,
          },
          { status: 403 }
        ),
      };
    }
  }

  return { success: true, plan };
}

/**
 * Increment usage counter for a given metric and salon in the current YYYY-MM period.
 */
export async function incrementUsage(salonId: string, metric: string, amount = 1): Promise<number> {
  const period = new Date().toISOString().slice(0, 7);
  const res = await query(
    `INSERT INTO usage_counters (salon_id, metric, period, count, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (salon_id, metric, period)
     DO UPDATE SET count = usage_counters.count + $4, updated_at = NOW()
     RETURNING count`,
    [salonId, metric, period, amount]
  );
  return res.rows[0]?.count || 0;
}

/**
 * Get comprehensive usage vs limits for a salon.
 */
export async function getSalonUsage(salonId: string) {
  const period = new Date().toISOString().slice(0, 7);

  const [staffRes, servicesRes, waRes] = await Promise.all([
    query('SELECT count(*)::int as count FROM staff WHERE salon_id = $1', [salonId]),
    query('SELECT count(*)::int as count FROM services WHERE salon_id = $1', [salonId]),
    query(
      'SELECT count FROM usage_counters WHERE salon_id = $1 AND metric = $2 AND period = $3',
      [salonId, 'wa_messages', period]
    ),
  ]);

  return {
    staffCount: staffRes.rows[0]?.count || 0,
    servicesCount: servicesRes.rows[0]?.count || 0,
    waMessagesCount: waRes.rows[0]?.count || 0,
    period,
  };
}

