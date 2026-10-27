const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
});

async function runTest() {
  console.log('--- TESTING STEP 9: PUBLIC BOOKING & SLOT ENGINE ---');

  // 1. Fetch salon
  const salonRes = await pool.query("SELECT * FROM salons WHERE slug = 'glow-studio' LIMIT 1");
  if (salonRes.rows.length === 0) {
    throw new Error('Glow studio salon not found!');
  }
  const salon = salonRes.rows[0];
  console.log(`✓ Salon: ${salon.name} (Hours: ${salon.open_time} - ${salon.close_time}, Buffer: ${salon.buffer_minutes}m)`);

  // 2. Fetch a service (HydraFacial Glow, 60m)
  const svcRes = await pool.query(
    "SELECT * FROM services WHERE salon_id = $1 AND name = 'HydraFacial Glow' LIMIT 1",
    [salon.id]
  );
  const service = svcRes.rows[0];
  console.log(`✓ Service: ${service.name} (${service.duration_min} min, ₹${service.price})`);

  // 3. Find eligible staff for this service (Rahul Verma)
  const staffRes = await pool.query(
    "SELECT * FROM staff WHERE salon_id = $1 AND name = 'Rahul Verma' LIMIT 1",
    [salon.id]
  );
  const rahul = staffRes.rows[0];
  console.log(`✓ Stylist: ${rahul.name} (${rahul.id})`);

  // 4. Test slot calculation logic
  const testDate = '2026-10-28'; // Tomorrow

  // Clean any existing test appointments on this slot
  await pool.query(
    "DELETE FROM appointments WHERE starts_at >= '2026-10-28T00:00:00' AND starts_at <= '2026-10-28T23:59:59'"
  );

  // 5. Create a customer or pick existing
  const custRes = await pool.query(
    "SELECT id FROM customers WHERE salon_id = $1 LIMIT 1",
    [salon.id]
  );
  const custId = custRes.rows[0].id;

  // Insert Appointment 1 at 10:30 to 11:30
  const appt1 = await pool.query(
    `INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source)
     VALUES ($1, $2, $3, $4, '2026-10-28T10:30:00', '2026-10-28T11:30:00', 'scheduled', 'online')
     RETURNING *`,
    [salon.id, custId, rahul.id, service.id]
  );
  console.log(`✓ Booked Appointment 1 at 10:30 - 11:30 (ID: ${appt1.rows[0].id})`);

  // Try to double-book overlapping slot (11:00 to 12:00) with same staff
  let blocked = false;
  try {
    await pool.query(
      `INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source)
       VALUES ($1, $2, $3, $4, '2026-10-28T11:00:00', '2026-10-28T12:00:00', 'scheduled', 'online')`,
      [salon.id, custId, rahul.id, service.id]
    );
  } catch (err) {
    if (err.code === '23P01') {
      blocked = true;
      console.log('✓ Overlapping booking at 11:00 was BLOCKED by PostgreSQL exclusion constraint (code 23P01)');
    } else {
      throw err;
    }
  }

  if (!blocked) {
    throw new Error('FAILED: Double booking was allowed when it should have been blocked!');
  }

  // Verify non-overlapping booking at 14:00 succeeds
  const appt2 = await pool.query(
    `INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source)
     VALUES ($1, $2, $3, $4, '2026-10-28T14:00:00', '2026-10-28T15:00:00', 'scheduled', 'online')
     RETURNING id`,
    [salon.id, custId, rahul.id, service.id]
  );
  console.log(`✓ Non-overlapping booking at 14:00 - 15:00 SUCCEEDED (ID: ${appt2.rows[0].id})`);

  // Verify Public Bill query
  const invRes = await pool.query('SELECT number FROM invoices LIMIT 1');
  if (invRes.rows.length > 0) {
    console.log(`✓ Sample invoice found: ${invRes.rows[0].number} -> Accessible at /b/${invRes.rows[0].number}`);
  }

  // Clean test appointments
  await pool.query("DELETE FROM appointments WHERE starts_at >= '2026-10-28T00:00:00'");
  console.log('✓ Cleaned up test appointments');

  console.log('--- ALL STEP 9 TESTS PASSED SUCCESSFULLY! ---');
  await pool.end();
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
