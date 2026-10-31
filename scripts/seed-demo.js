/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Load environment variables from .env.local if present
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

async function seedDemo() {
  const dbUrl = process.env.DATABASE_URL || '';
  const allowWipe = process.env.ALLOW_WIPE === 'true';

  // Refuse to run unless DATABASE_URL contains "demo" or ALLOW_WIPE=true
  if (!dbUrl.toLowerCase().includes('demo') && !allowWipe) {
    console.error('❌ Safety Refusal: scripts/seed-demo.js refused to run.');
    console.error('   DATABASE_URL must contain "demo" or ALLOW_WIPE=true must be set in environment.');
    process.exit(1);
  }

  const ownerEmail = process.env.DEMO_OWNER_EMAIL || 'owner@glowstudio.com';
  const ownerPassword = process.env.DEMO_OWNER_PASSWORD || 'GlowStudio@2026!';

  console.log('🌿 Connecting to database for clean demo seeding...');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // 1. Wipe existing transactional & tenant data
    console.log('🧹 Wiping data...');
    await pool.query('DELETE FROM auth_rate_limits');
    await pool.query('DELETE FROM payments');
    await pool.query('DELETE FROM invoices');
    await pool.query('DELETE FROM session_items');
    await pool.query('DELETE FROM sessions');
    await pool.query('DELETE FROM appointments');
    await pool.query('DELETE FROM waiting');
    await pool.query('DELETE FROM staff_services');
    await pool.query('DELETE FROM staff');
    await pool.query('DELETE FROM services');
    await pool.query('DELETE FROM products');
    await pool.query('DELETE FROM customer_plans');
    await pool.query('DELETE FROM customers');
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM salons');

    // 2. Seed ONE clean salon: Glow Studio (Monday-Saturday 10:00-19:00)
    console.log('🏛️ Seeding salon "Glow Studio"...');
    const salonRes = await pool.query(`
      INSERT INTO salons (
        name, slug, phone, address, brand_color,
        open_time, close_time, working_days,
        slot_minutes, buffer_minutes, min_advance_hours, max_advance_days,
        is_active, invoice_counter, created_at
      ) VALUES (
        'Glow Studio', 'glow-studio', '9876500001', '101 Elegance Square, Ring Road, Surat', '#b3135b',
        '10:00:00', '19:00:00', ARRAY[1, 2, 3, 4, 5, 6],
        30, 15, 0, 30,
        true, 2, NOW()
      ) RETURNING id
    `);
    const salonId = salonRes.rows[0].id;

    // 3. Seed Owner User
    console.log(`👤 Seeding owner user: ${ownerEmail}...`);
    const hashedOwnerPassword = bcrypt.hashSync(ownerPassword, 10);
    await pool.query(`
      INSERT INTO users (salon_id, full_name, email, password_hash, role, created_at)
      VALUES ($1, 'Studio Owner', $2, $3, 'owner', NOW())
    `, [salonId, ownerEmail, hashedOwnerPassword]);

    // 4. Seed 5 Services
    console.log('✂️ Seeding 5 services...');
    const servicesData = [
      { name: 'Haircut & Blowdry', category: 'Hair', duration: 30, price: 500 },
      { name: 'Fruit Glow Facial', category: 'Skincare', duration: 45, price: 1200 },
      { name: 'Spa Manicure & Pedicure', category: 'Nails', duration: 60, price: 950 },
      { name: 'Hair Keratin Treatment', category: 'Hair', duration: 90, price: 3500 },
      { name: 'Bridal Makeup Trial', category: 'Makeup', duration: 60, price: 2500 },
    ];
    const serviceIds = [];
    for (const s of servicesData) {
      const sRes = await pool.query(`
        INSERT INTO services (salon_id, name, category, duration_min, price, online_enabled, created_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW()) RETURNING id
      `, [salonId, s.name, s.category, s.duration, s.price]);
      serviceIds.push(sRes.rows[0].id);
    }

    // 5. Seed 3 Staff
    console.log('👥 Seeding 3 staff...');
    const staffData = [
      { name: 'Priya Sharma', role: 'Senior Hair Stylist' },
      { name: 'Rahul Verma', role: 'Hair Specialist' },
      { name: 'Ananya Patel', role: 'Skin & Beauty Therapist' },
    ];
    const staffIds = [];
    for (const st of staffData) {
      const stRes = await pool.query(`
        INSERT INTO staff (salon_id, name, role_title, active, show_online, created_at)
        VALUES ($1, $2, $3, true, true, NOW()) RETURNING id
      `, [salonId, st.name, st.role]);
      staffIds.push(stRes.rows[0].id);
    }

    // Link staff to all services
    for (const staffId of staffIds) {
      for (const serviceId of serviceIds) {
        await pool.query(`
          INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
        `, [staffId, serviceId]);
      }
    }

    // 6. Seed 5 Sample Customers
    console.log('🛍️ Seeding 5 customers...');
    const defaultCustomerPin = bcrypt.hashSync('1234', 10);
    const customersData = [
      { name: 'Aarav Patel', mobile: '9825100001' },
      { name: 'Neha Shah', mobile: '9825100002' },
      { name: 'Rohan Mehta', mobile: '9825100003' },
      { name: 'Pooja Joshi', mobile: '9825100004' },
      { name: 'Vikram Desai', mobile: '9825100005' },
    ];
    const customerIds = [];
    for (const c of customersData) {
      const cRes = await pool.query(`
        INSERT INTO customers (salon_id, name, mobile, pin, created_at)
        VALUES ($1, $2, $3, $4, NOW()) RETURNING id
      `, [salonId, c.name, c.mobile, defaultCustomerPin]);
      customerIds.push(cRes.rows[0].id);
    }

    // 7. Seed Sample Bookings (Appointments)
    console.log('📅 Seeding sample appointments...');
    const now = new Date();
    const appt1Start = new Date(now.getTime() + 24 * 3600 * 1000);
    appt1Start.setHours(11, 0, 0, 0);
    const appt1End = new Date(appt1Start.getTime() + 30 * 60000);

    const appt2Start = new Date(now.getTime() + 24 * 3600 * 1000);
    appt2Start.setHours(14, 30, 0, 0);
    const appt2End = new Date(appt2Start.getTime() + 45 * 60000);

    await pool.query(`
      INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source, note, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', 'online', 'Client requested quiet session', NOW())
    `, [salonId, customerIds[0], staffIds[0], serviceIds[0], appt1Start.toISOString(), appt1End.toISOString()]);

    await pool.query(`
      INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source, note, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', 'online', 'First-time consultation', NOW())
    `, [salonId, customerIds[1], staffIds[1], serviceIds[1], appt2Start.toISOString(), appt2End.toISOString()]);

    // 8. Seed Sample Invoices with receipt tokens & payments
    console.log('🧾 Seeding sample invoices with receipt tokens...');
    const year = new Date().getFullYear();
    const token1 = crypto.randomBytes(16).toString('hex');
    const token2 = crypto.randomBytes(16).toString('hex');

    const inv1Res = await pool.query(`
      INSERT INTO invoices (
        salon_id, customer_id, number, subtotal, tax_amount, total, receipt_token, created_at
      ) VALUES (
        $1, $2, $3, 1200, 216, 1416, $4, NOW()
      ) RETURNING id
    `, [salonId, customerIds[0], `INV-${year}-0001`, token1]);

    await pool.query(`
      INSERT INTO payments (invoice_id, method, amount, reference, created_at)
      VALUES ($1, 'upi', 1416, 'UPI-REF-99881', NOW())
    `, [inv1Res.rows[0].id]);

    const inv2Res = await pool.query(`
      INSERT INTO invoices (
        salon_id, customer_id, number, subtotal, tax_amount, total, receipt_token, created_at
      ) VALUES (
        $1, $2, $3, 950, 171, 1121, $4, NOW()
      ) RETURNING id
    `, [salonId, customerIds[1], `INV-${year}-0002`, token2]);

    await pool.query(`
      INSERT INTO payments (invoice_id, method, amount, reference, created_at)
      VALUES ($1, 'cash', 500, 'Partial cash deposit', NOW())
    `, [inv2Res.rows[0].id]);

    console.log('✨ Demo seeding completed successfully!');
    console.log(`   Salon: Glow Studio (ID: ${salonId})`);
    console.log(`   Owner: ${ownerEmail} / (password configured)`);
    console.log(`   Invoices: INV-${year}-0001 (/b/${token1}) & INV-${year}-0002 (/b/${token2})`);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedDemo().catch((err) => {
    console.error('Fatal error during seedDemo:', err);
    process.exit(1);
  });
}

module.exports = { seedDemo };
