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
    console.error('❌ Error: DATABASE_URL is not set in environment or .env.local');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully!\n');

    // 1. Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 2. Fetch already applied migrations
    const appliedRes = await client.query('SELECT version FROM schema_migrations ORDER BY version ASC');
    const appliedSet = new Set(appliedRes.rows.map((r) => r.version));

    // 3. Scan and apply unapplied migrations strictly in order
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        if (appliedSet.has(file)) {
          console.log(`⏩ Migration already applied: ${file}`);
          continue;
        }

        console.log(`📦 Applying new migration: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`   ✓ Migration ${file} applied and recorded.`);
        } catch (migrationErr) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration ${file} failed. Transaction rolled back.`);
          throw migrationErr;
        }
      }
    }

    // 4. Seeding: STRICTLY guarded by --seed flag and blocked in production
    const hasSeedFlag = process.argv.includes('--seed');
    if (hasSeedFlag) {
      if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force-prod-seed')) {
        console.error('❌ Refusing to run seed.sql in PRODUCTION environment! Aborted.');
        process.exit(1);
      }

      const seedFile = path.join(__dirname, '..', 'supabase', 'seed.sql');
      if (fs.existsSync(seedFile)) {
        console.log('\n⚠️ Explicit --seed flag detected. Running seed.sql...');
        const seedSql = fs.readFileSync(seedFile, 'utf8');
        await client.query(seedSql);
        console.log('   ✓ Seed data inserted.');
      }
    } else {
      console.log('\n🔒 Seeding skipped (seed.sql requires explicit --seed flag). Production data is protected.');
    }

    // 5. Output database summary
    console.log('\n📊 Migration Status Summary:');
    const allApplied = await client.query('SELECT version, applied_at FROM schema_migrations ORDER BY version ASC');
    for (const m of allApplied.rows) {
      console.log(`   - ${m.version.padEnd(35)} : applied at ${m.applied_at.toISOString()}`);
    }

    console.log('\n✨ Database migrations completed successfully!');
  } catch (err) {
    console.error('❌ Database migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSetup();
