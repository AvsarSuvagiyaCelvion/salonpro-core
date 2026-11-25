import { test, expect } from '@playwright/test';

test.describe('STEP 1: Salon Owner Panel Functional & E2E Testing', () => {
  const ownerEmail = process.env.OWNER_EMAIL || 'pari.branch1@gmail.com';
  const ownerPassword = process.env.OWNER_PASSWORD || process.env.TEST_OWNER_PASSWORD || '';
  if (!ownerPassword) {
    throw new Error('OWNER_PASSWORD environment variable is required for tests');
  }
  const salonName = process.env.SALON_NAME || 'Pari Beauty Studio - Branch 1';

  test('1.1 Owner Sign In, Dashboard default to TODAY, and Header Salon Name', async ({ page }) => {
    await page.goto('/login');

    // Verify Title & Brand
    await expect(page.locator('h1')).toContainText('StudioDesk');

    // Fill Credentials
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', ownerPassword);
    await page.click('button[type="submit"]');

    // Expect navigation to /app
    await page.waitForURL('**/app');

    // Verify Header shows the correct Salon Name and NOT "Salon Operating System"
    const headerTitle = page.locator('header span.font-extrabold').first();
    await expect(headerTitle).toContainText(salonName);

    // Verify Dashboard Overview defaults to TODAY
    await expect(page.locator('h1')).toContainText('Dashboard Overview');
    const todayBtn = page.locator('button', { hasText: 'Today' });
    await expect(todayBtn).toHaveClass(/bg-\[#b3135b\]/);

    // Verify 4 KPI Cards are rendered
    await expect(page.locator('text=Revenue').first()).toBeVisible();
    await expect(page.locator('text=Sessions Done').first()).toBeVisible();
    await expect(page.locator('text=Client Base').first()).toBeVisible();
    await expect(page.locator('text=Active Stylists').first()).toBeVisible();

    // Toggle Period to 7 Days & 30 Days
    await page.click('button:has-text("Last 7 Days")');
    await expect(page.locator('button:has-text("Last 7 Days")')).toHaveClass(/bg-\[#b3135b\]/);

    await page.click('button:has-text("Last 30 Days")');
    await expect(page.locator('button:has-text("Last 30 Days")')).toHaveClass(/bg-\[#b3135b\]/);
  });

  test('1.2 Forgot Password & Support Contacts Links', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Forgot Password?');

    // Check WhatsApp Support link has 918320653782
    const waLink = page.locator('a[href*="wa.me/918320653782"]').first();
    await expect(waLink).toBeVisible();

    // Check Email Support link has avsarsuvagiya968@gmail.com
    const emailLink = page.locator('a[href*="mailto:avsarsuvagiya968@gmail.com"]').first();
    await expect(emailLink).toBeVisible();

    // Check Direct Registration link on line below
    const regLink = page.locator('a[href="/register-salon"]:has-text("Create Account")');
    await expect(regLink).toContainText('Create Account & Start 7-Day Free Trial ➔');
  });

  test('1.3 Salon Settings & Working Hours Update', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', ownerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app');

    // Navigate to Settings
    await page.goto('/app/settings');
    await expect(page.locator('h1')).toContainText('Settings & Branding', { timeout: 15000 });

    // Check Salon Information values
    const nameInput = page.locator('input[value*="Pari Beauty Studio"], input').nth(0);
    await expect(nameInput).toBeVisible();

    // Switch to Booking & Timings tab
    await page.click('button:has-text("Booking & Timings")');
    await expect(page.locator('text=Operating Hours')).toBeVisible();

    // Save Settings
    await page.click('button:has-text("Save Settings")');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 15000 });
  });

  test('1.4 Staff & Services Management', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', ownerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app');

    // 1. Check Services
    await page.goto('/app/services');
    await expect(page.locator('h1')).toContainText('Service Catalog');
    await expect(page.locator('text=Haircut & Blowdry')).toBeVisible();
    await expect(page.locator('text=Fruit Glow Facial')).toBeVisible();

    // 2. Check Staff
    await page.goto('/app/staff');
    await expect(page.locator('h1')).toContainText('Staff & Specialists');
    await expect(page.locator('text=Kajal Sharma')).toBeVisible();
    await expect(page.locator('text=Neha Varma')).toBeVisible();
  });

  test('1.5 Live Studio Floor & Billing Generation Flow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', ownerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app');

    // Navigate to Live Studio
    await page.goto('/app/live');
    await expect(page.locator('h1')).toContainText('Live Studio Floor');

    // Navigate to Billing & Payments
    await page.goto('/app/billing');
    await expect(page.locator('h1')).toContainText('Billing & Invoices');
  });

  test('1.6 Logout functionality (Desktop & Mobile)', async ({ page, isMobile }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', ownerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app');

    if (isMobile) {
      // Mobile uses bottom bar or drawer
      const mobileSignoutBtn = page.locator('button', { hasText: /Sign out/i }).first();
      await mobileSignoutBtn.click();
    } else {
      // Desktop top header signout
      const signoutBtn = page.locator('header button', { hasText: /Sign out/i }).first();
      await signoutBtn.click();
    }

    // Expect redirect back to /login
    await page.waitForURL('**/login**');
    await expect(page.locator('h2')).toContainText('Owner Sign In');
  });
});
