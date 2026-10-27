-- Migration: Add address, phone, and booking_enabled to salons table
ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '101, Titanium Square, Thaltej, Ahmedabad',
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+91 98250 12345',
ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN NOT NULL DEFAULT true;
