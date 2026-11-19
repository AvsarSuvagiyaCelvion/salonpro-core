-- Migration 025: Salon Daily Expenses & Net Cash Profit Tracker
-- Enables salon owners to track daily petty cash outflows (tea, laundry, supplies, utilities)
-- and compute real-time daily Net Profit (Gross Sales - Daily Expenses = Net Cash In Hand).

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'Supplies',
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_mode VARCHAR(20) NOT NULL DEFAULT 'cash',
  notes TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_salon_date ON expenses (salon_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_salon_category ON expenses (salon_id, category);
