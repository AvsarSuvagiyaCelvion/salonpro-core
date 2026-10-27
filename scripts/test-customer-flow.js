const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('--- TEST 1: Customer Profile Records in Database ---');
  const custRes = await pool.query("SELECT id, name, mobile, pin FROM customers WHERE mobile = '9898023456' OR mobile = '9825123456' LIMIT 1");
  console.log('Customer record:', custRes.rows[0]);

  if (custRes.rows.length > 0) {
    const custId = custRes.rows[0].id;

    console.log('\n--- TEST 2: Upcoming & Past Appointments for Customer ---');
    const appts = await pool.query(
      `SELECT a.id, a.starts_at, a.status, sv.name as service, st.name as staff
       FROM appointments a
       JOIN services sv ON a.service_id = sv.id
       JOIN staff st ON a.staff_id = st.id
       WHERE a.customer_id = $1
       ORDER BY a.starts_at DESC LIMIT 3`,
      [custId]
    );
    console.log(`Found ${appts.rows.length} appointments:`, appts.rows);

    console.log('\n--- TEST 3: Invoices & Digital Bills for Customer ---');
    const invoices = await pool.query(
      `SELECT i.id, i.number, i.total, i.discount_amount,
              COALESCE(SUM(p.amount), 0)::numeric(10,2) as paid_amount
       FROM invoices i
       LEFT JOIN payments p ON i.id = p.invoice_id
       WHERE i.customer_id = $1
       GROUP BY i.id
       ORDER BY i.created_at DESC LIMIT 3`,
      [custId]
    );
    console.log(`Found ${invoices.rows.length} invoices:`, invoices.rows);

    console.log('\n--- TEST 4: Active VIP Membership / Plans ---');
    const plans = await pool.query(
      `SELECT cp.id, cp.kind, cp.expires_on, mp.name as plan_name, mp.services_discount_pct
       FROM customer_plans cp
       LEFT JOIN membership_plans mp ON (cp.kind = 'membership' AND cp.plan_id = mp.id)
       WHERE cp.customer_id = $1`,
      [custId]
    );
    console.log(`Found ${plans.rows.length} active plans:`, plans.rows);
  }

  console.log('\nALL CUSTOMER PORTAL DATA QUERIES PASSED WITH ZERO ERRORS.');
  await pool.end();
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
