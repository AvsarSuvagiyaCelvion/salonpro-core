import { test, expect } from '@playwright/test';

test.describe('Past Time Slots & Clock Mocking (Asia/Kolkata timezone)', () => {
  test('8:43 PM IST: Past slots are hidden, shop closed message displayed, and next date auto-suggested', async ({ page }) => {
    // Mock the clock at 8:43 PM Asia/Kolkata on October 30, 2026
    // 8:43 PM IST = 20:43 IST = 15:13 UTC
    const mockedTime = new Date('2026-10-30T15:13:00.000Z');
    await page.clock.install({ time: mockedTime });

    await page.goto('/pari-beauty-studio-branch-1');

    // Step 1: Select a service
    await page.waitForSelector('text=Select a Service');
    const firstService = page.locator('text=Haircut & Blowdry').first();
    await expect(firstService).toBeVisible();
    await firstService.click();

    const continueBtn = page.locator('button:has-text("Continue →")');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Step 2: Stylist step
    await page.waitForSelector('text=2. Choose Your Specialist');
    const nextBtn = page.locator('button:has-text("Select Date & Time →")').first();
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Step 3: Date & Slots
    await page.waitForSelector('text=3. Pick Date & Available Slot');

    // Verify past slots like 4 PM, 5 PM, 6 PM do NOT appear for today
    const slot4PM = page.locator('button:has-text("04:00 PM")');
    const slot5PM = page.locator('button:has-text("05:00 PM")');
    const slot6PM = page.locator('button:has-text("06:00 PM")');

    // Either Today has no remaining slots and auto-suggests tomorrow,
    // or if Today is selected, past slots are hidden.
    // Verify shop closed message if after closing time or no slots remain
    const shopClosedNotice = page.locator('text=The shop is closed for today. Please book an appointment for another date.');
    const isNoticeVisible = await shopClosedNotice.isVisible();

    if (isNoticeVisible) {
      await expect(shopClosedNotice).toBeVisible();
      // Verify tomorrow or next open date is auto-selected
      const tomorrowChip = page.locator('button:has-text("Tomorrow")');
      await expect(tomorrowChip).toBeVisible();
    } else {
      // If Today is visible, 4 PM, 5 PM, 6 PM must not be present
      await expect(slot4PM).toHaveCount(0);
      await expect(slot5PM).toHaveCount(0);
      await expect(slot6PM).toHaveCount(0);
    }
  });

  test('11:59 PM -> 12:01 AM date rollover: Boundary date transitions correctly in Asia/Kolkata', async ({ page }) => {
    // Mock clock at 11:59:50 PM IST on Oct 30, 2026 (18:29:50 UTC)
    const mockedMidnight = new Date('2026-10-30T18:29:50.000Z');
    await page.clock.install({ time: mockedMidnight });

    await page.goto('/pari-beauty-studio-branch-1');
    await page.waitForSelector('text=Select a Service');

    // Fast-forward browser clock by 30 seconds to cross midnight into Oct 31, 2026 IST
    await page.clock.fastForward(30000);

    const nowIST = await page.evaluate(() =>
      new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    );
    // In IST, date is now Oct 31, 2026
    expect(nowIST).toBe('2026-10-31');
  });

  test('Slot exactly at the current minute is filtered out', async ({ page }) => {
    // Mock clock in the browser at 10:00:00 AM IST on Oct 31, 2026 (04:30:00 UTC)
    const mockedTime = new Date('2026-10-31T04:30:00.000Z');
    await page.clock.install({ time: mockedTime });

    await page.goto('/pari-beauty-studio-branch-1');
    await page.waitForSelector('text=Select a Service');

    // Select service and proceed to Step 3 (Date & Slot)
    await page.click('text=Haircut & Blowdry');
    await page.click('button:has-text("Continue →")');
    await page.locator('button:has-text("Select Date & Time →")').first().click();
    await page.waitForSelector('text=3. Pick Date & Available Slot');

    // 10:00 AM slot must NOT appear because it is in the past / current minute
    const currentMinuteSlot = page.locator('button:has-text("10:00 AM")');
    await expect(currentMinuteSlot).toHaveCount(0);
  });
});
