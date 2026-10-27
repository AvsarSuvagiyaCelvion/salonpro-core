/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Simple .env.local loader if not preloaded
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

async function runSetup() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  console.log('🔗 Connecting to Supabase database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully!\n');

    // 1. Run migrations in order
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        console.log(`📦 Running migration: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        console.log(`   ✓ Migration ${file} applied.`);
      }
    }

    // 2. Run seed.sql
    const seedFile = path.join(__dirname, '..', 'supabase', 'seed.sql');
    if (fs.existsSync(seedFile)) {
      console.log('\n🌱 Seeding sample data (seed.sql)...');
      const seedSql = fs.readFileSync(seedFile, 'utf8');
      await client.query(seedSql);
      console.log('   ✓ Seed data inserted successfully!');
    }

    // 3. Output database summary
    console.log('\n📊 Database Summary:');
    const tables = [
      'salons',
      'staff',
      'services',
      'products',
      'customers',
      'appointments',
      'invoices',
      'payments',
      'membership_plans',
      'package_plans',
    ];

    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   - ${table.padEnd(18)} : ${res.rows[0].count} rows`);
    }

    console.log('\n✨ Database setup & seeding completed successfully!');
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSetup();
