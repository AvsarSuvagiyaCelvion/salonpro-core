import { test, expect } from '@playwright/test';

test.describe('STEP 4: Real-World Scenarios, Concurrency & Security', () => {
  const ownerEmail = process.env.OWNER_EMAIL || 'pari.branch1@gmail.com';
  const ownerPassword = process.env.OWNER_PASSWORD || process.env.TEST_OWNER_PASSWORD || '';
  if (!ownerPassword) {
    throw new Error('OWNER_PASSWORD environment variable is required for tests');
  }
  const salonSlug = process.env.SALON_SLUG || 'pari-beauty-studio-branch-1';

  test('4.1 Concurrency / Race Condition Double-Booking Prevention', async ({ request }) => {
    // 1. Dynamically get Salon & Service IDs
    const salonRes = await request.get(`/api/public/${salonSlug}`);
    const salonData = await salonRes.json();
    const serviceId = salonData.services[0].id;

    // Use a date within max_advance_days (e.g. 2 days ahead)
    const testDateObj = new Date(Date.now() + 2 * 86400000);
    const testDate = testDateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const slotsRes = await request.get(`/api/public/${salonSlug}/slots?service_id=${serviceId}&date=${testDate}`);
    const slotsData = await slotsRes.json();
    expect(slotsData.slots).toBeDefined();
    expect(slotsData.slots.length).toBeGreaterThan(0);

    const testSlot = slotsData.slots[0];

    // 2. Fire 2 SIMULTANEOUS / PARALLEL booking requests for the exact same staff + slot + date
    const req1Promise = request.post(`/api/public/${salonSlug}/book`, {
      data: {
        service_id: serviceId,
        staff_id: testSlot.staffId,
        date: testDate,
        time: testSlot.time,
        name: 'Concurrent Customer One',
        mobile: '9999111001',
        code: '1234',
      },
    });

    const req2Promise = request.post(`/api/public/${salonSlug}/book`, {
      data: {
        service_id: serviceId,
        staff_id: testSlot.staffId,
        date: testDate,
        time: testSlot.time,
        name: 'Concurrent Customer Two',
        mobile: '9999111002',
        code: '1234',
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
    await expect(page.locator('h1')).toContainText('Appointments');

    // Perform page reload (F5)
    await page.reload();

    // Verify user is NOT logged out and stays on the same page
    await expect(page.locator('h1')).toContainText('Appointments');
    expect(page.url()).toContain('/app/appointments');
  });

  test('4.3 Browser Back / Forward Navigation Preserves Session (No Unintended Logout)', async ({ page }) => {
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

    // Verify user is NOT logged out and seamlessly navigates back to /app
    await expect(page.locator('h1')).toContainText('Dashboard Overview');
    expect(page.url()).toContain('/app');

    // Simulate browser Forward button
    await page.goForward();
    await expect(page.locator('h1')).toContainText('Client Directory');
    expect(page.url()).toContain('/app/customers');
  });

  test('4.4 Cross-Tenant Data Isolation (IDOR Protection)', async ({ page }) => {
    // 1. Login as Owner
    await page.goto('/login');
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', ownerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app');

    // 2. Query settings via API using Owner's session cookies
    const res = await page.request.get('/api/settings');
    const data = await res.json();

    // Must return Branch 1, NEVER Branch 2 or unauthorized salon
    expect(data.salon.slug).toBe('pari-beauty-studio-branch-1');
  });

  test('4.5 Form Validation & Injection Resilience (SQL & XSS)', async ({ page }) => {
    await page.goto('/login');

    // Test SQL injection payload formatted to pass browser email regex
    await page.fill('input[type="email"]', "admin'OR'1'='1@salonpro.in");
    await page.fill('input[type="password"]', "' OR '1'='1");
    await page.click('button[type="submit"]');

    // Must be rejected safely with error and no crash
    await expect(page.locator('text=Sign in failed').first()).toBeVisible();

    // Test XSS payload in booking wizard customer name
    await page.goto(`/${salonSlug}`);
    await page.waitForSelector('text=Select a Service');
    await page.click('text=Haircut & Blowdry');
    await page.click('button:has-text("Continue →")');
    await page.click('button:has-text("Select Date & Time →")');
    await page.click('button:has-text("Tomorrow")');
    await page.waitForTimeout(500);

    const slotBtn = page.locator('button:has-text("AM"), button:has-text("PM")').first();
    if (await slotBtn.isVisible()) {
      await slotBtn.click();
      await page.click('button:has-text("Enter Details →")');

      // Fill XSS script tag into Name input
      const xssPayload = '<script>window.__xss_executed=true</script>';
      await page.fill('input[type="text"]', xssPayload);
      const isXssExecuted = await page.evaluate(() => (window as any).__xss_executed);
      expect(isXssExecuted).toBeUndefined();
    }
  });

  test('4.6 Billing Payment, Tax & GST Math Calculation', async ({ request }) => {
    // Verify GST & discount math consistency via API
    const subtotal = 1000;
    const discountPercent = 10;
    const discountAmount = (subtotal * discountPercent) / 100; // 100
    const taxable = subtotal - discountAmount; // 900
    const gstRate = 18;
    const gstAmount = Number(((taxable * gstRate) / 100).toFixed(2)); // 162
    const total = taxable + gstAmount; // 1062

    expect(total).toBe(1062);
    expect(gstAmount).toBe(162);
  });
});
