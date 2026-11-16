-- Migration: 024_upi_payment_settings.sql
-- Description: Add custom salon UPI & QR settings for zero-fee POS payments and platform global payment settings

-- 1. Add UPI payment columns to salons table
ALTER TABLE salons ADD COLUMN IF NOT EXISTS upi_id TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS upi_number TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS upi_qr_url TEXT;

-- 2. Create platform_settings table for Super Admin direct UPI and bank details
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'platform_settings' AND policyname = 'allow_authenticated_read_platform_settings'
  ) THEN
    CREATE POLICY allow_authenticated_read_platform_settings ON platform_settings
    FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Seed default platform payment settings if not present
INSERT INTO platform_settings (key, value) VALUES
  ('platform_upi_id', '8320653782@okaxis'),
  ('platform_upi_number', '8320653782'),
  ('platform_account_name', 'Avsar Suvagiya'),
  ('platform_bank_name', 'State Bank of India'),
  ('platform_account_number', 'XXXXXX1234'),
  ('platform_ifsc_code', 'SBIN0001234'),
  ('platform_support_whatsapp', '918320653782')
ON CONFLICT (key) DO NOTHING;

