import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from './config.ts';
import { createOwnerToken, createCustomerToken } from './client.ts';
import type { QADataFixtures } from './types.ts';

export async function cleanTestData(): Promise<void> {
  console.log('🧹 [QA SEED] Cleaning up previous TEST_ records...');
  try {
    // 1. Delete reviews
    await query(`
      DELETE FROM reviews 
      WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
         OR customer_id IN (SELECT id FROM customers WHERE name LIKE 'TEST_%')
    `);

    // 2. Delete appointments
    await query(`
      DELETE FROM appointments 
      WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
         OR customer_id IN (SELECT id FROM customers WHERE name LIKE 'TEST_%')
    `);

    // 3. Delete invoices and payments
    await query(`
      DELETE FROM payments 
      WHERE invoice_id IN (
        SELECT id FROM invoices 
        WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
           OR customer_id IN (SELECT id FROM customers WHERE name LIKE 'TEST_%')
      )
    `);

    await query(`
      DELETE FROM invoices 
      WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
         OR customer_id IN (SELECT id FROM customers WHERE name LIKE 'TEST_%')
    `);

    // 4. Delete session items and sessions
    await query(`
      DELETE FROM session_items 
      WHERE session_id IN (
        SELECT id FROM sessions 
        WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
      )
    `);

    await query(`
      DELETE FROM sessions 
      WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
    `);

    await query(`
      DELETE FROM waiting 
      WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
    `);

    // 5. Delete photos and holidays
    await query(`
      DELETE FROM salon_photos 
      WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
    `);

    await query(`
      DELETE FROM salon_holidays 
      WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
    `);

    // 6. Delete staff_services and staff
    await query(`
      DELETE FROM staff_services 
      WHERE staff_id IN (
        SELECT id FROM staff 
        WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
      )
    `);

    await query(`
      DELETE FROM staff 
      WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
    `);

    // 7. Delete services
    await query(`
      DELETE FROM services 
      WHERE salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
    `);

    // 8. Delete customers
    await query(`
      DELETE FROM customers 
      WHERE name LIKE 'TEST_%' 
         OR salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
    `);

    // 9. Delete users
    await query(`
      DELETE FROM users 
      WHERE email LIKE '%@StudioDesk.test'
         OR salon_id IN (SELECT id FROM salons WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%')
    `);

    // 10. Delete salons
    await query(`
      DELETE FROM salons 
      WHERE name LIKE 'TEST_%' OR slug LIKE 'test-%'
    `);

    // 11. Clear rate limits for test callers
    await query(`
      DELETE FROM auth_rate_limits 
      WHERE key LIKE '%test%' OR key LIKE '%987654321%'
    `);

    console.log('✅ [QA SEED] Cleaned all TEST_ records.');
  } catch (err: any) {
    console.error('⚠️ [QA SEED WARNING] Error during clean:', err.message);
  }
}

