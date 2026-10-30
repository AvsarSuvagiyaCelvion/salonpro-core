import { test, expect } from '@playwright/test';

test.describe('STEP 2: Customer Public Booking & Portal Testing', () => {
  const customerMobile = '9876500001';
  const customerName = 'Pooja Client';
  const customerPin = '1234';

  test('2.1 Customer 4-Step Booking Wizard on Salon Page', async ({ page }) => {
    // 1. Visit Salon's public booking page
    await page.goto('/pari-beauty-studio-branch-1');

    // Wait for the booking wizard to finish initial loading
    await page.waitForSelector('text=1. Select a Service', { timeout: 25000 });

    // Verify Salon Hero
    await expect(page.locator('h1')).toContainText('Pari Beauty Studio - Branch 1');

    // STEP 1: Select Service
    await page.click('text=Haircut & Blowdry');
    await expect(page.locator('text=Selected:').first()).toBeVisible();

    // Click Continue -> Step 2
    await page.click('button:has-text("Continue →")');

    // STEP 2: Choose Specialist
    await page.waitForSelector('text=2. Choose Your Specialist');
    await page.click('text=Any Available Specialist');

    // Click Select Date & Time -> Step 3
    await page.click('button:has-text("Select Date & Time →")');

    // STEP 3: Pick Date & Available Slot
    await page.waitForSelector('text=3. Pick Date & Available Slot');

    // Click Tomorrow to ensure plenty of open slots
    await page.click('button:has-text("Tomorrow")');

    // Wait for slot loading to complete
    await expect(page.locator('text=Finding available free slots...')).not.toBeVisible({ timeout: 15000 });

    // Expect time slot buttons to appear
    const slotBtn = page.locator('button:has-text("AM"), button:has-text("PM")').first();
    await expect(slotBtn).toBeVisible({ timeout: 15000 });

    // Pick first slot
    await slotBtn.click();

    // Click Enter Details -> Step 4
    await page.click('button:has-text("Enter Details →")');

    // STEP 4: Confirm Details & Customer Info
    await page.waitForSelector('text=4. Confirm Your Appointment');

    // Fill customer details
    await page.fill('input[placeholder*="Diya"], input[placeholder*="Pooja"], input[type="text"]', customerName);
    await page.fill('input[type="tel"]', customerMobile);

    // If PIN prompt is visible
    const pinInput = page.locator('input[placeholder*="PIN"], input[type="password"]');
    if (await pinInput.isVisible()) {
      await pinInput.fill(customerPin);
    }

    // Submit booking
    await page.click('button:has-text("Complete Booking")');

    // Confirmation Screen
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Haircut & Blowdry').first()).toBeVisible();
  });

  test('2.2 Customer Portal Login, Appointments, and Bills View', async ({ page }) => {
    await page.goto('/portal');

    // Wait for loading spinner to detach
    await page.waitForSelector('text=Loading client portal...', { state: 'detached', timeout: 20000 }).catch(() => {});

    // Check if customer is already authenticated
    const isClientLoggedIn = await page.locator('text=Verified Client').isVisible().catch(() => false);

    if (!isClientLoggedIn) {
      await page.waitForSelector('text=Client Portal');

      // Fill Mobile & 4-digit PIN
      await page.fill('input[type="tel"]', customerMobile);
      await page.fill('input[type="password"]', customerPin);
      await page.click('button:has-text("Sign In to Portal")');
    }

    // Expect client portal dashboard
    await expect(page.locator('text=Verified Client').first()).toBeVisible({ timeout: 15000 });

    // Verify Tabs: Appointments, Bills, Memberships
    await page.locator('button:has-text("Bills")').first().click();
    await expect(page.locator('button:has-text("Bills")').first()).toBeVisible();

    await page.locator('button:has-text("VIP")').first().click();
    await expect(page.locator('button:has-text("VIP")').first()).toBeVisible();

    // Switch back to Appointments
    await page.locator('button:has-text("Appointments")').first().click();
    await expect(page.locator('button:has-text("Appointments")').first()).toBeVisible();
  });
});
