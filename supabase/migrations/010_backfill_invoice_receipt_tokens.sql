-- Migration 010: Backfill receipt_token for all invoices that have NULL and enforce NOT NULL

UPDATE invoices
SET receipt_token = encode(gen_random_bytes(16), 'hex')
WHERE receipt_token IS NULL;

-- Enforce UNIQUE constraint across all non-null tokens if index does not exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_receipt_token ON invoices (receipt_token);
