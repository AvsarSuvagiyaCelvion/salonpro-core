/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

async function checkAndTest() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await c.connect();

  try {
    // 1. Check constraints on appointments
    const constrRes = await c.query(`
      SELECT conname, pg_get_constraintdef(oid) as def 
      FROM pg_constraint 
      WHERE conrelid = 'appointments'::regclass
    `);
    console.log('Current constraints on appointments:');
    for (const row of constrRes.rows) {
      console.log(` - ${row.conname}: ${row.def}`);
    }

    // 2. Fetch staff, customer, service
    const staffRes = await c.query('SELECT id, salon_id FROM staff LIMIT 1');
    const custRes = await c.query('SELECT id FROM customers LIMIT 1');
    const srvRes = await c.query('SELECT id FROM services LIMIT 1');

    const staffId = staffRes.rows[0].id;
    const salonId = staffRes.rows[0].salon_id;
    const custId = custRes.rows[0].id;
    const srvId = srvRes.rows[0].id;

    console.log('\n--- Overlap Exclusion Test ---');
    console.log('1. Booking appointment 1: 2026-11-10 10:00 - 11:00 for staff ' + staffId);
    await c.query(
      `INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status) 
       VALUES ($1, $2, $3, $4, '2026-11-10 10:00:00+00', '2026-11-10 11:00:00+00', 'scheduled')`,
      [salonId, custId, staffId, srvId]
    );
    console.log('   ✓ Appointment 1 created successfully.');

    console.log('2. Attempting overlapping appointment: 2026-11-10 10:30 - 11:30 for SAME staff...');
    try {
      await c.query(
        `INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status) 
         VALUES ($1, $2, $3, $4, '2026-11-10 10:30:00+00', '2026-11-10 11:30:00+00', 'scheduled')`,
        [salonId, custId, staffId, srvId]
      );
      console.log('   ❌ FAILED: Overlap was allowed!');
    } catch (err) {
      console.log('   ✅ PASSED: Database rejected overlapping appointment with error:');
      console.log('   ' + err.message);
    }
  } finally {
    await c.query("DELETE FROM appointments WHERE starts_at >= '2026-11-10'");
    await c.end();
  }
}

checkAndTest().catch(console.error);
