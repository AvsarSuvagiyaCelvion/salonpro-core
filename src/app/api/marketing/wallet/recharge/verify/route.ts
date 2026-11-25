import { NextResponse } from 'next/server';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { query } from '@/lib/db';
import { serverError } from '@/lib/http';
import { verifyRazorpayPaymentSignature } from '@/lib/razorpay';
import { AT_COST_RATE_PER_MSG } from '../route';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const body = await request.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      credits,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment parameters.' },
        { status: 400 }
      );
    }

    const creditsCount = parseInt(String(credits), 10);
    if (isNaN(creditsCount) || creditsCount < 50) {
      return NextResponse.json(
        { error: 'Invalid credit quantity.' },
        { status: 400 }
      );
    }

    // 1. Verify HMAC SHA-256 signature
    const isValid = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Transaction could not be verified.' },
        { status: 400 }
      );
    }

    const totalCostINR = Math.round(creditsCount * AT_COST_RATE_PER_MSG * 100) / 100;

    // 2. Upsert salon wallet atomically upon verified payment
    const updateRes = await query(
      `INSERT INTO salon_wallets (salon_id, balance_inr, credits_count, rate_per_msg, total_recharged_inr)
       VALUES ($1, $2, $3, $4, $2)
       ON CONFLICT (salon_id) DO UPDATE SET
         balance_inr = salon_wallets.balance_inr + EXCLUDED.balance_inr,
         credits_count = salon_wallets.credits_count + EXCLUDED.credits_count,
         total_recharged_inr = salon_wallets.total_recharged_inr + EXCLUDED.balance_inr,
         updated_at = NOW()
       RETURNING balance_inr, credits_count, rate_per_msg`,
      [salonId, totalCostINR, creditsCount, AT_COST_RATE_PER_MSG]
    );

    const updated = updateRes.rows[0];

    return NextResponse.json({
      success: true,
      creditsAdded: creditsCount,
      newCreditsCount: parseInt(updated.credits_count, 10),
      amountChargedINR: totalCostINR,
      ratePerMsg: AT_COST_RATE_PER_MSG,
      message: `Payment verified! Added ${creditsCount} WhatsApp marketing credits.`,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/marketing/wallet/recharge/verify/route.ts:POST');
  }
}
