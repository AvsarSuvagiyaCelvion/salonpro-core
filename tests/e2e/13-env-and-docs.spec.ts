import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Task 7: Environment settings, documentation, and cleanup', () => {
  test('7.1 .env.example exists and documents all required variables', () => {
    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);

    const content = fs.readFileSync(envExamplePath, 'utf8');
    expect(content).toContain('DATABASE_URL=');
    expect(content).toContain('JWT_SECRET=');
    expect(content).toContain('NEXT_PUBLIC_APP_URL=');
    expect(content).toContain('NEXT_PUBLIC_SUPPORT_PHONE=');
    expect(content).toContain('NEXT_PUBLIC_SUPPORT_EMAIL=');
    expect(content).toContain('NEXT_PUBLIC_DEFAULT_SALON_NAME=');
    expect(content).toContain('WHATSAPP_CLOUD_API_TOKEN=');
    expect(content).toContain('WHATSAPP_PHONE_NUMBER_ID=');
    expect(content).toContain('ADMIN_EMAIL=');
    expect(content).toContain('ADMIN_PASSWORD=');
  });

  test('7.2 README.md exists and documents system architecture & setup', () => {
    const readmePath = path.resolve(process.cwd(), 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);

    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content).toContain('SalonPro');
    expect(content).toContain('Client Booking');
    expect(content).toContain('Salon Owner & Staff ERP');
    expect(content).toContain('Platform Super-Admin');
    expect(content).toContain('PostgreSQL');
    expect(content).toContain('Playwright');
  });

  test('7.3 Obsolete demo, notes, and checklist markdown files are deleted', () => {
    const cwd = process.cwd();
    expect(fs.existsSync(path.join(cwd, 'DEMO_BUILD_STEPS.md'))).toBe(false);
    expect(fs.existsSync(path.join(cwd, 'DEMO_SPEC.md'))).toBe(false);
    expect(fs.existsSync(path.join(cwd, 'NOTES.md'))).toBe(false);
    expect(fs.existsSync(path.join(cwd, 'TESTING_CHECKLIST.md'))).toBe(false);
  });

  test('7.4 Login and Layout support configurations read from environment variables', () => {
    const loginFilePath = path.resolve(process.cwd(), 'src/app/login/page.tsx');
    const loginContent = fs.readFileSync(loginFilePath, 'utf8');
    expect(loginContent).toContain('process.env.NEXT_PUBLIC_SUPPORT_PHONE');
    expect(loginContent).toContain('process.env.NEXT_PUBLIC_SUPPORT_EMAIL');

    const layoutFilePath = path.resolve(process.cwd(), 'src/app/app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutFilePath, 'utf8');
    expect(layoutContent).toContain('process.env.NEXT_PUBLIC_DEFAULT_SALON_NAME');
  });
});
