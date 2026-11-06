-- Migration 017: Add email, address, and avatar_url to customers
-- Note: 'email' may already exist from migration 001; ADD COLUMN IF NOT EXISTS ensures safe idempotency.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

