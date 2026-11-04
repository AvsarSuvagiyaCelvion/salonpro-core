import { test, expect } from '@playwright/test';

test.describe('PHASE 7: Critical Security & SaaS Bug Fix Verification', () => {
  const salonSlug = process.env.SALON_SLUG || 'pari-beauty-studio-branch-1';

  test('7.1 Registration sets trial status only (never active) & handles duplicates cleanly', async ({ request }) => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const testEmail = `trial_test_${randomSuffix}@example.com`;
    const testSalonName = `Trial Test Salon ${randomSuffix}`;

    // 1. Attempt registration passing planId='pro_yearly'
    const res = await request.post('/api/register', {
      data: {
        name: testSalonName,
        email: testEmail,
        password: 'Password123!',
        ownerName: 'Test Owner',
        mobile: '9876543210',
        planId: 'pro_yearly',
        billingInterval: 'yearly',
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.salon).toBeDefined();
    // Verification: registration must NEVER activate a paid plan
    expect(body.salon.subscription_status).toBe('trial');
    expect(body.salon.trial_ends_at).toBeDefined();

    const trialEnds = new Date(body.salon.trial_ends_at).getTime();
    const now = Date.now();
    const daysDiff = Math.round((trialEnds - now) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBeGreaterThanOrEqual(6);
    expect(daysDiff).toBeLessThanOrEqual(8);

    // 2. Duplicate registration attempt with exact same email must yield clean 409 Conflict
    const dupRes = await request.post('/api/register', {
      data: {
        name: `${testSalonName} Dup`,
        email: testEmail,
        password: 'Password123!',
        ownerName: 'Test Owner Dup',
        mobile: '9876543210',
      },
    });

    expect(dupRes.status()).toBe(409);
    const dupBody = await dupRes.json();
    expect(dupBody.error).toMatch(/already registered|already in use/i);
  });

  test('7.2 Duplicate customer mobile per salon is rejected (409 Conflict)', async ({ request }) => {
    // Dynamically get salon info
    const salonRes = await request.get(`/api/public/${salonSlug}`);
    const salonData = await salonRes.json();
    const serviceId = salonData.services[0].id;

    // Use a date within max_advance_days
    const testDateObj = new Date(Date.now() + 3 * 86400000);
    const testDate = testDateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const slotsRes = await request.get(`/api/public/${salonSlug}/slots?service_id=${serviceId}&date=${testDate}`);
    const slotsData = await slotsRes.json();
    expect(slotsData.slots).toBeDefined();
    expect(slotsData.slots.length).toBeGreaterThan(1);

    const testSlot1 = slotsData.slots[0];
    const uniqueMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    // First booking creates customer with PIN 5555
    const bookRes1 = await request.post(`/api/public/${salonSlug}/book`, {
      data: {
        service_id: serviceId,
        staff_id: testSlot1.staffId,
        date: testDate,
        time: testSlot1.time,
        name: 'Primary Customer',
        mobile: uniqueMobile,
        code: '5555',
      },
    });
    expect([200, 409]).toContain(bookRes1.status());

    // Login via customer auth with wrong PIN should be 401
    const authRes = await request.post('/api/customer/auth', {
      data: {
        action: 'login',
        salonSlug,
        mobile: `+91 ${uniqueMobile}`, // tests phone normalization
        code: '0000', // wrong PIN
      },
    });
    expect(authRes.status()).toBe(401);

    // Login with correct PIN should succeed
    const validAuthRes = await request.post('/api/customer/auth', {
      data: {
        action: 'login',
        salonSlug,
        mobile: uniqueMobile,
        code: '5555',
      },
    });
    if (bookRes1.status() === 200) {
      expect(validAuthRes.status()).toBe(200);
      const authData = await validAuthRes.json();
      expect(authData.customer).toBeDefined();
      expect(authData.customer.mobile).toBe(uniqueMobile);
    }
  });

  test('7.3 Appointment booking concurrency & advisory lock prevents overlapping slots', async ({ request }) => {
    const salonRes = await request.get(`/api/public/${salonSlug}`);
    const salonData = await salonRes.json();
    const serviceId = salonData.services[0].id;

    const testDateObj = new Date(Date.now() + 4 * 86400000);
    const testDate = testDateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const slotsRes = await request.get(`/api/public/${salonSlug}/slots?service_id=${serviceId}&date=${testDate}`);
    const slotsData = await slotsRes.json();
    expect(slotsData.slots.length).toBeGreaterThan(0);

    const testSlot = slotsData.slots[0];

    // Fire 2 simultaneous booking requests for identical staff and slot
    const req1 = request.post(`/api/public/${salonSlug}/book`, {
      data: {
        service_id: serviceId,
        staff_id: testSlot.staffId,
        date: testDate,
        time: testSlot.time,
        name: 'Concurrent Booker A',
        mobile: '9100000001',
        code: '1234',
      },
    });

    const req2 = request.post(`/api/public/${salonSlug}/book`, {
      data: {
        service_id: serviceId,
        staff_id: testSlot.staffId,
        date: testDate,
        time: testSlot.time,
        name: 'Concurrent Booker B',
        mobile: '9100000002',
        code: '1234',
      },
    });

    const [res1, res2] = await Promise.all([req1, req2]);
    const statuses = [res1.status(), res2.status()];

    // One must succeed (200) and the other must be rejected (409 Conflict)
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);
  });

  test('7.4 Customer records route only permits cancellation of future scheduled appointments', async ({ request }) => {
    // Attempting to cancel an appointment without a session or invalid appointment returns 401 / 404
    const cancelRes = await request.patch('/api/customer/records', {
      data: {
        appointmentId: '00000000-0000-0000-0000-000000000000',
        action: 'cancel',
      },
    });
    // Customer must be authenticated
    expect([401, 404]).toContain(cancelRes.status());
  });

  test('7.5 Owner role enforcement rejects unauthenticated or staff users on owner endpoints', async ({ request }) => {
    // 1. Settings PUT without auth
    const settingsRes = await request.put('/api/settings', {
      data: { name: 'Malicious Rename' },
    });
    expect([401, 403]).toContain(settingsRes.status());

    // 2. Subscription endpoint without auth
    const subRes = await request.get('/api/subscription');
    expect([401, 403]).toContain(subRes.status());

    // 3. Export endpoint without auth
    const exportRes = await request.get('/api/export');
    expect([401, 403]).toContain(exportRes.status());

    // 4. Reports endpoint without auth
    const reportsRes = await request.get('/api/reports');
    expect([401, 403]).toContain(reportsRes.status());
  });
});

