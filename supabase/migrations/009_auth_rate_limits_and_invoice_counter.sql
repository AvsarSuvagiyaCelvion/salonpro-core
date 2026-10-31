-- Migration 009: Auth rate limiting and per-salon invoice counter & receipt token

-- 1. Auth rate limiting table
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key TEXT PRIMARY KEY,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_locked ON auth_rate_limits (locked_until);

-- 2. Per-salon invoice counter for atomic sequential numbers
ALTER TABLE salons ADD COLUMN IF NOT EXISTS invoice_counter INT NOT NULL DEFAULT 0;

-- 3. Unguessable receipt token for public invoice links
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS receipt_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_receipt_token ON invoices (receipt_token) WHERE receipt_token IS NOT NULL;

-- 4. Unique (salon_id, number) constraint on invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_invoices_salon_number'
  ) THEN
    ALTER TABLE invoices ADD CONSTRAINT uq_invoices_salon_number UNIQUE (salon_id, number);
  END IF;
END $$;

