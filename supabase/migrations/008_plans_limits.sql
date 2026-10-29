-- Migration: 008_plans_limits.sql
-- Description: Implement 3 subscription plans (Basic, Pro, Premium) with limits, feature flags, and usage counters

-- 1. Ensure subscription_plans table exists
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  yearly_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  max_staff INT NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add limits, flags, and yearly_price columns to subscription_plans if missing
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS limits JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS flags JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS yearly_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- 3. Add trial & subscription columns to salons if missing
ALTER TABLE salons ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false;

-- 4. Create usage_counters table for tracking periodic metric consumption
CREATE TABLE IF NOT EXISTS usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  period TEXT NOT NULL, -- 'YYYY-MM'
  count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(salon_id, metric, period)
);

CREATE INDEX IF NOT EXISTS idx_usage_counters_lookup ON usage_counters(salon_id, metric, period);

-- 5. Seed / Upsert the 3 Core Plans: Basic, Pro, Premium
INSERT INTO subscription_plans (
  slug,
  name,
  description,
  price,
  yearly_price,
  billing_interval,
  sort_order,
  is_popular,
  is_active,
  limits,
  flags,
  features,
  max_staff
) VALUES 
(
  'basic',
  'Basic',
  'Essential salon operating system for solo artists & boutique studios',
  499.00,
  4990.00,
  'monthly',
  1,
  false,
  true,
  '{"max_staff": 3, "max_services": 30, "wa_per_month": 0}'::jsonb,
  '{"logo_upload": false, "commission_report": false, "memberships": false, "calendar_view": false, "customer_cancel": false, "export": false, "coupons": false, "reviews": false, "loyalty": false, "custom_domain": false, "multi_branch": false, "priority_support": false}'::jsonb,
  '["Up to 3 Staff Members", "Up to 30 Services Catalog", "Unlimited Client Appointments", "10-Second GST POS Billing", "Standard Customer Records"]'::jsonb,
  3
),
(
  'pro',
  'Pro',
  'Complete management & marketing suite for growing busy salons & spas',
  999.00,
  9990.00,
  'monthly',
  2,
  true,
  true,
  '{"max_staff": 10, "max_services": 100, "wa_per_month": 200}'::jsonb,
  '{"logo_upload": true, "commission_report": true, "memberships": true, "calendar_view": true, "customer_cancel": true, "export": true, "coupons": true, "reviews": false, "loyalty": false, "custom_domain": false, "multi_branch": false, "priority_support": false}'::jsonb,
  '["Up to 10 Staff Members", "Up to 100 Services Catalog", "200 WhatsApp Messages / Month", "Smart Calendar View & Drag/Drop", "Staff Commission Reports & POS", "VIP Memberships & Discount Packages", "Excel / CSV Data Export", "Custom Logo Upload", "Client Self-Cancellation / Reschedule"]'::jsonb,
  10
),
(
  'premium',
  'Premium',
  'Full-scale enterprise power with unlimited staff, custom domain & multi-branch',
  1999.00,
  19990.00,
  'monthly',
  3,
  false,
  true,
  '{"max_staff": 0, "max_services": 0, "wa_per_month": 1000}'::jsonb,
  '{"logo_upload": true, "commission_report": true, "memberships": true, "calendar_view": true, "customer_cancel": true, "export": true, "coupons": true, "reviews": true, "loyalty": true, "custom_domain": true, "multi_branch": true, "priority_support": true}'::jsonb,
  '["Unlimited Staff Members", "Unlimited Services Catalog", "1,000 WhatsApp Messages / Month", "Custom Domain Name & Branding", "Client Loyalty & Automated Reviews", "Multi-Branch Governance", "All Pro Features Included", "24/7 Priority Support"]'::jsonb,
  0
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  yearly_price = EXCLUDED.yearly_price,
  billing_interval = EXCLUDED.billing_interval,
  sort_order = EXCLUDED.sort_order,
  is_popular = EXCLUDED.is_popular,
  is_active = EXCLUDED.is_active,
  limits = EXCLUDED.limits,
  flags = EXCLUDED.flags,
  features = EXCLUDED.features,
  max_staff = EXCLUDED.max_staff,
  updated_at = NOW();

-- 6. Migrate any salons mapped to old starter/growth/enterprise plans to the new plans
UPDATE salons 
SET subscription_plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
WHERE subscription_plan_id IN (
  SELECT id FROM subscription_plans WHERE slug NOT IN ('basic', 'pro', 'premium')
);

-- Delete or deactivate legacy plans
DELETE FROM subscription_plans WHERE slug NOT IN ('basic', 'pro', 'premium');

