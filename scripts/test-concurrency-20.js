const fs = require('fs');
const { Pool } = require('pg');

const envContent = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) dbUrl = line.split('=')[1].trim();
}

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function runConcurrencyTest() {
  console.log('--- STARTING 20 PARALLEL BOOKING REQUESTS CONCURRENCY TEST ---');

  const salon = (await pool.query("SELECT * FROM salons WHERE slug = 'pari-beauty-studio-branch-1'")).rows[0];
  const staff = (await pool.query("SELECT * FROM staff WHERE salon_id = $1 AND active = true LIMIT 1", [salon.id])).rows[0];
  const service = (await pool.query("SELECT * FROM services WHERE salon_id = $1 LIMIT 1", [salon.id])).rows[0];

  const testDate = '2026-11-20';
  const testTime = '11:00';

  await pool.query(
    "DELETE FROM appointments WHERE salon_id = $1 AND staff_id = $2 AND starts_at = $3::timestamptz",
    [salon.id, staff.id, `${testDate}T${testTime}:00+05:30`]
  );

  console.log(`Target Salon: "${salon.name}", Staff: "${staff.name}", Date: ${testDate}, Time: ${testTime}`);
  console.log('Sending 20 SIMULTANEOUS HTTP requests to booking endpoint...');

  const baseUrl = process.env.TEST_APP_URL || 'http://127.0.0.1:3000';
  const endpoint = `${baseUrl}/api/public/${salon.slug}/book`;

  const requests = [];
  for (let i = 1; i <= 20; i++) {
    const payload = {
      service_id: service.id,
      staff_id: staff.id,
      date: testDate,
      time: testTime,
      name: `Parallel Tester ${i}`,
      mobile: `99990000${i.toString().padStart(2, '0')}`,
      code: '1234',
      note: `Concurrent request #${i}`,
    };

    requests.push(
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        const body = await res.json().catch(() => ({}));
        return {
          index: i,
          status: res.status,
          body,
        };
      }).catch((err) => ({
        index: i,
        status: 0,
        error: err.message,
      }))
    );
  }

  const results = await Promise.all(requests);

  const successes = results.filter((r) => r.status === 200);
  const conflicts = results.filter((r) => r.status === 409);
  const others = results.filter((r) => r.status !== 200 && r.status !== 409);

  console.log('\n--- RESULTS SUMMARY ---');
  console.log(`Total Requests: 20`);
  console.log(`Success (200): ${successes.length}`);
  console.log(`Conflict (409): ${conflicts.length}`);
  console.log(`Other/Errors: ${others.length}`);

  if (others.length > 0) {
    console.log('Sample Other/Error details:', JSON.stringify(others.slice(0, 3), null, 2));
  }

  if (conflicts.length > 0) {
    console.log('Sample 409 Error Body:', conflicts[0].body);
  }

  const dbAppts = await pool.query(
    "SELECT id, starts_at, customer_id, note FROM appointments WHERE salon_id = $1 AND staff_id = $2 AND starts_at = $3::timestamptz",
    [salon.id, staff.id, `${testDate}T${testTime}:00+05:30`]
  );

  console.log(`PostgreSQL Appointments Count for Slot: ${dbAppts.rows.length}`);

  if (dbAppts.rows.length > 0) {
    await pool.query("DELETE FROM appointments WHERE id = ANY($1::uuid[])", [dbAppts.rows.map(a => a.id)]);
    console.log('Cleaned up test appointments from DB.');
  }
  await pool.query("DELETE FROM customers WHERE mobile LIKE '99990000%'");
  console.log('Cleaned up test customers from DB.');

  await pool.end();

  if (successes.length === 1 && conflicts.length === 19 && dbAppts.rows.length === 1) {
    console.log('\n>>> VERIFICATION PASSED: Exactly 1 request succeeded (200), exactly 19 rejected with 409 conflict, and exactly 1 row in DB! <<<');
    process.exit(0);
  } else {
    console.error('\n>>> VERIFICATION FAILED: Did not meet exact 1 success / 19 conflict requirement! <<<');
    process.exit(1);
  }
}

runConcurrencyTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
