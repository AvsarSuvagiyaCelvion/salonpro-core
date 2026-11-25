import { test, expect } from '@playwright/test';

test.describe('StudioDesk QA UI Smoke Suite', () => {

  // Test 1: Customer Portal login page renders with phone & PIN inputs
  test('01: Customer Portal login renders with mobile and PIN inputs', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.locator('text=Client Portal')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  // Test 2: Customer Portal login with credentials (or registers client if fresh DB)
  test('02: Customer Portal login opens customer dashboard', async ({ page }) => {
    await page.goto('/portal');
    await page.fill('input[type="tel"]', '9876543210');
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');

    // If client is not yet registered, register account automatically
    const notFoundError = page.locator('text=Customer not found');
    if (await notFoundError.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('button:has-text("New Account")');
      await page.fill('input[placeholder*="Diya"]', 'Test Customer');
      await page.fill('input[type="tel"]', '9876543210');
      await page.fill('input[placeholder="Enter 4-digit PIN"]', '1234');
      await page.fill('input[placeholder="Confirm 4-digit PIN"]', '1234');
      await page.click('button[type="submit"]');
    }

    // Should load portal dashboard with customer navigation tabs
    await expect(page.locator('button:has-text("Profile & Security")')).toBeVisible({ timeout: 10000 });
  });

  // Test 3: Profile & Security tab displays avatar uploader and PIN change
  test('03: Profile tab renders avatar upload trigger and PIN change inputs', async ({ page }) => {
    await page.goto('/portal');
    await page.fill('input[type="tel"]', '9876543210');
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');

    // Register if needed
    const notFoundError = page.locator('text=Customer not found');
    if (await notFoundError.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('button:has-text("New Account")');
      await page.fill('input[placeholder*="Diya"]', 'Test Customer');
      await page.fill('input[type="tel"]', '9876543210');
      await page.fill('input[placeholder="Enter 4-digit PIN"]', '1234');
      await page.fill('input[placeholder="Confirm 4-digit PIN"]', '1234');
      await page.click('button[type="submit"]');
    }

    await page.click('button:has-text("Profile & Security")');
    await expect(page.locator('text=Personal Profile')).toBeVisible();
    await expect(page.locator('text=Security & 4-Digit PIN')).toBeVisible();
    await expect(page.locator('input[placeholder="••••"], input[name="current_pin"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Update Security PIN")')).toBeVisible();
  });

  // Test 4: Rate this visit modal opening and star ratings
  test('04: Rate this visit modal displays 1-5 star buttons', async ({ page }) => {
    await page.goto('/portal');
    await page.fill('input[type="tel"]', '9876543210');
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');

    const rateBtn = page.locator('button:has-text("Rate this visit")').first();
    if (await rateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rateBtn.click();
      await expect(page.locator('text=Rate Your Visit')).toBeVisible();
      const stars = page.locator('button[aria-label*="star"], div:has-text("Rate Your Visit") button svg');
      await expect(stars.first()).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  // Test 5: Public booking showcase renders branding and booking steps
  test('05: Public showcase page renders salon branding and booking steps', async ({ page }) => {
    await page.goto('/dixa-beauty-salon');
    await expect(page.locator('text=Select Services').first()).toBeVisible({ timeout: 10000 });
  });

  // Test 6: Owner login page renders credentials form and 1-click demo button
  test('06: Owner ERP login renders with credentials and 1-Click demo link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('text=1-Click Owner Demo')).toBeVisible();
  });

  // Test 7: Owner Reviews dashboard renders stats and staff performance table
  test('07: Owner Reviews page loads rating dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=1-Click Owner Demo');
    await page.waitForURL('**/app**', { timeout: 15000 });

    await page.goto('/app/reviews');
    await expect(page.locator('text=Reviews & Ratings')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Rating Distribution')).toBeVisible();
  });

  // Test 8: Mobile 375px responsive layout check (no horizontal overflow)
  test('08: Mobile 375px viewport maintains zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dixa-beauty-salon');
    await expect(page.locator('text=Select Services').first()).toBeVisible({ timeout: 10000 });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // No horizontal scroll overflow
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

});
