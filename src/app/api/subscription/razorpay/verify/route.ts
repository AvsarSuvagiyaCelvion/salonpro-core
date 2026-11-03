import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { verifyRazorpayPaymentSignature } from '@/lib/razorpay';
import { clearSalonCache } from '@/lib/salon';
import { invalidateSalonPlanCache } from '@/lib/plan';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request, { allowExpired: true });
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      interval = 'monthly',
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay payment response parameters.' },
        { status: 400 }
      );
    }

    // 1. Verify cryptographic signature
    const isValid = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      // Record failure in database
      await query(
        `UPDATE subscription_payments
         SET status = 'failed',
             error_message = 'Signature verification failed',
             updated_at = NOW()
         WHERE razorpay_order_id = $1`,
        [razorpay_order_id]
      );

      return NextResponse.json(
        { error: 'Invalid payment signature. Transaction verification failed.' },
        { status: 400 }
      );
    }

    // 2. Fetch the plan
    const planRes = await query('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true', [planId]);
    if (planRes.rows.length === 0) {
      return NextResponse.json({ error: 'Subscribed plan could not be found.' }, { status: 404 });
    }
    const plan = planRes.rows[0];

    // 3. Mark payment as captured in database
    await query(
      `UPDATE subscription_payments
       SET status = 'captured',
           razorpay_payment_id = $1,
           razorpay_signature = $2,
           updated_at = NOW()
       WHERE razorpay_order_id = $3`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // 4. Update Salon subscription in database
    const isYearly = interval === 'yearly';
    const intervalSql = isYearly ? "'1 year'" : "'1 month'";

    const salonUpdateRes = await query(
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

    // 5. Invalidate caches immediately
    clearSalonCache();
    invalidateSalonPlanCache(salonId);

    return NextResponse.json({
      success: true,
      message: `Payment successful! Your salon is now activated on the ${plan.name} plan.`,
      salon: salonUpdateRes.rows[0],
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (error: any) {
    console.error('Verify Razorpay Payment Error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}

