-- Migration: Customer self-service cancel + reschedule
-- 1. Add cancel_policy_hours to salons table
ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS cancel_policy_hours integer NOT NULL DEFAULT 2;

-- 2. Add cancelled_by, cancelled_at, rescheduled_count to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cancelled_by text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS rescheduled_count integer NOT NULL DEFAULT 0;

-- 3. Add check constraint for cancelled_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_cancelled_by_check'
  ) THEN
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_cancelled_by_check 
    CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer', 'owner'));
  END IF;
END $$;
