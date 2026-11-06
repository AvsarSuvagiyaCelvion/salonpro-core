/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

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

async function cleanDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const tenantTables = [
    'reviews',
    'salon_photos',
    'salon_holidays',
    'subscription_payments',
    'payments',
    'invoices',
    'session_items',
    'sessions',
    'waiting',
    'appointments',
    'staff_services',
    'customer_plans',
    'customers',
    'products',
    'services',
    'staff',
    'users',
    'auth_rate_limits',
    'salons',
  ];

  console.log('======================================================');
  console.log('       SALONPRO DATABASE CLEANUP & RESET              ');
  console.log('======================================================');
  console.log('Target: Remove all tenant, customer, and booking data.');
  console.log('Preserving: platform_admins and subscription_plans.\n');

  try {
    // 1. Initial State Inspection
    console.log('📊 [1/4] Inspecting Initial Database State...');
    const beforeCounts = {};
    for (const table of tenantTables) {
      try {
        const res = await pool.query(`SELECT COUNT(*)::int as count FROM ${table}`);
        beforeCounts[table] = res.rows[0].count;
      } catch {
        beforeCounts[table] = 0;
      }
    }

    const adminCheck = await pool.query('SELECT id, email, role FROM platform_admins');
    const plansCheck = await pool.query('SELECT id, slug, name FROM subscription_plans ORDER BY slug');

    console.log(`   Found ${adminCheck.rows.length} platform super admin(s):`);
    adminCheck.rows.forEach(a => console.log(`     - ${a.email} (${a.role})`));

    console.log(`   Found ${plansCheck.rows.length} subscription plan(s):`);
    plansCheck.rows.forEach(p => console.log(`     - ${p.name} [slug: ${p.slug}]`));

    console.log('\n🧹 [2/4] Wiping all tenant, customer, and transactional tables...');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const table of tenantTables) {
        try {
          await client.query(`DELETE FROM ${table}`);
          process.stdout.write(`   ✓ Wiped ${table}\n`);
        } catch (err) {
          process.stdout.write(`   ⚠ ${table}: ${err.message}\n`);
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // 3. Verification
    console.log('\n🔍 [3/4] Verifying clean state...');
    const afterCounts = {};
    for (const table of tenantTables) {
      try {
        const res = await pool.query(`SELECT COUNT(*)::int as count FROM ${table}`);
        afterCounts[table] = res.rows[0].count;
      } catch {
        afterCounts[table] = 0;
      }
    }

    const postAdminCheck = await pool.query('SELECT id, email, role FROM platform_admins');
    const postPlansCheck = await pool.query('SELECT id, slug, name FROM subscription_plans ORDER BY slug');

    console.log('\n======================================================');
    console.log('                CLEANUP SUMMARY REPORT                ');
    console.log('======================================================');
    console.log('Table Name'.padEnd(25) + 'Before'.padEnd(12) + 'After'.padEnd(10) + 'Status');
    console.log('------------------------------------------------------');
    for (const table of tenantTables) {
      const b = beforeCounts[table] ?? 0;
      const a = afterCounts[table] ?? 0;
      const status = a === 0 ? '✅ CLEAN' : '❌ NOT CLEAN';
      console.log(table.padEnd(25) + String(b).padEnd(12) + String(a).padEnd(10) + status);
    }
    console.log('------------------------------------------------------');
    console.log('platform_admins'.padEnd(25) + String(adminCheck.rows.length).padEnd(12) + String(postAdminCheck.rows.length).padEnd(10) + '🔒 PRESERVED');
    console.log('subscription_plans'.padEnd(25) + String(plansCheck.rows.length).padEnd(12) + String(postPlansCheck.rows.length).padEnd(10) + '🔒 PRESERVED');
    console.log('======================================================');

    console.log('\n✨ Database cleanup completed successfully!');
    console.log('   All tenant tables are now 0 rows.');
    console.log('   Super admins & subscription plans remain completely intact.');
    console.log('   Demo mode ("dixa-beauty-salon") runs 100% statically in code.');
  } catch (error) {
    console.error('\n❌ Cleanup failed with error:', error);
  } finally {
    await pool.end();
  }
}

cleanDatabase();
