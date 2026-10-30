import { test, expect } from '@playwright/test';

test.describe('STEP 2: Customer Public Booking & Portal Testing', () => {
  const customerMobile = '9825100001';
  const customerName = 'Amit Trivedi';
  const customerPin = '1234';

  test('2.1 Customer 4-Step Booking Wizard on Salon Page', async ({ page }) => {
    // 1. Visit Salon A's public booking page
    await page.goto('/aura-glamour-studio');

    // Verify Salon Hero
    await expect(page.locator('h1')).toContainText('Aura Glamour Studio', { timeout: 15000 });

    // STEP 1: Select Service
    await expect(page.locator('text=1. Select a Service')).toBeVisible();
    await page.click('text=Hair Styling & Cut');
    await expect(page.locator('text=Selected:').first()).toBeVisible();

    // Click Continue -> Step 2
    await page.click('button:has-text("Continue")');

    // STEP 2: Choose Specialist
    await expect(page.locator('text=2. Choose Your Specialist')).toBeVisible();
    await page.click('text=Any Available Specialist');

    // Click Select Date & Time -> Step 3
    await page.click('button:has-text("Select Date & Time →")');

    // STEP 3: Pick Date & Available Slot
    await expect(page.locator('text=Select Date')).toBeVisible();

    // Verify Date chips exist (Today, Tomorrow, etc.)
    await expect(page.locator('button:has-text("Tomorrow")').first()).toBeVisible();

    // Click Tomorrow to ensure a full day of slots is available
    await page.click('button:has-text("Tomorrow")');

    // Wait for slot loading to complete
    await expect(page.locator('text=Finding available free slots...')).not.toBeVisible({ timeout: 15000 });

    // Expect time slot buttons to appear
    const slotBtn = page.locator('button:has-text("AM"), button:has-text("PM")').first();
    await expect(slotBtn).toBeVisible({ timeout: 15000 });

    // Pick first slot
    await slotBtn.click();

    // Click Enter Details -> Step 4
    await page.click('button:has-text("Enter Details")');

    // STEP 4: Confirm Details & Customer Info
    await expect(page.locator('text=4. Confirm Your Appointment')).toBeVisible();

    // Fill customer details
    await page.fill('input[placeholder*="Diya"], input[type="text"]', customerName);
    await page.fill('input[type="tel"]', customerMobile);

    // If PIN prompt is visible
    const pinInput = page.locator('input[placeholder*="PIN"], input[type="password"]');
    if (await pinInput.isVisible()) {
      await pinInput.fill(customerPin);
    }

    // Submit booking
    await page.click('button:has-text("Complete Booking")');

    // Confirmation Screen
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Hair Styling & Cut').first()).toBeVisible();
  });

  test('2.2 Customer Portal Login, Appointments, and Bills View', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.locator('h1')).toContainText('Client Portal');

    // Fill Mobile & 4-digit PIN
    await page.fill('input[type="tel"]', customerMobile);
    await page.fill('input[type="password"]', customerPin);
    await page.click('button:has-text("Sign In to Portal")');

    // Expect client portal dashboard
    await expect(page.locator('text=Welcome back, Amit Trivedi!').or(page.locator('text=Upcoming Appointments'))).toBeVisible({ timeout: 10000 });

    // Verify Tabs: Appointments, Bills, Memberships
    await page.click('button:has-text("Bills")');
    await expect(page.locator('text=Your Digital Salon Invoices')).toBeVisible();

    await page.click('button:has-text("VIP")');
    await expect(page.locator('text=Your VIP Subscriptions & Packages')).toBeVisible();

    // Switch back to Appointments
    await page.click('button:has-text("Appointments")');
    await expect(page.locator('text=Upcoming Appointments')).toBeVisible();
  });
});
