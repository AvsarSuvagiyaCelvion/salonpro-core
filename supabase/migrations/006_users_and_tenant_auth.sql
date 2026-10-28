-- Migration: 006_users_and_tenant_auth.sql
-- Description: Create users table for tenant auth, add tenant status columns, bootstrap existing salon owners

-- 1. Ensure pgcrypto is enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Add SaaS tenant management columns to salons
ALTER TABLE salons ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'pro';

-- 3. Create users table for salon owners and staff logins
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_salon_id ON users (salon_id);

-- 4. Bootstrap owner user for any existing salon that lacks an owner user
DO $$
DECLARE
  salon_rec RECORD;
BEGIN
  FOR salon_rec IN SELECT id, name, phone FROM salons LOOP
    IF NOT EXISTS (SELECT 1 FROM users WHERE salon_id = salon_rec.id AND role = 'owner') THEN
      INSERT INTO users (
        salon_id,
        email,
        password_hash,
        full_name,
        phone,
        role,
        is_active
      ) VALUES (
        salon_rec.id,
        'avsarsuvagiya968@gmail.com',
        crypt('Av$@r2136', gen_salt('bf', 10)),
        COALESCE(salon_rec.name, 'Salon Owner'),
        salon_rec.phone,
        'owner',
        true
      )
      ON CONFLICT (LOWER(email)) DO NOTHING;
    END IF;
  END LOOP;
END $$;
