-- Migration 028: Wallet Recharges table for secure prepaid WhatsApp marketing credits
CREATE TABLE IF NOT EXISTS wallet_recharges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT,
    credits INTEGER NOT NULL,
    amount_inr NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'captured', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    captured_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wallet_recharges_salon_id ON wallet_recharges(salon_id);
CREATE INDEX IF NOT EXISTS idx_wallet_recharges_order_id ON wallet_recharges(razorpay_order_id);

ALTER TABLE wallet_recharges ENABLE ROW LEVEL SECURITY;
