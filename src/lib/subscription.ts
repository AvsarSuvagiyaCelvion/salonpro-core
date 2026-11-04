import pool, { query } from '@/lib/db';
import { clearSalonCache } from '@/lib/salon';
import { invalidateSalonPlanCache } from '@/lib/plan';

export interface SubscriptionActivationParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  expectedSalonId?: string; // If provided, ensures order belongs to this salon
}

export interface SubscriptionActivationResult {
  success: boolean;
  message: string;
  idempotent?: boolean;
  salon?: any;
  plan?: any;
  subscriptionEndsAt?: string | Date | null;
  paymentId?: string;
  orderId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Shared idempotent subscription activation logic used by:
 * 1. POST /api/subscription/razorpay/verify
 * 2. POST /api/subscription/razorpay/webhook
 */
export async function activateSubscriptionFromPayment({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  expectedSalonId,
}: SubscriptionActivationParams): Promise<SubscriptionActivationResult> {
  // 1. Fetch stored subscription_payments row joined with plan
  const paymentRes = await query(
    `SELECT sp.*, 
            p.slug as plan_slug, 
            p.name as plan_name, 
            p.price as plan_price, 
            p.yearly_price as plan_yearly_price, 
            p.features as plan_features, 
            p.limits as plan_limits, 
            p.flags as plan_flags
     FROM subscription_payments sp
     JOIN subscription_plans p ON sp.plan_id = p.id
     WHERE sp.razorpay_order_id = $1
     LIMIT 1`,
    [razorpayOrderId]
  );

  if (paymentRes.rows.length === 0) {
    return {
      success: false,
      statusCode: 404,
      error: 'Subscription payment order not found.',
      message: 'Subscription payment order not found.',
    };
  }

  const paymentRecord = paymentRes.rows[0];

  // 2. Validate tenant ownership if expectedSalonId provided
  if (expectedSalonId && paymentRecord.salon_id !== expectedSalonId) {
    return {
      success: false,
      statusCode: 403,
      error: 'Unauthorized: order belongs to another workspace.',
      message: 'Unauthorized: order belongs to another workspace.',
    };
  }

  const isYearly = paymentRecord.billing_interval === 'yearly';
  const planInfo = {
    id: paymentRecord.plan_id,
    name: paymentRecord.plan_name,
    slug: paymentRecord.plan_slug,
    price: isYearly ? paymentRecord.plan_yearly_price : paymentRecord.plan_price,
    billingInterval: paymentRecord.billing_interval,
    features: Array.isArray(paymentRecord.plan_features) ? paymentRecord.plan_features : [],
    limits: paymentRecord.plan_limits || {},
    flags: paymentRecord.plan_flags || {},
  };

  // 3. Idempotent check: If already captured, return success without extending again
  if (paymentRecord.status === 'captured') {
    const salonRes = await query('SELECT * FROM salons WHERE id = $1 LIMIT 1', [paymentRecord.salon_id]);
    const currentSalon = salonRes.rows[0];

    return {
      success: true,
      idempotent: true,
      message: `Subscription already active on ${paymentRecord.plan_name} plan.`,
      salon: currentSalon,
      plan: planInfo,
      subscriptionEndsAt: currentSalon?.subscription_ends_at,
      paymentId: paymentRecord.razorpay_payment_id || razorpayPaymentId,
      orderId: razorpayOrderId,
    };
  }

  // 4. Atomic transaction: Conditionally update status to 'captured' and extend subscription
  const client = await pool.connect();
  let inTransaction = false;

  try {
    await client.query('BEGIN');
    inTransaction = true;

    // Update payment row ONLY if still 'created'
    const updatePayRes = await client.query(
      `UPDATE subscription_payments
       SET status = 'captured',
           razorpay_payment_id = $1,
           razorpay_signature = COALESCE($2, razorpay_signature),
           updated_at = NOW()
       WHERE razorpay_order_id = $3 AND status = 'created'
       RETURNING *`,
      [razorpayPaymentId, razorpaySignature || null, razorpayOrderId]
    );

    let updatedSalon: any = null;

    if (updatePayRes.rowCount === 1) {
      // Exactly 1 row captured: apply extension logic
      // new_end = GREATEST(NOW(), COALESCE(current subscription_ends_at, NOW())) + interval
      const intervalSql = isYearly ? "'1 year'" : "'1 month'";

      const salonUpdateRes = await client.query(
        `UPDATE salons
         SET 
           subscription_status = 'active',
           subscription_plan_id = $1,
           subscription_ends_at = GREATEST(NOW(), COALESCE(subscription_ends_at, NOW())) + INTERVAL ${intervalSql},
           plan = $2
         WHERE id = $3
         RETURNING *`,
        [paymentRecord.plan_id, paymentRecord.plan_slug || 'pro', paymentRecord.salon_id]
      );

      updatedSalon = salonUpdateRes.rows[0];
    } else {
      // Row was already updated by another concurrent request
      const salonRes = await client.query('SELECT * FROM salons WHERE id = $1 LIMIT 1', [paymentRecord.salon_id]);
      updatedSalon = salonRes.rows[0];
    }

    await client.query('COMMIT');
    inTransaction = false;

    clearSalonCache();
    invalidateSalonPlanCache(paymentRecord.salon_id);

    return {
      success: true,
      message: `Payment successful! Your salon is now activated on the ${paymentRecord.plan_name} plan.`,
      salon: updatedSalon,
      plan: planInfo,
      subscriptionEndsAt: updatedSalon?.subscription_ends_at,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
    };
  } catch (err: any) {
    if (inTransaction) {
      try {
        await client.query('ROLLBACK');
      } catch {}
    }
    console.error('Subscription activation transaction error:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Marks a subscription payment as failed with an error message
 */
export async function markSubscriptionPaymentFailed(
  razorpayOrderId: string,
  errorMessage: string
): Promise<void> {
  try {
    await query(
      `UPDATE subscription_payments
       SET status = 'failed',
           error_message = $1,
           updated_at = NOW()
       WHERE razorpay_order_id = $2`,
      [errorMessage, razorpayOrderId]
    );
  } catch (err) {
    console.error('Failed to mark subscription payment failed:', err);
  }
}

