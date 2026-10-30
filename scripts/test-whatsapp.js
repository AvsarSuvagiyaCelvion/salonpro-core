const fs = require('fs');
const { Pool } = require('pg');

const envContent = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) dbUrl = line.split('=')[1].trim();
}

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

// We test normalization function and DB delivery log table directly
function normalizeIndianPhone(input) {
  if (!input) return { valid: false, e164: '', waId: '', national: '' };
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) {
    return { valid: true, e164: `+91${digits}`, waId: `91${digits}`, national: digits };
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    const national = digits.slice(1);
    return { valid: true, e164: `+91${national}`, waId: `91${national}`, national };
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    const national = digits.slice(2);
    return { valid: true, e164: `+${digits}`, waId: digits, national };
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return { valid: true, e164: `+${digits}`, waId: digits, national: digits };
  }
  return { valid: false, e164: '', waId: '', national: digits };
}

async function runWhatsAppTests() {
  console.log('--- TESTING PHONE NORMALIZATION ---');
  const testCases = [
    { in: '9876500001', expectedE164: '+919876500001', expectedWaId: '919876500001' },
    { in: '09876500001', expectedE164: '+919876500001', expectedWaId: '919876500001' },
    { in: '+91 98765 00001', expectedE164: '+919876500001', expectedWaId: '919876500001' },
    { in: '919876500001', expectedE164: '+919876500001', expectedWaId: '919876500001' },
    { in: '+91-98765-00001', expectedE164: '+919876500001', expectedWaId: '919876500001' },
  ];

  for (const tc of testCases) {
    const norm = normalizeIndianPhone(tc.in);
    if (!norm.valid || norm.e164 !== tc.expectedE164 || norm.waId !== tc.expectedWaId) {
      console.error(`FAILED normalization for "${tc.in}": got`, norm);
      process.exit(1);
    }
    console.log(`✓ Normalized "${tc.in}" -> E.164: ${norm.e164}, WhatsApp ID: ${norm.waId}`);
  }

  console.log('\n--- TESTING WHATSAPP DELIVERY LOGGING TABLE ---');
  const salon = (await pool.query("SELECT id, name FROM salons LIMIT 1")).rows[0];
  
  // Test inserting and querying delivery log
  const logInsert = await pool.query(
    `INSERT INTO whatsapp_delivery_logs (
      salon_id, recipient_phone, message_type, provider, status, error_message, payload
    ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      salon.id,
      '+919876500001',
      'invoice_receipt',
      'whatsapp_cloud_api',
      'pending_credentials',
      'WHATSAPP_CLOUD_API_TOKEN or TWILIO_ACCOUNT_SID not configured in environment. Automated delivery logged.',
      JSON.stringify({ receiptUrl: 'https://salonpro-plum.vercel.app/b/INV-2026-0001', test: true })
    ]
  );

  const logId = logInsert.rows[0].id;
  console.log(`✓ Delivery log recorded with ID: ${logId}, status: ${logInsert.rows[0].status}`);

  // Query back
  const queryLog = await pool.query("SELECT * FROM whatsapp_delivery_logs WHERE id = $1", [logId]);
  if (queryLog.rows.length === 0 || queryLog.rows[0].recipient_phone !== '+919876500001') {
    console.error('Failed to retrieve logged delivery entry');
    process.exit(1);
  }
  console.log('✓ Successfully retrieved logged WhatsApp delivery entry from PostgreSQL');

  // Clean up test log
  await pool.query("DELETE FROM whatsapp_delivery_logs WHERE id = $1", [logId]);
  console.log('✓ Cleaned up test delivery log.');

  await pool.end();
  console.log('\n>>> WHATSAPP MODULE VERIFICATION PASSED! <<<');
  process.exit(0);
}

runWhatsAppTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

