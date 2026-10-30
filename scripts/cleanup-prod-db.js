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

async function cleanup() {
  console.log('🧹 Cleaning up test/demo entities from database...');

  const testSalons = await pool.query(
    "SELECT id FROM salons WHERE slug IN ('aura-glamour-studio', 'velvet-luxe-spa')"
  );
  const testSalonIds = testSalons.rows.map(r => r.id);

  if (testSalonIds.length > 0) {
    await pool.query('DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE salon_id = ANY($1))', [testSalonIds]);
    await pool.query('DELETE FROM invoices WHERE salon_id = ANY($1)', [testSalonIds]);
    await pool.query('DELETE FROM session_items WHERE session_id IN (SELECT id FROM sessions WHERE salon_id = ANY($1))', [testSalonIds]);
    await pool.query('DELETE FROM sessions WHERE salon_id = ANY($1)', [testSalonIds]);
    await pool.query('DELETE FROM appointments WHERE salon_id = ANY($1)', [testSalonIds]);
    await pool.query('DELETE FROM waiting WHERE salon_id = ANY($1)', [testSalonIds]);
    await pool.query('DELETE FROM staff_services WHERE staff_id IN (SELECT id FROM staff WHERE salon_id = ANY($1))', [testSalonIds]);
    await pool.query('DELETE FROM staff WHERE salon_id = ANY($1)', [testSalonIds]);
    await pool.query('DELETE FROM services WHERE salon_id = ANY($1)', [testSalonIds]);
    await pool.query('DELETE FROM products WHERE salon_id = ANY($1)', [testSalonIds]);
    await pool.query('DELETE FROM customer_plans WHERE customer_id IN (SELECT id FROM customers WHERE salon_id = ANY($1))', [testSalonIds]);
    await pool.query('DELETE FROM customers WHERE salon_id = ANY($1)', [testSalonIds]);
    await pool.query('DELETE FROM users WHERE salon_id = ANY($1)', [testSalonIds]);
    await pool.query('DELETE FROM salons WHERE id = ANY($1)', [testSalonIds]);
  }

  // Delete test users and admin if any remain
  await pool.query("DELETE FROM users WHERE email IN ('owner.aura@auraglamour.in', 'owner.velvet@velvetluxe.in')");
  await pool.query("DELETE FROM platform_admins WHERE email = 'superadmin@platform.salonpro.in'");
  await pool.query("DELETE FROM customers WHERE mobile IN ('9825100001', '9825100002', '9825100003', '9825100004', '9825100005')");
  await pool.query("UPDATE services SET description = 'Professional haircut and styling blowdry' WHERE description ILIKE '%demo%'");

  console.log('✅ Cleanup completed successfully.');

  // Verify remaining salons
  const remainingSalons = await pool.query('SELECT name, slug FROM salons');
  console.log('Remaining Salons:', remainingSalons.rows);

  const remainingUsers = await pool.query('SELECT email, full_name, role FROM users');
  console.log('Remaining Users:', remainingUsers.rows);

  const remainingAdmins = await pool.query('SELECT email, role FROM platform_admins');
  console.log('Remaining Platform Admins:', remainingAdmins.rows);

  await pool.end();
}

cleanup();
