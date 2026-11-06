import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { parseEnvFile } from '../config.ts';

const testEnv = parseEnvFile(path.join(process.cwd(), '.env.test'));
const BASE_URL = process.env.BASE_URL || testEnv.BASE_URL || 'http://localhost:3100';

export default defineConfig({
  testDir: './',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'npx next start -p 3100',
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: true,
    timeout: 35000,
  },
  projects: [
    {
      name: 'Smoke Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});

