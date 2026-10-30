import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'Desktop 1920x1080',
      use: {
        viewport: { width: 1920, height: 1080 },
        browserName: 'chromium',
      },
    },
    {
      name: 'Laptop 1366x768',
      use: {
        viewport: { width: 1366, height: 768 },
        browserName: 'chromium',
      },
    },
    {
      name: 'Tablet 768x1024',
      use: {
        viewport: { width: 768, height: 1024 },
        browserName: 'chromium',
      },
    },
    {
      name: 'Mobile 375x812',
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        browserName: 'chromium',
      },
    },
    {
      name: 'Mobile 360x640',
      use: {
        viewport: { width: 360, height: 640 },
        isMobile: true,
        hasTouch: true,
        browserName: 'chromium',
      },
    },
  ],
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
