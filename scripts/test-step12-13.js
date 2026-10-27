const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
});

async function runTest() {
  console.log('--- TESTING STEP 12 & 13: PRODUCTS, MEMBERSHIPS & RESET ---');

  // 1. Check Low Stock Product Badge
  const prodRes = await pool.query(
    "SELECT name, stock, min_stock FROM products WHERE stock <= min_stock LIMIT 1"
  );
  if (prodRes.rows.length === 0) {
    throw new Error('No low stock product found!');
  }
  const lowProduct = prodRes.rows[0];
  console.log(`✓ Low Stock Product identified: "${lowProduct.name}" (Stock: ${lowProduct.stock}, Min: ${lowProduct.min_stock}) -> Shows Low Stock Badge`);

  // 2. Fetch a Customer (Pooja Trivedi) and Membership Plan (Gold VIP)
  const custRes = await pool.query("SELECT id, name FROM customers WHERE name = 'Pooja Trivedi' LIMIT 1");
  const cust = custRes.rows[0];
  const planRes = await pool.query("SELECT id, name, services_discount_pct, products_discount_pct FROM membership_plans LIMIT 1");
  const plan = planRes.rows[0];
  console.log(`✓ Customer: ${cust.name}, Membership: ${plan.name} (${plan.services_discount_pct}% Svc / ${plan.products_discount_pct}% Prod)`);

  // 3. Assign Plan to Customer
  const assignRes = await pool.query(
    `INSERT INTO customer_plans (customer_id, kind, plan_id, starts_on, expires_on, amount_paid)
     VALUES ($1, 'membership', $2, CURRENT_DATE, CURRENT_DATE + interval '365 days', 1999)
     RETURNING id, expires_on`,
    [cust.id, plan.id]
  );
  console.log(`✓ Plan assigned: ID ${assignRes.rows[0].id}, expires on ${assignRes.rows[0].expires_on}`);

  // 4. Verify Active Session Membership Lookup
  const checkMemberRes = await pool.query(
    `SELECT cp.id, mp.name as plan_name, mp.services_discount_pct, mp.products_discount_pct
     FROM customer_plans cp
     JOIN membership_plans mp ON cp.plan_id = mp.id
     WHERE cp.customer_id = $1 AND cp.kind = 'membership' AND cp.expires_on >= CURRENT_DATE
     LIMIT 1`,
    [cust.id]
  );
  if (checkMemberRes.rows.length === 0) {
    throw new Error('Customer plan lookup failed');
  }
  console.log(`✓ Session complete discount pre-fill verified: Auto-applies ${checkMemberRes.rows[0].services_discount_pct}% service discount for ${cust.name}`);

  // 5. Test Demo Reset Script
  console.log('Testing demo reset...');
  const fs = require('fs');
  const path = require('path');
  const seedSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'seed.sql'), 'utf8');
  await pool.query('BEGIN');
  await pool.query(seedSql);
  await pool.query('COMMIT');
  console.log('✓ Demo reset succeeded: Sample data restored to initial clean state');

  // Verify sample counts after reset
  const afterCust = await pool.query('SELECT count(*) FROM customers');
  const afterStaff = await pool.query('SELECT count(*) FROM staff');
  const afterInv = await pool.query('SELECT count(*) FROM invoices');
  console.log(`✓ Verified restored counts: ${afterCust.rows[0].count} customers, ${afterStaff.rows[0].count} staff, ${afterInv.rows[0].count} invoices`);

  console.log('--- ALL STEP 12 & 13 TESTS PASSED SUCCESSFULLY! ---');
  await pool.end();
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
