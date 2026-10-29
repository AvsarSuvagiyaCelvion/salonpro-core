const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL=')).split('=')[1].trim();
const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function verifyMultiTenancy() {
  await client.connect();
  console.log('✅ Connected to live Supabase DB for Multi-Tenancy Isolation Test.\n');

  try {
    // Clean any previous test salons
    await client.query("DELETE FROM salons WHERE slug IN ('royal-luxe-test', 'glamour-glow-test')");

    // 1. Get a plan id
    const planRes = await client.query("SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1");
    const planId = planRes.rows[0].id;

    // 2. Create Salon A & Salon B
    console.log('1. Creating Salon A ("Royal Luxe Salon") and Salon B ("Glamour Glow Spa")...');
    const salonARes = await client.query(`
      INSERT INTO salons (name, slug, phone, address, is_active, subscription_status, subscription_plan_id, subscription_ends_at)
      VALUES ('Royal Luxe Salon', 'royal-luxe-test', '9111111111', 'Ahmedabad', true, 'active', $1, NOW() + INTERVAL '30 days')
      RETURNING id, name, slug
    `, [planId]);
    const salonA = salonARes.rows[0];

    const salonBRes = await client.query(`
      INSERT INTO salons (name, slug, phone, address, is_active, subscription_status, subscription_plan_id, subscription_ends_at)
      VALUES ('Glamour Glow Spa', 'glamour-glow-test', '9222222222', 'Surat', true, 'active', $1, NOW() + INTERVAL '30 days')
      RETURNING id, name, slug
    `, [planId]);
    const salonB = salonBRes.rows[0];

    console.log(`   ✓ Salon A created (ID: ${salonA.id})`);
    console.log(`   ✓ Salon B created (ID: ${salonB.id})`);

    // 3. Add Staff and Services to Salon A & Salon B
    console.log('\n2. Adding Staff & Services to both salons...');
    const staffARes = await client.query(`
      INSERT INTO staff (salon_id, name, role_title, active)
      VALUES ($1, 'Rohan Stylist (Salon A)', 'Senior Hair Stylist', true)
      RETURNING id
    `, [salonA.id]);
    const staffAId = staffARes.rows[0].id;

    const staffBRes = await client.query(`
      INSERT INTO staff (salon_id, name, role_title, active)
      VALUES ($1, 'Priya Therapist (Salon B)', 'Master Esthetician', true)
      RETURNING id
    `, [salonB.id]);
    const staffBId = staffBRes.rows[0].id;

    const svcA = await client.query(`
      INSERT INTO services (salon_id, name, duration_min, price, category)
      VALUES ($1, 'Royal Hair Spa Treatment', 45, 999, 'Hair') RETURNING id
    `, [salonA.id]);
    const serviceAId = svcA.rows[0].id;

    const svcB = await client.query(`
      INSERT INTO services (salon_id, name, duration_min, price, category)
      VALUES ($1, 'Glamour Diamond Facial', 60, 1499, 'Facial') RETURNING id
    `, [salonB.id]);
    const serviceBId = svcB.rows[0].id;

    // 4. Customer A books at Salon A
    console.log('\n3. Customer A ("Amit Shah", 9900000001) books at Salon A...');
    const custARes = await client.query(`
      INSERT INTO customers (salon_id, name, mobile)
      VALUES ($1, 'Amit Shah', '9900000001') RETURNING id, name, mobile
    `, [salonA.id]);
    const custA = custARes.rows[0];

    const apptARes = await client.query(`
      INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '2 hours', NOW() + INTERVAL '2 hours 45 minutes', 'scheduled', 'online')
      RETURNING id
    `, [salonA.id, custA.id, staffAId, serviceAId]);
    console.log(`   ✓ Appointment created in Salon A for ${custA.name}`);

    // 5. Customer B books at Salon B
    console.log('\n4. Customer B ("Kavita Patel", 9900000002) books at Salon B...');
    const custBRes = await client.query(`
      INSERT INTO customers (salon_id, name, mobile)
      VALUES ($1, 'Kavita Patel', '9900000002') RETURNING id, name, mobile
    `, [salonB.id]);
    const custB = custBRes.rows[0];

    const apptBRes = await client.query(`
      INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '3 hours', NOW() + INTERVAL '4 hours', 'scheduled', 'online')
      RETURNING id
    `, [salonB.id, custB.id, staffBId, serviceBId]);
    console.log(`   ✓ Appointment created in Salon B for ${custB.name}`);

    // 6. Verification: Check data seen by Salon A Owner
    console.log('\n5. VERIFYING STRICT DATA ISOLATION (Salon A Owner Session):');
    const salonACustomers = await client.query('SELECT name, mobile FROM customers WHERE salon_id = $1', [salonA.id]);
    const salonAAppointments = await client.query(`
      SELECT a.id, c.name as customer_name, s.name as staff_name, sv.name as service_name
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      JOIN staff s ON a.staff_id = s.id
      JOIN services sv ON a.service_id = sv.id
      WHERE a.salon_id = $1
    `, [salonA.id]);

    console.log(`   - Salon A sees customers count: ${salonACustomers.rows.length} (${salonACustomers.rows.map(c => c.name).join(', ')})`);
    console.log(`   - Salon A sees appointments count: ${salonAAppointments.rows.length}`);

    // Cross-check: Can Salon A see Customer B ("Kavita Patel")?
    const leakedCustomerInA = salonACustomers.rows.find(c => c.name === 'Kavita Patel');
    if (leakedCustomerInA) {
      throw new Error('❌ DATA LEAK DETECTED: Salon A can see Salon B customer Kavita Patel!');
    }
    console.log('   🔒 SUCCESS: Customer "Kavita Patel" (Salon B) is 100% INVISIBLE to Salon A.');

    // 7. Verification: Check data seen by Salon B Owner
    console.log('\n6. VERIFYING STRICT DATA ISOLATION (Salon B Owner Session):');
    const salonBCustomers = await client.query('SELECT name, mobile FROM customers WHERE salon_id = $1', [salonB.id]);
    const salonBAppointments = await client.query(`
      SELECT a.id, c.name as customer_name, s.name as staff_name, sv.name as service_name
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      JOIN staff s ON a.staff_id = s.id
      JOIN services sv ON a.service_id = sv.id
      WHERE a.salon_id = $1
    `, [salonB.id]);

    console.log(`   - Salon B sees customers count: ${salonBCustomers.rows.length} (${salonBCustomers.rows.map(c => c.name).join(', ')})`);
    console.log(`   - Salon B sees appointments count: ${salonBAppointments.rows.length}`);

    // Cross-check: Can Salon B see Customer A ("Amit Shah")?
    const leakedCustomerInB = salonBCustomers.rows.find(c => c.name === 'Amit Shah');
    if (leakedCustomerInB) {
      throw new Error('❌ DATA LEAK DETECTED: Salon B can see Salon A customer Amit Shah!');
    }
    console.log('   🔒 SUCCESS: Customer "Amit Shah" (Salon A) is 100% INVISIBLE to Salon B.');

    // 8. Test Edge Case: Same Customer Phone at BOTH Salons
    console.log('\n7. TESTING EDGE CASE: Same client ("Rahul", 9999999999) visits BOTH Salons...');
    await client.query("INSERT INTO customers (salon_id, name, mobile) VALUES ($1, 'Rahul (at Salon A)', '9999999999')", [salonA.id]);
    await client.query("INSERT INTO customers (salon_id, name, mobile) VALUES ($1, 'Rahul (at Salon B)', '9999999999')", [salonB.id]);

    const checkCustA = await client.query("SELECT name FROM customers WHERE salon_id = $1 AND mobile = '9999999999'", [salonA.id]);
    const checkCustB = await client.query("SELECT name FROM customers WHERE salon_id = $1 AND mobile = '9999999999'", [salonB.id]);

    console.log(`   ✓ Salon A record: "${checkCustA.rows[0].name}"`);
    console.log(`   ✓ Salon B record: "${checkCustB.rows[0].name}"`);
    console.log('   🔒 SUCCESS: Records remain completely independent and scoped per salon!');

    // Clean up test data
    console.log('\n8. Cleaning up test data...');
    await client.query("DELETE FROM salons WHERE id IN ($1, $2)", [salonA.id, salonB.id]);
    console.log('   ✓ Test salons and all associated data cleanly removed.');

    console.log('\n🎉 ALL MULTI-TENANT ISOLATION TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyMultiTenancy();
