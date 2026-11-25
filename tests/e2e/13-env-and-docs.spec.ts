import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Task 7: Environment settings, documentation, and cleanup', () => {
  test('7.1 .env.example exists and documents all required variables', () => {
    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);

    const content = fs.readFileSync(envExamplePath, 'utf8');
    expect(content).toContain('DATABASE_URL=');
    expect(content).toContain('SESSION_SECRET=');
    expect(content).not.toContain('JWT_SECRET=');
    expect(content).toContain('NEXT_PUBLIC_APP_URL=');
    expect(content).toContain('NEXT_PUBLIC_SUPPORT_PHONE=');
    expect(content).toContain('NEXT_PUBLIC_SUPPORT_EMAIL=');
    expect(content).toContain('NEXT_PUBLIC_DEFAULT_SALON_NAME=');
    expect(content).toContain('WHATSAPP_CLOUD_API_TOKEN=');
    expect(content).toContain('WHATSAPP_PHONE_NUMBER_ID=');
    expect(content).toContain('ADMIN_EMAIL=');
    expect(content).toContain('ADMIN_PASSWORD=');
    expect(content).toContain('DEMO_OWNER_EMAIL=');
    expect(content).toContain('DEMO_OWNER_PASSWORD=');
    expect(content).toContain('ALLOW_WIPE=');
  });

  test('7.2 README.md exists and documents system architecture & setup with SESSION_SECRET', () => {
    const readmePath = path.resolve(process.cwd(), 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);

    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content).toContain('StudioDesk');
    expect(content).toContain('SESSION_SECRET');
    expect(content).not.toContain('JWT_SECRET');
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

  test('7.5 scripts/seed-demo.js exists and enforces safety refusal unless DATABASE_URL contains demo or ALLOW_WIPE=true', () => {
    const seedScriptPath = path.resolve(process.cwd(), 'scripts', 'seed-demo.js');
    expect(fs.existsSync(seedScriptPath)).toBe(true);

    const scriptContent = fs.readFileSync(seedScriptPath, 'utf8');
    expect(scriptContent).toContain('ALLOW_WIPE');
    expect(scriptContent).toContain("dbUrl.toLowerCase().includes('demo')");
    expect(scriptContent).toContain('Glow Studio');
    expect(scriptContent).toContain('10:00:00');
    expect(scriptContent).toContain('19:00:00');
    expect(scriptContent).toContain('DEMO_OWNER_EMAIL');
    expect(scriptContent).toContain('DEMO_OWNER_PASSWORD');
    expect(scriptContent).toContain('receipt_token');
  });
});

