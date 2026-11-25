-- Migration 027: Salon Owner Custom WhatsApp Settings & Multi-Mode Dispatch
-- Allows salon owners to choose:
--   1. 'direct'   : Free 1-click device WhatsApp Web/App (Zero cost, no API required)
--   2. 'own_api'  : Dedicated Meta Cloud API with salon's own Phone Number ID & Token
--   3. 'platform' : StudioDesk Managed Gateway with prepaid credits (0% markup, ₹0.85/msg)

ALTER TABLE salons
ADD COLUMN IF NOT EXISTS whatsapp_mode VARCHAR(20) NOT NULL DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_cloud_token TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_waba_id TEXT;
