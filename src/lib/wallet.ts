import pool, { query } from '@/lib/db';

export const AT_COST_RATE_PER_MSG = 0.85;

export interface ProcessWalletRechargeParams {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  expectedSalonId?: string; // If provided, ensures order belongs to this salon
}

export interface ProcessWalletRechargeResult {
  success: boolean;
  statusCode?: number;
  idempotent?: boolean;
  creditsAdded?: number;
  newCreditsCount?: number;
  amountChargedINR?: number;
  ratePerMsg?: number;
  message?: string;
  error?: string;
}

/**
 * Shared idempotent wallet recharge processing logic used by:
 * 1. POST /api/marketing/wallet/recharge/verify
 * 2. POST /api/subscription/razorpay/webhook (payment.captured / order.paid)
 */
export async function processWalletRechargeFromPayment({
  razorpayOrderId,
  razorpayPaymentId,
  expectedSalonId,
}: ProcessWalletRechargeParams): Promise<ProcessWalletRechargeResult> {
  // 1. Fetch wallet_recharges row
  const rechargeRes = await query(
    `SELECT * FROM wallet_recharges WHERE razorpay_order_id = $1 LIMIT 1`,
    [razorpayOrderId]
  );

  if (rechargeRes.rows.length === 0) {
    return {
      success: false,
      statusCode: 404,
      error: 'Wallet recharge order not found.',
      message: 'Wallet recharge order not found.',
    };
  }

  const recharge = rechargeRes.rows[0];

  // 2. Validate tenant ownership if expectedSalonId provided
  if (expectedSalonId && recharge.salon_id !== expectedSalonId) {
    return {
      success: false,
      statusCode: 404,
      error: 'Wallet recharge order not found for this salon.',
      message: 'Wallet recharge order not found for this salon.',
    };
  }

  // 3. Idempotent check: If already captured, return success with current balance without re-adding credits
  if (recharge.status === 'captured') {
    const walletRes = await query(
      `SELECT balance_inr, credits_count, rate_per_msg FROM salon_wallets WHERE salon_id = $1 LIMIT 1`,
      [recharge.salon_id]
    );
    const currentWallet = walletRes.rows[0] || { balance_inr: recharge.amount_inr, credits_count: recharge.credits };

    return {
      success: true,
      idempotent: true,
      creditsAdded: 0,
      newCreditsCount: parseInt(String(currentWallet.credits_count), 10),
      amountChargedINR: Number(recharge.amount_inr),
      ratePerMsg: AT_COST_RATE_PER_MSG,
      message: `Wallet recharge already processed for order ${razorpayOrderId}.`,
    };
  }

  // 4. In a DB transaction:
  // UPDATE wallet_recharges SET status='captured', razorpay_payment_id=$2, captured_at=NOW()
  // WHERE razorpay_order_id=$1 AND status='created' RETURNING credits, amount_inr, salon_id
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');

    const updateRes = await client.query(
      `UPDATE wallet_recharges 
       SET status = 'captured', 
           razorpay_payment_id = COALESCE($2, razorpay_payment_id), 
           captured_at = NOW() 
       WHERE razorpay_order_id = $1 AND status = 'created' 
       RETURNING credits, amount_inr, salon_id`,
      [razorpayOrderId, razorpayPaymentId || null]
    );

    if (updateRes.rows.length === 0) {
      // Concurrent or already processed
      await client.query('COMMIT;');
      const walletRes = await query(
        `SELECT balance_inr, credits_count, rate_per_msg FROM salon_wallets WHERE salon_id = $1 LIMIT 1`,
        [recharge.salon_id]
      );
      const currentWallet = walletRes.rows[0] || { balance_inr: recharge.amount_inr, credits_count: recharge.credits };

      return {
        success: true,
        idempotent: true,
        creditsAdded: 0,
        newCreditsCount: parseInt(String(currentWallet.credits_count), 10),
        amountChargedINR: Number(recharge.amount_inr),
        ratePerMsg: AT_COST_RATE_PER_MSG,
        message: `Wallet recharge already processed for order ${razorpayOrderId}.`,
      };
    }

    const capturedRow = updateRes.rows[0];
    const creditsToCredit = capturedRow.credits;
    const amountToCredit = Number(capturedRow.amount_inr);
    const salonId = capturedRow.salon_id;

    // Upsert salon_wallets using credits and amount from that row
    const upsertWalletRes = await client.query(
      `INSERT INTO salon_wallets (salon_id, balance_inr, credits_count, rate_per_msg, total_recharged_inr)
       VALUES ($1, $2, $3, $4, $2)
       ON CONFLICT (salon_id) DO UPDATE SET
         balance_inr = salon_wallets.balance_inr + EXCLUDED.balance_inr,
         credits_count = salon_wallets.credits_count + EXCLUDED.credits_count,
         total_recharged_inr = salon_wallets.total_recharged_inr + EXCLUDED.balance_inr,
         updated_at = NOW()
       RETURNING balance_inr, credits_count, rate_per_msg`,
      [salonId, amountToCredit, creditsToCredit, AT_COST_RATE_PER_MSG]
    );

    await client.query('COMMIT;');

    const updatedWallet = upsertWalletRes.rows[0];

    return {
      success: true,
      idempotent: false,
      creditsAdded: creditsToCredit,
      newCreditsCount: parseInt(String(updatedWallet.credits_count), 10),
      amountChargedINR: amountToCredit,
      ratePerMsg: AT_COST_RATE_PER_MSG,
      message: `Payment verified! Added ${creditsToCredit} WhatsApp marketing credits.`,
    };
  } catch (txErr) {
    await client.query('ROLLBACK;');
    throw txErr;
  } finally {
    client.release();
  }
}
