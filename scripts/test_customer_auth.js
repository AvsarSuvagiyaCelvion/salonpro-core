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

async function testCustomerSignup() {
  try {
    console.log('Testing customer signup logic...');
    const cleanMobile = '9876543210';
    const cleanPin = '1234';
    const cleanName = 'Test User';
    const email = 'testuser@gmail.com';

    // 1. Find salon
    const sRes = await pool.query('SELECT id, slug, name FROM salons WHERE is_active = true LIMIT 1');
    console.log('Found active salon:', sRes.rows[0]);
    const salonId = sRes.rows[0].id;

    // 2. Check existing
    console.log('Checking existing customer...');
    const existing = await pool.query(
      `SELECT id, name, mobile, email, pin, salon_id 
       FROM customers 
       WHERE mobile = $1 
       ORDER BY (CASE WHEN salon_id = $2::uuid THEN 0 ELSE 1 END), created_at ASC 
       LIMIT 1`,
      [cleanMobile, salonId]
    );
    console.log('Existing:', existing.rows);

    // 3. Hash pin
    console.log('Hashing PIN...');
    const hashedPin = await bcrypt.hash(cleanPin, 10);

    // 4. Insert
    console.log('Inserting customer...');
    const created = await pool.query(
      `INSERT INTO customers (salon_id, name, mobile, email, pin, last_login_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, name, mobile, email, salon_id`,
      [salonId, cleanName, cleanMobile, email, hashedPin]
    );
    console.log('Customer created successfully:', created.rows[0]);

    // Cleanup
    await pool.query('DELETE FROM customers WHERE id = $1', [created.rows[0].id]);
    console.log('Cleaned up test customer.');
  } catch (err) {
    console.error('Error during customer signup:', err);
  } finally {
    await pool.end();
  }
}

testCustomerSignup();
