-- Migration 019: Individual Staff Weekly Shifts and Staff Leaves

-- 1. Create staff_shifts table
CREATE TABLE IF NOT EXISTS staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_off BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_staff_shifts_staff_weekday UNIQUE (staff_id, weekday),
  CONSTRAINT chk_staff_shifts_time CHECK (is_off = true OR end_time > start_time)
);

-- Indexes for staff_shifts
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff ON staff_shifts (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_salon ON staff_shifts (salon_id);

-- 2. Create staff_leaves table
CREATE TABLE IF NOT EXISTS staff_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_staff_leaves_dates CHECK (to_date >= from_date)
);

-- Indexes for staff_leaves
CREATE INDEX IF NOT EXISTS idx_staff_leaves_staff_dates ON staff_leaves (staff_id, from_date, to_date);
CREATE INDEX IF NOT EXISTS idx_staff_leaves_salon ON staff_leaves (salon_id);

-- 3. Enable Row Level Security (RLS) consistent with 013 & 018
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_leaves ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_shifts' AND policyname = 'Allow public read access on staff_shifts'
  ) THEN
    CREATE POLICY "Allow public read access on staff_shifts"
    ON staff_shifts FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_leaves' AND policyname = 'Allow public read access on staff_leaves'
  ) THEN
    CREATE POLICY "Allow public read access on staff_leaves"
    ON staff_leaves FOR SELECT
    USING (true);
  END IF;
END $$;

