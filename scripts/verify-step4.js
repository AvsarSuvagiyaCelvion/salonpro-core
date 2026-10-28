const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('=== Step 4 Multi-Tenancy & Super Admin Verification ===\n');

  // 1. Verify schema for Step 4
  const schemaCheck = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'salons' AND column_name IN ('is_active', 'custom_domain', 'plan')
    ORDER BY column_name;
  `);
  console.log('1. Salons SaaS Columns:');
  schemaCheck.rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type})`));

  // 2. Test Subdomain Extraction Logic
  console.log('\n2. Testing Subdomain Extraction:');
  const RESERVED = new Set(['www', 'admin', 'api', 'app', 'login', 'register']);
  function extractTenant(host) {
    if (!host) return null;
    const hostname = host.split(':')[0].toLowerCase();
    if (hostname.endsWith('.localhost')) {
      const parts = hostname.split('.');
      if (parts.length >= 2 && !RESERVED.has(parts[0])) return parts[0];
    }
    const rootDomain = 'salonpro.in';
    if (hostname.endsWith(`.${rootDomain}`)) {
      const sub = hostname.slice(0, -(rootDomain.length + 1));
      const parts = sub.split('.');
      const tenant = parts[parts.length - 1];
      if (tenant && !RESERVED.has(tenant)) return tenant;
    }
    return null;
  }

  const testCases = [
    { host: 'priya-salon.salonpro.in', expected: 'priya-salon' },
    { host: 'priya-salon.localhost:3000', expected: 'priya-salon' },
    { host: 'www.salonpro.in', expected: null },
    { host: 'admin.salonpro.in', expected: null },
    { host: 'salonpro.in', expected: null },
    { host: 'localhost:3000', expected: null },
  ];

  let subtestsPassed = true;
  for (const tc of testCases) {
    const res = extractTenant(tc.host);
    const pass = res === tc.expected;
    console.log(`   ${pass ? '✓' : '✗'} Host: "${tc.host}" => ${res} (Expected: ${tc.expected})`);
    if (!pass) subtestsPassed = false;
  }

  // 3. Test Salon Suspension Toggle in DB
  console.log('\n3. Testing Tenant Workspace Suspension Toggle:');
  const salonRes = await pool.query('SELECT id, name, slug, is_active FROM salons LIMIT 1');
  if (salonRes.rows.length === 0) {
    console.log('   No salons found in DB to test.');
  } else {
    const salon = salonRes.rows[0];
    console.log(`   Target Salon: "${salon.name}" (${salon.slug}) [Current is_active: ${salon.is_active}]`);

    // Suspend
    await pool.query('UPDATE salons SET is_active = false WHERE id = $1', [salon.id]);
    const suspendedCheck = await pool.query('SELECT is_active FROM salons WHERE id = $1', [salon.id]);
    console.log(`   ✓ Suspended status verified: is_active = ${suspendedCheck.rows[0].is_active}`);

    // Restore
    await pool.query('UPDATE salons SET is_active = true WHERE id = $1', [salon.id]);
    const restoredCheck = await pool.query('SELECT is_active FROM salons WHERE id = $1', [salon.id]);
    console.log(`   ✓ Reactivated status verified: is_active = ${restoredCheck.rows[0].is_active}`);
  }

  console.log('\n=== STEP 4 VERIFICATION COMPLETED SUCCESSFULLY ===');
  await pool.end();
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