export async function seedTestData(): Promise<QADataFixtures> {
  await cleanTestData();
  console.log('🌱 [QA SEED] Seeding isolated test fixtures...');

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const pin1234Hash = await bcrypt.hash('1234', 10);
  const pin5678Hash = await bcrypt.hash('5678', 10);
  const pin9999Hash = await bcrypt.hash('9999', 10);

  // 1. Salons
  const salon1Id = crypto.randomUUID();
  const salon2Id = crypto.randomUUID();

  await query(`
    INSERT INTO salons (
      id, name, slug, brand_color, cancel_policy_hours, plan, booking_enabled, 
      open_time, close_time, working_days, slot_minutes, buffer_minutes, min_advance_hours, max_advance_days,
      is_active, subscription_status, trial_ends_at, subscription_ends_at, subscription_plan_id
    )
    VALUES 
      (
        $1::uuid, 'TEST_Salon_1', 'test-salon-1', '#ec4899', 2, 'pro', true, 
        '09:00', '21:00', '{0,1,2,3,4,5,6}', 30, 0, 1, 30,
        true, 'active', NOW() + INTERVAL '14 days', NOW() + INTERVAL '365 days',
        (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
      ),
      (
        $2::uuid, 'TEST_Salon_2', 'test-salon-2', '#3b82f6', 4, 'basic', true, 
        '10:00', '20:00', '{0,1,2,3,4,5,6}', 30, 0, 1, 30,
        true, 'active', NOW() + INTERVAL '14 days', NOW() + INTERVAL '365 days',
        (SELECT id FROM subscription_plans WHERE slug = 'basic' LIMIT 1)
      )
  `, [salon1Id, salon2Id]);

  // 2. Users (Owner 1, Staff 1, Owner 2)
  const owner1Id = crypto.randomUUID();
  const staff1Id = crypto.randomUUID();
  const owner2Id = crypto.randomUUID();

  await query(`
    INSERT INTO users (id, salon_id, full_name, email, password_hash, role, is_active)
    VALUES 
      ($1::uuid, $2::uuid, 'Test Owner 1', 'test_owner1@StudioDesk.test', $3::text, 'owner', true),
      ($4::uuid, $2::uuid, 'Test Staff 1', 'test_staff1@StudioDesk.test', $3::text, 'staff', true),
      ($5::uuid, $6::uuid, 'Test Owner 2', 'test_owner2@StudioDesk.test', $3::text, 'owner', true)
  `, [owner1Id, salon1Id, passwordHash, staff1Id, owner2Id, salon2Id]);

  // 3. Staff members
  const stylist1Id = crypto.randomUUID();
  const stylist2Id = crypto.randomUUID();
  const stylist3Id = crypto.randomUUID();

  await query(`
    INSERT INTO staff (id, salon_id, name, role_title, active, show_online)
    VALUES 
      ($1::uuid, $2::uuid, 'TEST_Stylist_1', 'Senior Hair Stylist', true, true),
      ($3::uuid, $2::uuid, 'TEST_Stylist_2', 'Skin Specialist', true, true),
      ($4::uuid, $5::uuid, 'TEST_Stylist_3', 'Barber Master', true, true)
  `, [stylist1Id, salon1Id, stylist2Id, stylist3Id, salon2Id]);

  // 4. Services
  const service1Id = crypto.randomUUID();
  const service2Id = crypto.randomUUID();
  const service3Id = crypto.randomUUID();

  await query(`
    INSERT INTO services (id, salon_id, name, category, duration_min, price, online_enabled)
    VALUES 
      ($1::uuid, $2::uuid, 'TEST_Haircut', 'Hair', 30, 500, true),
      ($3::uuid, $2::uuid, 'TEST_Facial', 'Skin', 60, 1200, true),
      ($4::uuid, $5::uuid, 'TEST_Shave', 'Beard', 20, 300, true)
  `, [service1Id, salon1Id, service2Id, service3Id, salon2Id]);

  // Link staff to services
  await query(`
    INSERT INTO staff_services (staff_id, service_id)
    VALUES 
      ($1::uuid, $2::uuid),
      ($3::uuid, $4::uuid),
      ($5::uuid, $6::uuid)
  `, [stylist1Id, service1Id, stylist2Id, service2Id, stylist3Id, service3Id]);

  // 5. Customers
  const customerAId = crypto.randomUUID();
  const customerBId = crypto.randomUUID();
  const customerCId = crypto.randomUUID();

  await query(`
    INSERT INTO customers (id, salon_id, name, mobile, pin, email, address)
    VALUES 
      ($1::uuid, $2::uuid, 'TEST_Customer_A', '9876543210', $3::text, 'customera@test.com', '123 MG Road, Surat'),
      ($4::uuid, $2::uuid, 'TEST_Customer_B', '9876543211', $5::text, 'customerb@test.com', '456 Ring Road, Surat'),
      ($6::uuid, $7::uuid, 'TEST_Customer_C', '9876543212', $8::text, 'customerc@test.com', '789 SG Highway, Ahmedabad')
  `, [customerAId, salon1Id, pin1234Hash, customerBId, pin5678Hash, customerCId, salon2Id, pin9999Hash]);

  // 6. Appointments at exact offsets
  const now = new Date();

  // Helper to format ISO with exact minutes
  const addHours = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
  const addDays = (d: number, hourOfDay = 11) => {
    const target = new Date(now);
    target.setDate(target.getDate() + d);
    target.setHours(hourOfDay, 0, 0, 0);
    return target.toISOString();
  };
  const addMinutes = (iso: string, mins: number) => {
    return new Date(new Date(iso).getTime() + mins * 60 * 1000).toISOString();
  };

  // Appointment 1: Customer A, future +2 days (eligible for cancellation/reschedule)
  const appt1Id = crypto.randomUUID();
  const appt1Start = addDays(2, 10);
  const appt1End = addMinutes(appt1Start, 30);

  // Appointment 2: Customer B, future +3 days
  const appt2Id = crypto.randomUUID();
  const appt2Start = addDays(3, 12);
  const appt2End = addMinutes(appt2Start, 60);

  // Appointment 3: Customer A, future +1 hour (outside 2h cancel window)
  const appt3Id = crypto.randomUUID();
  const appt3Start = addHours(1);
  const appt3End = addMinutes(appt3Start, 30);

  // Appointment 4: Customer A, completed 10 days ago (eligible for review)
  const appt4Id = crypto.randomUUID();
  const appt4Start = addDays(-10, 14);
  const appt4End = addMinutes(appt4Start, 30);

  // Appointment 5: Customer A, completed 35 days ago (ineligible for review: >30 days)
  const appt5Id = crypto.randomUUID();
  const appt5Start = addDays(-35, 15);
  const appt5End = addMinutes(appt5Start, 30);

  // Appointment 6: Customer B, completed 15 days ago (eligible for review)
  const appt6Id = crypto.randomUUID();
  const appt6Start = addDays(-15, 16);
  const appt6End = addMinutes(appt6Start, 60);

  // Appointment 7: For concurrency reschedule tests (+4 days)
  const appt7Id = crypto.randomUUID();
  const appt7Start = addDays(4, 14);
  const appt7End = addMinutes(appt7Start, 30);

  await query(`
    INSERT INTO appointments (id, salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source, rescheduled_count)
    VALUES 
      ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::timestamptz, $7::timestamptz, 'scheduled', 'online', 0),
      ($8::uuid, $2::uuid, $9::uuid, $10::uuid, $11::uuid, $12::timestamptz, $13::timestamptz, 'scheduled', 'online', 0),
      ($14::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $15::timestamptz, $16::timestamptz, 'scheduled', 'online', 0),
      ($17::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $18::timestamptz, $19::timestamptz, 'done', 'online', 0),
      ($20::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $21::timestamptz, $22::timestamptz, 'done', 'online', 0),
      ($23::uuid, $2::uuid, $9::uuid, $10::uuid, $11::uuid, $24::timestamptz, $25::timestamptz, 'done', 'online', 0),
      ($26::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $27::timestamptz, $28::timestamptz, 'scheduled', 'online', 0)
  `, [
    appt1Id, salon1Id, customerAId, stylist1Id, service1Id, appt1Start, appt1End,
    appt2Id, customerBId, stylist2Id, service2Id, appt2Start, appt2End,
    appt3Id, appt3Start, appt3End,
    appt4Id, appt4Start, appt4End,
    appt5Id, appt5Start, appt5End,
    appt6Id, appt6Start, appt6End,
    appt7Id, appt7Start, appt7End,
  ]);

  // Generate tokens
  const owner1Token = await createOwnerToken({
    userId: owner1Id,
    salonId: salon1Id,
    email: 'test_owner1@StudioDesk.test',
    role: 'owner',
    salonSlug: 'test-salon-1',
  });

  const staff1Token = await createOwnerToken({
    userId: staff1Id,
    salonId: salon1Id,
    email: 'test_staff1@StudioDesk.test',
    role: 'staff',
    salonSlug: 'test-salon-1',
  });

  const owner2Token = await createOwnerToken({
    userId: owner2Id,
    salonId: salon2Id,
    email: 'test_owner2@StudioDesk.test',
    role: 'owner',
    salonSlug: 'test-salon-2',
  });

  const customerAToken = await createCustomerToken({
    customerId: customerAId,
    mobile: '9876543210',
    name: 'TEST_Customer_A',
    salonId: salon1Id,
  });

  const customerBToken = await createCustomerToken({
    customerId: customerBId,
    mobile: '9876543211',
    name: 'TEST_Customer_B',
    salonId: salon1Id,
  });

  const customerCToken = await createCustomerToken({
    customerId: customerCId,
    mobile: '9876543212',
    name: 'TEST_Customer_C',
    salonId: salon2Id,
  });

  console.log('✅ [QA SEED] Test fixtures successfully created.');

  return {
    salon1: {
      id: salon1Id,
      name: 'TEST_Salon_1',
      slug: 'test-salon-1',
      brand_color: '#ec4899',
      cancel_policy_hours: 2,
      plan: 'pro',
    },
    salon2: {
      id: salon2Id,
      name: 'TEST_Salon_2',
      slug: 'test-salon-2',
      brand_color: '#3b82f6',
      cancel_policy_hours: 4,
      plan: 'basic',
    },
    owner1: {
      id: owner1Id,
      salon_id: salon1Id,
      email: 'test_owner1@StudioDesk.test',
      role: 'owner',
      token: owner1Token,
    },
    staff1: {
      id: staff1Id,
      salon_id: salon1Id,
      email: 'test_staff1@StudioDesk.test',
      role: 'staff',
      token: staff1Token,
    },
    owner2: {
      id: owner2Id,
      salon_id: salon2Id,
      email: 'test_owner2@StudioDesk.test',
      role: 'owner',
      token: owner2Token,
    },
    stylist1: {
      id: stylist1Id,
      salon_id: salon1Id,
      name: 'TEST_Stylist_1',
      role_title: 'Senior Hair Stylist',
    },
    stylist2: {
      id: stylist2Id,
      salon_id: salon1Id,
      name: 'TEST_Stylist_2',
      role_title: 'Skin Specialist',
    },
    stylist3: {
      id: stylist3Id,
      salon_id: salon2Id,
      name: 'TEST_Stylist_3',
      role_title: 'Barber Master',
    },
    service1: {
      id: service1Id,
      salon_id: salon1Id,
      name: 'TEST_Haircut',
      duration_min: 30,
      price: 500,
    },
    service2: {
      id: service2Id,
      salon_id: salon1Id,
      name: 'TEST_Facial',
      duration_min: 60,
      price: 1200,
    },
    service3: {
      id: service3Id,
      salon_id: salon2Id,
      name: 'TEST_Shave',
      duration_min: 20,
      price: 300,
    },
    customerA: {
      id: customerAId,
      salon_id: salon1Id,
      name: 'TEST_Customer_A',
      mobile: '9876543210',
      email: 'customera@test.com',
      address: '123 MG Road, Surat',
      pin: '1234',
      token: customerAToken,
    },
    customerB: {
      id: customerBId,
      salon_id: salon1Id,
      name: 'TEST_Customer_B',
      mobile: '9876543211',
      email: 'customerb@test.com',
      address: '456 Ring Road, Surat',
      pin: '5678',
      token: customerBToken,
    },
    customerC: {
      id: customerCId,
      salon_id: salon2Id,
      name: 'TEST_Customer_C',
      mobile: '9876543212',
      email: 'customerc@test.com',
      address: '789 SG Highway, Ahmedabad',
      pin: '9999',
      token: customerCToken,
    },
    apptFutureA: {
      id: appt1Id,
      salon_id: salon1Id,
      customer_id: customerAId,
      staff_id: stylist1Id,
      service_id: service1Id,
      starts_at: appt1Start,
      ends_at: appt1End,
      status: 'scheduled',
      rescheduled_count: 0,
    },
    apptFutureB: {
      id: appt2Id,
      salon_id: salon1Id,
      customer_id: customerBId,
      staff_id: stylist2Id,
      service_id: service2Id,
      starts_at: appt2Start,
      ends_at: appt2End,
      status: 'scheduled',
      rescheduled_count: 0,
    },
    apptNearCutoffA: {
      id: appt3Id,
      salon_id: salon1Id,
      customer_id: customerAId,
      staff_id: stylist1Id,
      service_id: service1Id,
      starts_at: appt3Start,
      ends_at: appt3End,
      status: 'scheduled',
      rescheduled_count: 0,
    },
    apptCompletedRecentA: {
      id: appt4Id,
      salon_id: salon1Id,
      customer_id: customerAId,
      staff_id: stylist1Id,
      service_id: service1Id,
      starts_at: appt4Start,
      ends_at: appt4End,
      status: 'done',
      rescheduled_count: 0,
    },
    apptCompletedOldA: {
      id: appt5Id,
      salon_id: salon1Id,
      customer_id: customerAId,
      staff_id: stylist1Id,
      service_id: service1Id,
      starts_at: appt5Start,
      ends_at: appt5End,
      status: 'done',
      rescheduled_count: 0,
    },
    apptCompletedRecentB: {
      id: appt6Id,
      salon_id: salon1Id,
      customer_id: customerBId,
      staff_id: stylist2Id,
      service_id: service2Id,
      starts_at: appt6Start,
      ends_at: appt6End,
      status: 'done',
      rescheduled_count: 0,
    },
    apptForConcurrency: {
      id: appt7Id,
      salon_id: salon1Id,
      customer_id: customerAId,
      staff_id: stylist1Id,
      service_id: service1Id,
      starts_at: appt7Start,
      ends_at: appt7End,
      status: 'scheduled',
      rescheduled_count: 0,
    },
  };
}

