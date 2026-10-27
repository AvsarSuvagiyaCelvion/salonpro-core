const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('1. Creating platform_admins table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS platform_admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'Super Admin',
      role TEXT NOT NULL DEFAULT 'super_admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  console.log('2. Inserting exclusive Super Admin (Adminsalonpro@gmail.com)...');
  await pool.query(`DELETE FROM platform_admins;`);
  await pool.query(`
    INSERT INTO platform_admins (email, password, name, role)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO UPDATE SET password = $2;
  `, ['adminsalonpro@gmail.com', 'Admin@123', 'Avsar Suvagiya', 'super_admin']);

  console.log('3. Permanently wiping all fake transactions, invoices, appointments, sessions & customers...');
  await pool.query(`DELETE FROM payments;`);
  await pool.query(`DELETE FROM invoices;`);
  await pool.query(`DELETE FROM session_items;`);
  await pool.query(`DELETE FROM sessions;`);
  await pool.query(`DELETE FROM appointments;`);
  await pool.query(`DELETE FROM customer_plans;`);
  await pool.query(`DELETE FROM customers;`);

  console.log('4. Verifying clean state...');
  const apptsCount = await pool.query('SELECT count(*) FROM appointments;');
  const invCount = await pool.query('SELECT count(*) FROM invoices;');
  const custCount = await pool.query('SELECT count(*) FROM customers;');
  const adminRes = await pool.query('SELECT email, role, created_at FROM platform_admins;');

  console.log('Appointments Count:', apptsCount.rows[0].count);
  console.log('Invoices Count:', invCount.rows[0].count);
  console.log('Customers Count:', custCount.rows[0].count);
  console.log('Registered Admin:', adminRes.rows);

  await pool.end();
  console.log('ALL FAKE DATA REMOVED PERMANENTLY. SINGLE ADMIN CREATED.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
