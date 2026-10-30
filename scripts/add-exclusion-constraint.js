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

async function addExclusionConstraint() {
  try {
    // Check if constraint exists
    const check = await pool.query(`
      SELECT conname FROM pg_constraint WHERE conname = 'exclude_overlapping_appointments'
    `);
    if (check.rows.length === 0) {
      await pool.query(`
        ALTER TABLE appointments 
        ADD CONSTRAINT exclude_overlapping_appointments 
        EXCLUDE USING gist (
          salon_id WITH =, 
          staff_id WITH =, 
          tstzrange(starts_at, ends_at) WITH &&
        ) 
        WHERE (status IN ('scheduled', 'arrived'))
      `);
      console.log('✓ Full range EXCLUSION constraint exclude_overlapping_appointments created in PostgreSQL!');
    } else {
      console.log('✓ Exclusion constraint already exists.');
    }
  } catch (err) {
    console.error('Constraint error:', err.message);
  } finally {
    await pool.end();
  }
}

addExclusionConstraint();

