-- Migration 014: Add salon_holidays table for owner holiday / closure management
CREATE TABLE IF NOT EXISTS salon_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salon_holidays_lookup ON salon_holidays (salon_id, start_date, end_date);
