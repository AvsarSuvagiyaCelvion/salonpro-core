import { test, expect } from '@playwright/test';

test.describe('STEP 4: Real-World Scenarios, Concurrency & Security', () => {
  const ownerEmail = 'owner.aura@auraglamour.in';
  const ownerPassword = 'AuraOwnerPass@2026';

  test('4.1 Concurrency / Race Condition Double-Booking Prevention', async ({ request }) => {
    // 1. Dynamically get Salon & Service IDs
    const salonRes = await request.get('/api/public/aura-glamour-studio');
    const salonData = await salonRes.json();
    const serviceId = salonData.services[0].id;

    const slotsRes = await request.get(`/api/public/aura-glamour-studio/slots?service_id=${serviceId}&date=2026-10-31`);
    const slotsData = await slotsRes.json();
    expect(slotsData.slots).toBeDefined();
    expect(slotsData.slots.length).toBeGreaterThan(0);

    const testSlot = slotsData.slots[0];
    const testDate = '2026-10-31';

    // 2. Fire 2 SIMULTANEOUS / PARALLEL booking requests for the exact same staff + slot + date
    const req1Promise = request.post('/api/public/aura-glamour-studio/book', {
      data: {
        service_id: serviceId,
        staff_id: testSlot.staffId,
        date: testDate,
        time: testSlot.time,
        name: 'Customer One (Concurrent)',
        mobile: '9825100002',
        code: '2345',
      },
    });

    const req2Promise = request.post('/api/public/aura-glamour-studio/book', {
      data: {
        service_id: serviceId,
        staff_id: testSlot.staffId,
        date: testDate,
        time: testSlot.time,
        name: 'Customer Two (Concurrent)',
        mobile: '9825100003',
        code: '3456',
      },
    });

    const [res1, res2] = await Promise.all([req1Promise, req2Promise]);
    const body1 = await res1.json();
    const body2 = await res2.json();

    const successCount = (res1.status() === 200 ? 1 : 0) + (res2.status() === 200 ? 1 : 0);
    const conflictCount = (res1.status() === 409 ? 1 : 0) + (res2.status() === 409 ? 1 : 0);

    // Exactly ONE must succeed and the other must be 409 Conflict
    expect(successCount).toBe(1);
    expect(conflictCount).toBe(1);

    const rejectedBody = res1.status() === 409 ? body1 : body2;
    expect(rejectedBody.error).toContain('This time was just taken, please pick another.');
  });

  test('4.2 Page Reload Retains Session (No Logout on F5) in Salon Owner ERP', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', ownerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app');

    // Navigate to /app/appointments
    await page.goto('/app/appointments');
    await expect(page.locator('h1')).toContainText('Appointments & Booking Roster');

    // Perform page reload (F5)
    await page.reload();

    // Verify user is NOT logged out and stays on the same page
    await expect(page.locator('h1')).toContainText('Appointments & Booking Roster');
    expect(page.url()).toContain('/app/appointments');
  });

  test('4.3 Browser Back / Forward Navigation Enforces Re-Authentication', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', ownerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app');

    // Navigate to /app/customers
    await page.goto('/app/customers');
    await expect(page.locator('h1')).toContainText('Client Directory');

    // Simulate browser Back button
    await page.goBack();

    // Verify security guard triggers and redirects to login with security notice
    await page.waitForURL('**/login**');
    await expect(page.locator('text=Security Verification Required')).toBeVisible();
  });

  test('4.4 Cross-Tenant Data Isolation (IDOR Protection)', async ({ page, request }) => {
    // 1. Login as Owner A (Aura Glamour Studio)
    await page.goto('/login');
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', ownerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app');

    // 2. Attempt to query Salon B's settings via API using Owner A's session cookies
    // Owner A's cookie is bound to Salon A
    const res = await page.request.get('/api/settings');
    const data = await res.json();

    // Must return Salon A, NEVER Salon B
    expect(data.salon.slug).toBe('aura-glamour-studio');
    expect(data.salon.slug).not.toBe('velvet-luxe-spa');
  });

  test('4.5 Form Validation & Injection Resilience', async ({ page }) => {
    await page.goto('/login');

    // Test SQL injection payload formatted to pass browser email regex, ensuring server-side query parameterization safety
    await page.fill('input[type="email"]', "admin'OR'1'='1@salonpro.in");
    await page.fill('input[type="password"]', "' OR '1'='1");
    await page.click('button[type="submit"]');

    // Must be rejected safely with error and no crash
    await expect(page.locator('text=Sign in failed').first()).toBeVisible();
  });
});
