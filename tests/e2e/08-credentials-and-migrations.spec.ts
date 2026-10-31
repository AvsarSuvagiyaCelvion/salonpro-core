import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Task 2: Hardcoded credentials removal and env configuration', () => {
  test('migration 006 does not contain hardcoded owner credentials or passwords', () => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '006_users_and_tenant_auth.sql');
    if (fs.existsSync(migrationPath)) {
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content).not.toContain('avsarsuvagiya968@gmail.com');
      expect(content).not.toContain('Av$@r2136');
      expect(content).not.toContain('crypt(');
    }
  });

  test('scripts/wipe-fake-data.js reads admin credentials from process.env', () => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'wipe-fake-data.js');
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('process.env.ADMIN_EMAIL');
    expect(content).toContain('process.env.ADMIN_PASSWORD');
    expect(content).not.toContain("'Admin@123'");
  });

  test('E2E test files use environment variables with clean fallback', () => {
    const testFiles = [
      'tests/e2e/01-salon-owner-flow.spec.ts',
      'tests/e2e/03-admin-platform-flow.spec.ts',
      'tests/e2e/04-real-world-and-security.spec.ts',
    ];

    for (const tf of testFiles) {
      const content = fs.readFileSync(path.join(process.cwd(), tf), 'utf8');
      expect(content).toContain('process.env.');
    }
  });
});
