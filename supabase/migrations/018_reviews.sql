-- Migration 018: Customer Reviews and Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 500),
  owner_reply TEXT CHECK (owner_reply IS NULL OR char_length(owner_reply) <= 300),
  owner_replied_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_salon_status_created ON reviews (salon_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews (customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_staff_id ON reviews (staff_id);

-- Enable Row Level Security (RLS) consistent with 013 & 016
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Allow public read access on reviews'
  ) THEN
    CREATE POLICY "Allow public read access on reviews"
    ON reviews FOR SELECT
    USING (true);
  END IF;
END $$;

-- Configure reviews flag in subscription_plans: Pro & Premium get reviews = true, Basic gets reviews = false
UPDATE subscription_plans
SET flags = jsonb_set(COALESCE(flags, '{}'::jsonb), '{reviews}', 'true'::jsonb)
WHERE slug IN ('pro', 'premium');

UPDATE subscription_plans
SET flags = jsonb_set(COALESCE(flags, '{}'::jsonb), '{reviews}', 'false'::jsonb)
WHERE slug = 'basic';

