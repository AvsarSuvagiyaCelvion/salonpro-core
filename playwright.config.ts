import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Load .env.local if present so tests and db helpers have access to environment variables
try {
  const envPath = path.resolve(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  // ignore
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
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

