-- Migration: Add password_hash and pin to customers for customer login and signup
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT '1234';

-- Ensure demo customers have default pin/password
UPDATE customers 
SET pin = '1234' 
WHERE pin IS NULL;
