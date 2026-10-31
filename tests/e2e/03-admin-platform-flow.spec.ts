import { test, expect } from '@playwright/test';

test.describe('STEP 3: Admin & Platform Panel Testing', () => {
  const adminEmail = process.env.ADMIN_EMAIL || '';
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required for tests');
  }

  test('3.1 Super Admin Sign In, Platform Overview, and Global Metrics', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('h1')).toContainText('Super Admin Portal');

    // Sign In
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // Expect navigation to /admin
    await page.waitForURL('**/admin');
    await expect(page.locator('h1')).toContainText('Main Admin Dashboard');

    // Verify Master Admin Top Bar
    await expect(page.locator('text=Master Platform Admin').first()).toBeVisible();

    // Verify Platform Metric Cards
    await expect(page.locator('text=Total Salons').first()).toBeVisible();
    await expect(page.locator('text=Gross Platform Volume').first()).toBeVisible();
    await expect(page.locator('text=Registered Clients').first()).toBeVisible();
  });

  test('3.2 Salons Directory Management (Pari Beauty Studio Branches)', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');

    // Go to Salons
    await page.goto('/admin/salons');
    await expect(page.locator('h1')).toContainText('Tenant Workspaces & Subdomains');

    // Check that both branches are listed
    await expect(page.locator('text=Pari Beauty Studio - Branch 1')).toBeVisible();
    await expect(page.locator('text=Pari Beauty Studio - Branch 2')).toBeVisible();
  });

  test('3.3 Subscription Plans & Pricing Management', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');

    // Go to Plans
    await page.goto('/admin/plans');
    await expect(page.locator('h1')).toContainText('Subscription Plans');

    // Verify standard plans exist
    await expect(page.locator('text=Basic').first()).toBeVisible();
    await expect(page.locator('text=Pro').first()).toBeVisible();
    await expect(page.locator('text=Premium').first()).toBeVisible();
  });

  test('3.4 Registered Owners & Staff Directory', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');

    // Go to Owners
    await page.goto('/admin/owners');
    await expect(page.locator('h1')).toContainText('Owners & Staff Directory');
    await expect(page.locator('text=pari.branch1@gmail.com').or(page.locator('text=Pooja Patel'))).toBeVisible();
  });
});
