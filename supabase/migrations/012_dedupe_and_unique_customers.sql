-- Migration 012: Safely deduplicate customers per (salon_id, mobile) and add unique constraint

DO $$
BEGIN
  -- Create temporary table mapping duplicate customers to the oldest (canonical) record
  CREATE TEMP TABLE customer_dedupe_map AS
  WITH ranked_customers AS (
    SELECT 
      id,
      salon_id,
      mobile,
      FIRST_VALUE(id) OVER (
        PARTITION BY salon_id, mobile 
        ORDER BY created_at ASC, id ASC
      ) AS canonical_id,
      ROW_NUMBER() OVER (
        PARTITION BY salon_id, mobile 
        ORDER BY created_at ASC, id ASC
      ) AS rn
    FROM customers
    WHERE mobile IS NOT NULL AND mobile <> ''
  )
  SELECT id AS duplicate_id, canonical_id
  FROM ranked_customers
  WHERE rn > 1;

  -- Repoint foreign keys from duplicates to canonical customer record
  IF EXISTS (SELECT 1 FROM customer_dedupe_map) THEN
    -- 1. Appointments
    UPDATE appointments a
    SET customer_id = m.canonical_id
    FROM customer_dedupe_map m
    WHERE a.customer_id = m.duplicate_id;

    -- 2. Invoices
    UPDATE invoices i
    SET customer_id = m.canonical_id
    FROM customer_dedupe_map m
    WHERE i.customer_id = m.duplicate_id;

    -- 3. Sessions
    UPDATE sessions s
    SET customer_id = m.canonical_id
    FROM customer_dedupe_map m
    WHERE s.customer_id = m.duplicate_id;

    -- 4. Waiting queue
    UPDATE waiting w
    SET customer_id = m.canonical_id
    FROM customer_dedupe_map m
    WHERE w.customer_id = m.duplicate_id;

    -- 5. Customer Plans
    UPDATE customer_plans cp
    SET customer_id = m.canonical_id
    FROM customer_dedupe_map m
    WHERE cp.customer_id = m.duplicate_id;

    -- Delete deduplicated customer rows
    DELETE FROM customers c
    USING customer_dedupe_map m
    WHERE c.id = m.duplicate_id;
  END IF;

  DROP TABLE IF EXISTS customer_dedupe_map;
END $$;

-- Enforce unique customer mobile per salon workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_salon_mobile ON customers(salon_id, mobile);

