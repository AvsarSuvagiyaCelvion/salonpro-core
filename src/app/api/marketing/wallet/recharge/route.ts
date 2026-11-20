import { NextRequest, NextResponse } from 'next/server';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { query } from '@/lib/db';
import { serverError } from '@/lib/http';

export const AT_COST_RATE_PER_MSG = 0.85;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const isDemo = auth.session.salonSlug === 'dixa-beauty-salon';

    const body = await request.json().catch(() => ({}));
    const { credits = 500, paymentMethod = 'upi' } = body;

    const creditsCount = parseInt(String(credits), 10);
    if (isNaN(creditsCount) || creditsCount <= 0) {
      return NextResponse.json(
        { error: 'Invalid credit quantity. Minimum 50 credits.' },
        { status: 400 }
      );
    }

    const totalCostINR = Math.round(creditsCount * AT_COST_RATE_PER_MSG * 100) / 100;

    if (isDemo) {
      return NextResponse.json({
        success: true,
        creditsAdded: creditsCount,
        newBalance: 500 + creditsCount,
        amountChargedINR: totalCostINR,
        ratePerMsg: AT_COST_RATE_PER_MSG,
        message: `Demo recharge of ${creditsCount} credits (₹${totalCostINR.toFixed(2)}) applied instantly!`,
      });
    }

    // Upsert salon wallet atomically
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
      message: `Recharge successful! Added ${creditsCount} WhatsApp marketing credits at cost price (₹${AT_COST_RATE_PER_MSG}/msg).`,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/marketing/wallet/recharge/route.ts:POST');
  }
}
