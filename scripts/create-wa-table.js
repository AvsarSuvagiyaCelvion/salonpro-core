const fs = require('fs');
const { Pool } = require('pg');

const envContent = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) dbUrl = line.split('=')[1].trim();
}

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function migrate() {
  console.log('Creating whatsapp_delivery_logs table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_delivery_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
      invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      recipient_phone VARCHAR(30) NOT NULL,
      message_type VARCHAR(50) NOT NULL DEFAULT 'invoice_receipt',
      provider VARCHAR(50) NOT NULL DEFAULT 'whatsapp_cloud_api',
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      provider_message_id VARCHAR(120),
      payload JSONB,
      error_message TEXT,
      retry_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_wa_logs_salon_invoice ON whatsapp_delivery_logs(salon_id, invoice_id);
    CREATE INDEX IF NOT EXISTS idx_wa_logs_recipient ON whatsapp_delivery_logs(recipient_phone);
    CREATE INDEX IF NOT EXISTS idx_wa_logs_status ON whatsapp_delivery_logs(status);
  `);
  console.log('whatsapp_delivery_logs table and indexes verified.');
  await pool.end();
}

migrate().catch(console.error);

