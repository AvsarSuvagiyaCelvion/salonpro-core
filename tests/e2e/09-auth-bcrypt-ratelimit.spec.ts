import { test, expect } from '@playwright/test';
import { query } from '../../src/lib/db';
import bcrypt from 'bcryptjs';

test.describe('Task 3: Customer auth bcrypt PIN, no signup overwrite, and rate limit lockout', () => {
  const testMobile = '9825999888';
  const originalPin = '5678';

  test.beforeAll(async () => {
    // Clean any prior test customer
    await query('DELETE FROM customers WHERE mobile = $1', [testMobile]);
    await query('DELETE FROM auth_rate_limits WHERE key LIKE $1', [`%${testMobile}%`]);
  });

  test.afterAll(async () => {
    await query('DELETE FROM customers WHERE mobile = $1', [testMobile]);
    await query('DELETE FROM auth_rate_limits WHERE key LIKE $1', [`%${testMobile}%`]);
  });

  test('3.1 Customer signup creates account with bcrypt-hashed PIN', async ({ request }) => {
    const signupRes = await request.post('/api/customer/auth', {
      data: {
        action: 'signup',
        name: 'Bcrypt Customer',
        mobile: testMobile,
        pin: originalPin,
      },
    });

    expect(signupRes.status()).toBe(200);
    const body = await signupRes.json();
    expect(body.success).toBe(true);

    // Verify in database that PIN is stored as a bcrypt hash (starts with $2)
    const dbCust = await query('SELECT pin FROM customers WHERE mobile = $1', [testMobile]);
    expect(dbCust.rows.length).toBe(1);
    const storedHash = dbCust.rows[0].pin;
    expect(storedHash.startsWith('$2')).toBe(true);

    // Verify bcrypt matches the original PIN
    const isMatch = await bcrypt.compare(originalPin, storedHash);
    expect(isMatch).toBe(true);
  });

  test('3.2 Customer signup for existing mobile must NOT overwrite PIN (requires login)', async ({ request }) => {
    const maliciousAttempt = await request.post('/api/customer/auth', {
      data: {
        action: 'signup',
        name: 'Overwriter Attacker',
        mobile: testMobile,
        pin: '9999', // Different PIN trying to overwrite original
      },
    });

    // Must return 409 Conflict
    expect(maliciousAttempt.status()).toBe(409);
    const body = await maliciousAttempt.json();
    expect(body.error).toContain('already exists');

    // Confirm DB PIN was NOT altered
    const dbCust = await query('SELECT pin FROM customers WHERE mobile = $1', [testMobile]);
    const storedHash = dbCust.rows[0].pin;
    const isOriginalPinStillValid = await bcrypt.compare(originalPin, storedHash);
    expect(isOriginalPinStillValid).toBe(true);
  });

  test('3.3 Customer login enforces rate limiting and lockout after repeated failed attempts', async ({ request }) => {
    // Attempt 5 incorrect PIN logins
    for (let i = 1; i <= 4; i++) {
      const res = await request.post('/api/customer/auth', {
        data: {
          action: 'login',
          mobile: testMobile,
          pin: '0000', // Wrong PIN
        },
      });
      expect(res.status()).toBe(401);
    }

    // 5th failed attempt should trigger lockout
    const fifthRes = await request.post('/api/customer/auth', {
      data: {
        action: 'login',
        mobile: testMobile,
        pin: '0000',
      },
    });
    expect(fifthRes.status()).toBe(429);
    const body = await fifthRes.json();
    expect(body.error).toContain('locked');
  });

  test('3.4 Owner and Admin login enforce rate limiting lockout on repeated bad credentials', async ({ request }) => {
    const randomBadEmail = `fake-owner-${Date.now()}@example.com`;

    // 5 failed attempts
    for (let i = 1; i <= 4; i++) {
      const res = await request.post('/api/login', {
        data: {
          email: randomBadEmail,
          password: 'WrongPassword!',
        },
      });
      expect(res.status()).toBe(401);
    }

    const fifthRes = await request.post('/api/login', {
      data: {
        email: randomBadEmail,
        password: 'WrongPassword!',
      },
    });
    expect(fifthRes.status()).toBe(429);
    const body = await fifthRes.json();
    expect(body.error).toContain('locked');
  });
});
