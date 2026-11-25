-- Migration 026: WhatsApp Bulk Marketing Campaigns & At-Cost Wallets
-- Supports:
-- 1. salon_wallets: At-cost prepaid WhatsApp credits for salon owners (0% markup, direct Meta pass-through)
-- 2. whatsapp_campaigns: Tracks bulk broadcast campaigns sent by salon owners or platform super admin
-- 3. whatsapp_campaign_recipients: Detailed audit log of every individual recipient, phone, delivery status, and timestamps

CREATE TABLE IF NOT EXISTS salon_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE UNIQUE,
    balance_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    credits_count INTEGER NOT NULL DEFAULT 0,
    rate_per_msg NUMERIC(6, 2) NOT NULL DEFAULT 0.85,
    total_recharged_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_messages_sent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL DEFAULT 'owner',
    title VARCHAR(255) NOT NULL,
    audience_filter VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    total_recipients INTEGER NOT NULL DEFAULT 0,
    delivered_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
    recipient_name VARCHAR(120),
    recipient_phone VARCHAR(32) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'delivered',
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salon_wallets_salon_id ON salon_wallets(salon_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_salon ON whatsapp_campaigns(salon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_sender ON whatsapp_campaigns(sender_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_recipients_campaign ON whatsapp_campaign_recipients(campaign_id);

ALTER TABLE salon_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaign_recipients ENABLE ROW LEVEL SECURITY;
