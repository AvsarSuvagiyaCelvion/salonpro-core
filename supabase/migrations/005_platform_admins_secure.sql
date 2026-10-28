-- Migration 005: Platform Admins Security & Password Hashing
-- Enables pgcrypto, creates/secures platform_admins table, migrates plain-text passwords to bcrypt hashes

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL DEFAULT 'Super Admin',
  role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'platform_admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Migrate legacy schema from wipe-fake-data.js if plain text 'password' column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_admins' AND column_name = 'password'
  ) THEN
    ALTER TABLE platform_admins ADD COLUMN IF NOT EXISTS password_hash TEXT;
    ALTER TABLE platform_admins ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
    
    -- Hash any existing plain text password with blowfish (bcrypt)
    UPDATE platform_admins 
    SET password_hash = crypt(password, gen_salt('bf', 10)),
        must_change_password = true
    WHERE (password_hash IS NULL OR password_hash = '') AND password IS NOT NULL;
    
    -- Drop legacy insecure plain-text column
    ALTER TABLE platform_admins DROP COLUMN IF EXISTS password;
  END IF;
END $$;

-- Ensure password_hash is not null for future inserts
ALTER TABLE platform_admins ALTER COLUMN password_hash SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(LOWER(email));
