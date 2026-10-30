import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('STEP 5: UI/UX Responsive & Overflow Detection Across All Viewports', () => {
  const routesToAudit = [
    { name: 'landing', url: '/' },
    { name: 'login', url: '/login' },
    { name: 'register-salon', url: '/register-salon' },
    { name: 'customer-booking-branch-1', url: '/pari-beauty-studio-branch-1' },
    { name: 'customer-booking-branch-2', url: '/pari-beauty-studio-branch-2' },
    { name: 'customer-portal', url: '/portal' },
    { name: 'admin-login', url: '/admin/login' },
  ];

  for (const route of routesToAudit) {
    test(`Verify No Horizontal Overflow on ${route.name}`, async ({ page }, testInfo) => {
      await page.goto(route.url);
      await page.waitForLoadState('networkidle');

      // Programmatically check if any element causes horizontal scroll
      const overflowStatus = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const hasBodyOverflow = scrollWidth > docWidth;

        // Search for specific overflowing elements
        const overflowingElements: string[] = [];
        const allElements = document.querySelectorAll('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          if (el.scrollWidth > docWidth + 2 && !el.classList.contains('overflow-x-auto')) {
            overflowingElements.push(`${el.tagName.toLowerCase()}.${el.className.slice(0, 30)}`);
          }
        }

        return {
          docWidth,
          scrollWidth,
          hasBodyOverflow,
          overflowingElements: overflowingElements.slice(0, 5),
        };
      });

      // Take responsive screenshot
      const projectName = testInfo.project.name.replace(/\s+/g, '-').toLowerCase();
      const screenshotPath = path.join('tests', 'screenshots', projectName, `${route.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // Expect zero body overflow
      expect(
        overflowStatus.hasBodyOverflow,
        `Page ${route.url} has horizontal overflow! scrollWidth=${overflowStatus.scrollWidth} > clientWidth=${overflowStatus.docWidth}. Elements: ${overflowStatus.overflowingElements.join(', ')}`
      ).toBe(false);
    });
  }
});

