-- Migration 020: Add invoice_prefix column to salons table for salon-branded invoice numbering
-- Allows salon owners to customize their invoice prefix (e.g. 'PALAK', 'DIXA', 'GLAM')

ALTER TABLE salons ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(16);
