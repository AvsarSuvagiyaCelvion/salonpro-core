import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { verifyRazorpayPaymentSignature, fetchRazorpayPayment } from '@/lib/razorpay';
import { activateSubscriptionFromPayment, markSubscriptionPaymentFailed } from '@/lib/subscription';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request, { allowExpired: true });
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const body = await request.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay payment response parameters.' },
        { status: 400 }
      );
    }

    // 1. Load row by razorpay_order_id AND salon_id = session.salonId (Do NOT trust planId or interval from body)
    const paymentRes = await query(
      `SELECT * FROM subscription_payments 
       WHERE razorpay_order_id = $1 AND salon_id = $2 
       LIMIT 1`,
      [razorpay_order_id, salonId]
    );

    if (paymentRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Subscription payment order not found for this salon.' },
        { status: 404 }
      );
    }

    const storedPayment = paymentRes.rows[0];

    // 2. If row is already status='captured', return existing success result idempotently (no second extension)
    if (storedPayment.status === 'captured') {
      const result = await activateSubscriptionFromPayment({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        expectedSalonId: salonId,
      });
      return NextResponse.json(result, { status: 200 });
    }

    // 3. Verify HMAC signature
    const isValidSignature = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      await markSubscriptionPaymentFailed(razorpay_order_id, 'Signature verification failed');
      return NextResponse.json(
        { error: 'Invalid payment signature. Transaction verification failed.' },
        { status: 400 }
      );
    }

    // 4. REST API verification against Razorpay GET /v1/payments/{id}
    try {
      const razorpayPayment = await fetchRazorpayPayment(razorpay_payment_id);
      const expectedPaise = Math.round(Number(storedPayment.amount) * 100);

      const isValidStatus = razorpayPayment.status === 'captured' || razorpayPayment.status === 'authorized';
      const isMatchingAmount = Number(razorpayPayment.amount) === expectedPaise;
      const isMatchingCurrency = razorpayPayment.currency?.toUpperCase() === 'INR';
      const isMatchingOrder = razorpayPayment.order_id === razorpay_order_id;

      if (!isValidStatus || !isMatchingAmount || !isMatchingCurrency || !isMatchingOrder) {
        const mismatchReason = `Payment details mismatch: status=${razorpayPayment.status}, amount=${razorpayPayment.amount}/${expectedPaise}, order=${razorpayPayment.order_id}`;
        await markSubscriptionPaymentFailed(razorpay_order_id, mismatchReason);
        return NextResponse.json(
          { error: 'Payment details could not be verified with Razorpay.' },
          { status: 400 }
        );
      }
    } catch (err: any) {
      console.error('Failed to verify payment with Razorpay REST API:', err);
      await markSubscriptionPaymentFailed(razorpay_order_id, `REST verification failed: ${err.message}`);
      return NextResponse.json(
        { error: 'Could not communicate with payment gateway to verify status.' },
        { status: 400 }
      );
    }

    // 5. Atomic conditional update & extension
    const activationResult = await activateSubscriptionFromPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      expectedSalonId: salonId,
    });

    if (!activationResult.success) {
      return NextResponse.json(
        { error: activationResult.error || 'Failed to activate subscription.' },
        { status: activationResult.statusCode || 400 }
      );
    }

    return NextResponse.json(activationResult, { status: 200 });
  } catch (error: any) {
    console.error('Subscription verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing subscription payment.' },
      { status: 500 }
    );
  }
}
