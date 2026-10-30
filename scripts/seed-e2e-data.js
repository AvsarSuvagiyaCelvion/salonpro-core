const fs = require('fs');
const bcrypt = require('bcryptjs');
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

async function seed() {
  console.log('🌱 Seeding fresh test data for E2E suites...');

  // 1. Clean previous test entities if any
  await pool.query("DELETE FROM platform_admins WHERE email = 'superadmin@platform.salonpro.in'");
  await pool.query("DELETE FROM users WHERE email IN ('owner.aura@auraglamour.in', 'owner.velvet@velvetluxe.in')");
  await pool.query("DELETE FROM salons WHERE slug IN ('aura-glamour-studio', 'velvet-luxe-spa')");
  await pool.query("DELETE FROM customers WHERE mobile IN ('9825100001', '9825100002', '9825100003', '9825100004', '9825100005')");

  // 2. Insert Platform Admin
  const adminHash = await bcrypt.hash('AdminPassword@2026', 10);
  await pool.query(
    `INSERT INTO platform_admins (email, password_hash, name, role, is_active)
     VALUES ($1, $2, $3, $4, true)`,
    ['superadmin@platform.salonpro.in', adminHash, 'Super Admin Tester', 'super_admin']
  );
  console.log('✓ Platform Admin created: superadmin@platform.salonpro.in');

  // 3. Create Salon A: Aura Glamour Studio
  const salonARes = await pool.query(
    `INSERT INTO salons (
       name, slug, address, phone, brand_color, 
       open_time, close_time, slot_minutes, buffer_minutes, 
       working_days, min_advance_hours, max_advance_days, 
       booking_enabled, is_active, trial_ends_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, true, NOW() + INTERVAL '14 days'
     ) RETURNING id`,
    [
      'Aura Glamour Studio',
      'aura-glamour-studio',
      '101 Sindhu Bhavan Road, Bodakdev, Ahmedabad',
      '9825000001',
      '#b3135b',
      '09:00:00',
      '20:00:00',
      30,
      10,
      [1, 2, 3, 4, 5, 6], // Mon-Sat, Sunday closed
      1,
      14
    ]
  );
  const salonAId = salonARes.rows[0].id;

  const ownerAHash = await bcrypt.hash('AuraOwnerPass@2026', 10);
  await pool.query(
    `INSERT INTO users (salon_id, email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, $4, 'owner', true)`,
    [salonAId, 'owner.aura@auraglamour.in', ownerAHash, 'Priya Patel (Aura Owner)']
  );

  // Staff for Salon A
  const staffA1 = (await pool.query(
    `INSERT INTO staff (salon_id, name, role_title, active, show_online)
     VALUES ($1, 'Priya Patel', 'Master Stylist & Colorist', true, true) RETURNING id`,
    [salonAId]
  )).rows[0].id;

  const staffA2 = (await pool.query(
    `INSERT INTO staff (salon_id, name, role_title, active, show_online)
     VALUES ($1, 'Anjali Mehta', 'Senior Aesthetician', true, true) RETURNING id`,
    [salonAId]
  )).rows[0].id;

  // Services for Salon A
  const svcA1 = (await pool.query(
    `INSERT INTO services (salon_id, name, category, duration_min, price, online_enabled)
     VALUES ($1, 'Hair Styling & Cut', 'Hair', 45, 600, true) RETURNING id`,
    [salonAId]
  )).rows[0].id;

  const svcA2 = (await pool.query(
    `INSERT INTO services (salon_id, name, category, duration_min, price, online_enabled)
     VALUES ($1, 'Hydra Glow Facial', 'Facial', 60, 1200, true) RETURNING id`,
    [salonAId]
  )).rows[0].id;

  await pool.query('INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2), ($3, $4)', [
    staffA1, svcA1, staffA2, svcA2
  ]);

  console.log('✓ Salon A created: Aura Glamour Studio (aura-glamour-studio)');

  // 4. Create Salon B: Velvet Luxe Spa & Salon
  const salonBRes = await pool.query(
    `INSERT INTO salons (
       name, slug, address, phone, brand_color, 
       open_time, close_time, slot_minutes, buffer_minutes, 
       working_days, min_advance_hours, max_advance_days, 
       booking_enabled, is_active, trial_ends_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, true, NOW() + INTERVAL '14 days'
     ) RETURNING id`,
    [
      'Velvet Luxe Spa & Salon',
      'velvet-luxe-spa',
      '404 CG Road, Navrangpura, Ahmedabad',
      '9825000002',
      '#7c3aed',
      '10:00:00',
      '21:00:00',
      30,
      10,
      [0, 1, 2, 3, 4, 5, 6], // All 7 days open
      1,
      14
    ]
  );
  const salonBId = salonBRes.rows[0].id;

  const ownerBHash = await bcrypt.hash('VelvetOwnerPass@2026', 10);
  await pool.query(
    `INSERT INTO users (salon_id, email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, $4, 'owner', true)`,
    [salonBId, 'owner.velvet@velvetluxe.in', ownerBHash, 'Rohan Varma (Velvet Owner)']
  );

  // Staff for Salon B
  const staffB1 = (await pool.query(
    `INSERT INTO staff (salon_id, name, role_title, active, show_online)
     VALUES ($1, 'Rohan Varma', 'Spa Therapist', true, true) RETURNING id`,
    [salonBId]
  )).rows[0].id;

  const staffB2 = (await pool.query(
    `INSERT INTO staff (salon_id, name, role_title, active, show_online)
     VALUES ($1, 'Sneha Rao', 'Nail Artist & Stylist', true, true) RETURNING id`,
    [salonBId]
  )).rows[0].id;

  // Services for Salon B
  const svcB1 = (await pool.query(
    `INSERT INTO services (salon_id, name, category, duration_min, price, online_enabled)
     VALUES ($1, 'Deep Tissue Spa Therapy', 'Spa', 60, 1800, true) RETURNING id`,
    [salonBId]
  )).rows[0].id;

  const svcB2 = (await pool.query(
    `INSERT INTO services (salon_id, name, category, duration_min, price, online_enabled)
     VALUES ($1, 'Deluxe Spa Pedicure', 'Nails', 45, 750, true) RETURNING id`,
    [salonBId]
  )).rows[0].id;

  await pool.query('INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2), ($3, $4)', [
    staffB1, svcB1, staffB2, svcB2
  ]);

  console.log('✓ Salon B created: Velvet Luxe Spa & Salon (velvet-luxe-spa)');

  // 5. Create 5 Customers
  const customers = [
    { name: 'Amit Trivedi', mobile: '9825100001', pin: '1234', email: 'amit.trivedi@example.com' },
    { name: 'Divya Shah', mobile: '9825100002', pin: '2345', email: 'divya.shah@example.com' },
    { name: 'Rahul Desai', mobile: '9825100003', pin: '3456', email: 'rahul.desai@example.com' },
    { name: 'Pooja Joshi', mobile: '9825100004', pin: '4567', email: 'pooja.joshi@example.com' },
    { name: 'Vikram Rathod', mobile: '9825100005', pin: '5678', email: 'vikram.rathod@example.com' },
  ];

  for (const c of customers) {
    await pool.query(
      `INSERT INTO customers (salon_id, name, mobile, email, pin)
       VALUES ($1, $2, $3, $4, $5)`,
      [salonAId, c.name, c.mobile, c.email, c.pin]
    );
    // Also create customer in Salon B
    await pool.query(
      `INSERT INTO customers (salon_id, name, mobile, email, pin)
       VALUES ($1, $2, $3, $4, $5)`,
      [salonBId, c.name, c.mobile, c.email, c.pin]
    );
  }
  console.log('✓ 5 Customers created in both salons with PINs');

  await pool.end();
  console.log('🎉 Seeding completed successfully!');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
