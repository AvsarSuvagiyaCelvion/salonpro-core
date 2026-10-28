-- Migration: 007_invoices_tax_and_tenant_indexes.sql
-- Description: Add tax storage columns to invoices and high-performance tenant isolation indexes

-- 1. Add tax columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 2. Add high-performance tenant indexes to guarantee instant queries per salon
CREATE INDEX IF NOT EXISTS idx_appointments_salon_date ON appointments(salon_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_invoices_salon_date ON invoices(salon_id, created_at);
CREATE INDEX IF NOT EXISTS idx_customers_salon ON customers(salon_id);
CREATE INDEX IF NOT EXISTS idx_sessions_salon_status ON sessions(salon_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_salon ON staff(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_salon ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_products_salon ON products(salon_id);
CREATE INDEX IF NOT EXISTS idx_waiting_salon ON waiting(salon_id);
