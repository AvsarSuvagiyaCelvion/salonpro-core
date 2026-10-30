const fs = require('fs');
const { Pool } = require('pg');

const envContent = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) dbUrl = line.split('=')[1].trim();
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function inspectDB() {
  console.log('=== SALONS ===');
  const salons = await pool.query('SELECT id, name, slug, phone, is_active FROM salons');
  console.log(salons.rows);

  console.log('=== USERS ===');
  const users = await pool.query('SELECT id, email, full_name, role FROM users');
  console.log(users.rows);

  console.log('=== PLATFORM ADMINS ===');
  const admins = await pool.query('SELECT id, email, role FROM platform_admins');
  console.log(admins.rows);

  console.log('=== APPOINTMENTS TODAY ===');
  const todayAppts = await pool.query(
    "SELECT id, salon_id, staff_id, starts_at, ends_at, status FROM appointments ORDER BY starts_at DESC LIMIT 10"
  );
  console.log(todayAppts.rows);

  console.log('=== CUSTOMERS BY SALON ===');
  const custs = await pool.query(`
    SELECT s.name as salon_name, COUNT(c.id) as total_customers
    FROM salons s
    LEFT JOIN customers c ON s.id = c.salon_id
    GROUP BY s.name
  `);
  console.log(custs.rows);

  await pool.end();
}

inspectDB();
