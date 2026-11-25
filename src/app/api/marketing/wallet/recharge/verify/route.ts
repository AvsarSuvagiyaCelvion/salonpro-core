import { NextResponse } from 'next/server';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { query } from '@/lib/db';
import { serverError } from '@/lib/http';
import { verifyRazorpayPaymentSignature, fetchRazorpayPayment } from '@/lib/razorpay';
import { processWalletRechargeFromPayment } from '@/lib/wallet';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const body = await request.json().catch(() => ({}));

    // Take ONLY razorpay_order_id, razorpay_payment_id and razorpay_signature from body (ignore credits from body)
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment parameters.' },
        { status: 400 }
      );
    }

    // 1. Load the wallet_recharges row WHERE razorpay_order_id = $1 AND salon_id = session.salonId. If missing, return 404.
    const rechargeRes = await query(
      `SELECT * FROM wallet_recharges 
       WHERE razorpay_order_id = $1 AND salon_id = $2 
       LIMIT 1`,
      [razorpay_order_id, salonId]
    );

    if (rechargeRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Wallet recharge order not found for this salon.' },
        { status: 404 }
      );
    }

    const storedRecharge = rechargeRes.rows[0];

    // If row is already captured, return idempotent success
    if (storedRecharge.status === 'captured') {
      const result = await processWalletRechargeFromPayment({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        expectedSalonId: salonId,
      });
      return NextResponse.json(result, { status: 200 });
    }

    // 2. Verify HMAC SHA-256 signature
    const isValidSignature = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      await query(
        "UPDATE wallet_recharges SET status = 'failed' WHERE razorpay_order_id = $1 AND status = 'created'",
        [razorpay_order_id]
      );
      return NextResponse.json(
        { error: 'Invalid payment signature. Transaction could not be verified.' },
        { status: 400 }
      );
    }

    // 3. Fetch payment from Razorpay REST API and check status, order_id, amount
    try {
      const razorpayPayment = await fetchRazorpayPayment(razorpay_payment_id);
      const expectedPaise = Math.round(Number(storedRecharge.amount_inr) * 100);

      const isValidStatus = razorpayPayment.status === 'captured' || razorpayPayment.status === 'authorized';
      const isMatchingAmount = Number(razorpayPayment.amount) === expectedPaise;
      const isMatchingCurrency = razorpayPayment.currency?.toUpperCase() === 'INR';
      const isMatchingOrder = razorpayPayment.order_id === razorpay_order_id;

      if (!isValidStatus || !isMatchingAmount || !isMatchingCurrency || !isMatchingOrder) {
        await query(
          "UPDATE wallet_recharges SET status = 'failed' WHERE razorpay_order_id = $1 AND status = 'created'",
          [razorpay_order_id]
        );
        return NextResponse.json(
          { error: 'Payment details could not be verified with Razorpay.' },
          { status: 400 }
        );
      }
    } catch (err: any) {
      console.error('Failed to verify payment with Razorpay REST API:', err);
      return NextResponse.json(
        { error: 'Could not communicate with payment gateway to verify status.' },
        { status: 400 }
      );
    }

    // 4. In a DB transaction: UPDATE wallet_recharges SET status='captured'... and upsert salon_wallets
    const result = await processWalletRechargeFromPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      expectedSalonId: salonId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return serverError(error, 'src/app/api/marketing/wallet/recharge/verify/route.ts:POST');
  }
}
