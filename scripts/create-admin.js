/**
 * Interactive Script: Create / Reset Platform Super Admin
 * Usage:
 *   node scripts/create-admin.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DATABASE_URL=')) {
        return trimmed.substring('DATABASE_URL='.length).replace(/^["']|["']$/g, '');
      }
    }
  }

  throw new Error('DATABASE_URL not found in environment or .env.local file.');
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n======================================================');
  console.log('  StudioDesk Platform: Create / Provision Super Admin   ');
  console.log('======================================================\n');

  const dbUrl = getDatabaseUrl();
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query('SELECT 1');
    console.log('Database connected successfully.\n');

    const email = await prompt('Enter Super Admin Email: ');
    if (!email || !email.includes('@')) {
      console.error('Error: A valid email address is required.');
      process.exit(1);
    }

    const name = (await prompt('Enter Full Name (default: Primary Super Admin): ')) || 'Primary Super Admin';

    const password = await prompt('Enter Secure Password (min 8 chars): ');
    if (!password || password.length < 8) {
      console.error('Error: Password must be at least 8 characters long.');
      process.exit(1);
    }

    const confirmPassword = await prompt('Confirm Secure Password: ');
    if (password !== confirmPassword) {
      console.error('Error: Passwords do not match.');
      process.exit(1);
    }

    console.log('\nHashing password with bcrypt (cost factor: 12)...');
    const passwordHash = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO platform_admins (email, password_hash, name, role, is_active, created_at)
      VALUES ($1, $2, $3, 'super_admin', true, NOW())
      ON CONFLICT (email) DO UPDATE
      SET password_hash = $2,
          name = $3,
          is_active = true,
          role = 'super_admin'
      RETURNING id, email, name, role, is_active;
    `;

    const res = await pool.query(query, [email.toLowerCase().trim(), passwordHash, name.trim()]);
    const admin = res.rows[0];

    console.log('\n======================================================');
    console.log('SUCCESS: Super Admin Account Created / Updated!');
    console.log('------------------------------------------------------');
    console.log('  ID:    ', admin.id);
    console.log('  Email: ', admin.email);
    console.log('  Name:  ', admin.name);
    console.log('  Role:  ', admin.role);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Failed to create super admin:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

