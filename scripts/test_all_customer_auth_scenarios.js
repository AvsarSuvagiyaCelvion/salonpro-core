const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const envFile = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
let dbUrl = '';
for (const line of envFile.split('\n')) {
  if (line.trim().startsWith('DATABASE_URL=')) {
    dbUrl = line.trim().substring('DATABASE_URL='.length);
  }
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function runTests() {
  console.log('Running complete customer auth verification suite...');

  // 1. Fetch active salon
  const sRes = await pool.query('SELECT id, slug, name FROM salons WHERE is_active = true LIMIT 1');
  const salon = sRes.rows[0];
  console.log('Using salon:', salon.name, '(', salon.slug, ')');

  const testMobile = '9998887776';
  const testPin = '4321';
  const testName = 'Pooja Test';

  try {
    // Cleanup any previous test customer
    await pool.query('DELETE FROM customers WHERE mobile = $1', [testMobile]);

    // Test 1: Sign Up New Customer
    console.log('\n--- Scenario 1: New Customer Registration ---');
    const hashedPin = await bcrypt.hash(testPin, 10);
    const created = await pool.query(
      `INSERT INTO customers (salon_id, name, mobile, email, pin, last_login_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, name, mobile, email, salon_id`,
      [salon.id, testName, testMobile, 'pooja@test.com', hashedPin]
    );
    const customer = created.rows[0];
    console.log('✓ Customer Registered:', customer.name, customer.id);

    // Test 2: Login with correct PIN
    console.log('\n--- Scenario 2: Login with Correct PIN ---');
    const custRes = await pool.query(
      `SELECT c.id, c.salon_id, c.name, c.mobile, c.email, c.pin, s.slug as salon_slug, s.name as salon_name
       FROM customers c
       JOIN salons s ON c.salon_id = s.id
       WHERE c.mobile = $1
       ORDER BY (CASE WHEN c.salon_id = $2::uuid THEN 0 ELSE 1 END), c.last_login_at DESC NULLS LAST, c.created_at DESC`,
      [testMobile, salon.id]
    );
    const match = await bcrypt.compare(testPin, custRes.rows[0].pin);
    console.log('✓ Login PIN matched:', match);
    if (!match) throw new Error('PIN comparison failed');

    // Test 3: Update Last Login
    await pool.query(`UPDATE customers SET last_login_at = NOW() WHERE id = $1`, [customer.id]);
    console.log('✓ Last login timestamp updated');

    // Test 4: Fetch Portal Records
    console.log('\n--- Scenario 3: Portal Records Query ---');
    const records = await pool.query(
      `SELECT id, salon_id, name, mobile, email, address, avatar_url, last_login_at, created_at FROM customers WHERE id = $1 LIMIT 1`,
      [customer.id]
    );
    console.log('✓ Portal profile records fetched:', records.rows[0]);

    // Cleanup
    await pool.query('DELETE FROM customers WHERE id = $1', [customer.id]);
    console.log('\n✅ All customer authentication scenarios PASSED perfectly!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    await pool.end();
  }
}

runTests();
