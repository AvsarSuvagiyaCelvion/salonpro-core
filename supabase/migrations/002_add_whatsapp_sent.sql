-- Add whatsapp_sent tracking to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN NOT NULL DEFAULT false;
