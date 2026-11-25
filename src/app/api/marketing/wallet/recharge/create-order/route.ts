import { NextResponse } from 'next/server';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { query } from '@/lib/db';
import { serverError } from '@/lib/http';
import { createRazorpayOrder, getRazorpayKeys } from '@/lib/razorpay';
import { AT_COST_RATE_PER_MSG } from '../route';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const body = await request.json().catch(() => ({}));
    const { credits = 500 } = body;

    const creditsCount = parseInt(String(credits), 10);
    if (isNaN(creditsCount) || creditsCount < 50) {
      return NextResponse.json(
        { error: 'Invalid credit quantity. Minimum 50 credits.' },
        { status: 400 }
      );
    }

    const totalCostINR = Math.round(creditsCount * AT_COST_RATE_PER_MSG * 100) / 100;

    // Fetch salon details for prefill
    const salonRes = await query('SELECT id, name, phone, email FROM salons WHERE id = $1 LIMIT 1', [salonId]);
    const salon = salonRes.rows[0] || {};

    const { keyId } = getRazorpayKeys();

    // Create Razorpay Order
    const order = await createRazorpayOrder({
      amount: totalCostINR,
      currency: 'INR',
      receipt: `wlt_${Date.now()}`,
      notes: {
        type: 'whatsapp_wallet_recharge',
        salon_id: salonId,
        credits: String(creditsCount),
        rate_per_msg: String(AT_COST_RATE_PER_MSG),
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount, // in paise
      currency: order.currency,
      keyId,
      credits: creditsCount,
      totalCostINR,
      salonName: salon.name || 'StudioDesk Salon',
      salonPhone: salon.phone || '',
      salonEmail: salon.email || '',
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/marketing/wallet/recharge/create-order/route.ts:POST');
  }
}
