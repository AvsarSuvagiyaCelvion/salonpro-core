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

async function run() {
  const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log('Tables:', r.rows.map(x => x.table_name));
  await pool.end();
}
run();

