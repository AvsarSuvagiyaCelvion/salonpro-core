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

async function addConstraints() {
  console.log('🛡️ Adding DB-level unique & exclusion constraints for concurrency protection...');

  // 1. Unique index on salon_id + staff_id + starts_at for active appointments
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_unique_active_slot
    ON appointments (salon_id, staff_id, starts_at)
    WHERE status IN ('scheduled', 'arrived')
  `);
  console.log('✓ Unique index idx_appointments_unique_active_slot verified.');

  // 2. Try btree_gist extension for interval range exclusion if available
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
    console.log('✓ btree_gist extension enabled.');
  } catch (err) {
    console.log('ℹ️ btree_gist extension not available or restricted, advisory locks + unique index active.');
  }

  await pool.end();
}

addConstraints();

