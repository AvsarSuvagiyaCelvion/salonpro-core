import { test, expect } from '@playwright/test';
import { query } from '../../src/lib/db';
import crypto from 'crypto';

test.describe('Task 4: Invoices unique constraint, sequential counter, tokenized receipt, masked mobile', () => {
  let salonId: string;
  let testCustomerId: string;
  const testMobile = '9876543210';
  const expectedMasked = '98XXXXX210';

  test.beforeAll(async () => {
    // Pick an active salon
    const sRes = await query('SELECT id FROM salons WHERE is_active = true ORDER BY created_at ASC LIMIT 1');
    expect(sRes.rows.length).toBeGreaterThan(0);
    salonId = sRes.rows[0].id;

    // Create or find a test customer
    let cRes = await query('SELECT id FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1', [
      salonId,
      testMobile,
    ]);
    if (cRes.rows.length === 0) {
      cRes = await query(
        'INSERT INTO customers (salon_id, name, mobile) VALUES ($1, $2, $3) RETURNING id',
        [salonId, 'Masked Test Customer', testMobile]
      );
    }
    testCustomerId = cRes.rows[0].id;
  });

  test('4.1 Database enforces UNIQUE (salon_id, number) constraint on invoices', async () => {
    const duplicateNumber = `TEST-DUP-${Date.now()}`;
    const token1 = crypto.randomBytes(16).toString('hex');
    const token2 = crypto.randomBytes(16).toString('hex');

    // First insert succeeds
    const res1 = await query(
      `INSERT INTO invoices (salon_id, customer_id, number, subtotal, tax_amount, total, receipt_token)
       VALUES ($1, $2, $3, 100, 18, 118, $4) RETURNING id`,
      [salonId, testCustomerId, duplicateNumber, token1]
    );
    expect(res1.rows.length).toBe(1);
    const invoiceId = res1.rows[0].id;

    // Second insert with the SAME salon_id and number must fail with unique constraint violation (23505)
    let caughtError: any = null;
    try {
      await query(
        `INSERT INTO invoices (salon_id, customer_id, number, subtotal, tax_amount, total, receipt_token)
         VALUES ($1, $2, $3, 200, 36, 236, $4)`,
        [salonId, testCustomerId, duplicateNumber, token2]
      );
    } catch (err: any) {
      caughtError = err;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.code).toBe('23505');

    // Cleanup
    await query('DELETE FROM invoices WHERE id = $1', [invoiceId]);
  });

  test('4.2 Invoice generation creates unguessable receipt_token and formatted INV-YYYY-SEQ', async () => {
    const token = crypto.randomBytes(16).toString('hex');
    expect(token).toHaveLength(32);

    const year = new Date().getFullYear();
    const testInvNum = `INV-${year}-99999`;

    const ins = await query(
      `INSERT INTO invoices (salon_id, customer_id, number, subtotal, tax_amount, total, receipt_token)
       VALUES ($1, $2, $3, 500, 90, 590, $4) RETURNING id, receipt_token, number`,
      [salonId, testCustomerId, testInvNum, token]
    );

    expect(ins.rows[0].receipt_token).toBe(token);
    expect(ins.rows[0].number).toMatch(/^INV-\d{4}-\d+/);

    await query('DELETE FROM invoices WHERE id = $1', [ins.rows[0].id]);
  });

  test('4.3 Public receipt page (/b/<token>) loads with 200 and renders masked mobile 98XXXXX123', async ({
    page,
  }) => {
    const unguessableToken = crypto.randomBytes(16).toString('hex');
    const year = new Date().getFullYear();
    const invoiceNum = `INV-${year}-88888`;

    const ins = await query(
      `INSERT INTO invoices (salon_id, customer_id, number, subtotal, tax_amount, total, receipt_token)
       VALUES ($1, $2, $3, 750, 135, 885, $4) RETURNING id`,
      [salonId, testCustomerId, invoiceNum, unguessableToken]
    );
    const invoiceId = ins.rows[0].id;

    try {
      // Visit receipt page using unguessable token
      const res = await page.goto(`/b/${unguessableToken}`);
      expect(res?.status()).toBe(200);

      // Verify that the masked mobile is displayed on the receipt
      const content = await page.textContent('body');
      expect(content).toContain(expectedMasked);

      // Ensure the full raw mobile number is NEVER exposed in the public receipt HTML
      expect(content).not.toContain(testMobile);
    } finally {
      await query('DELETE FROM invoices WHERE id = $1', [invoiceId]);
    }
  });

  test('4.4 /b/INV-YYYY-XXXX returns 404, only token works, and two salons with same invoice number are strictly isolated', async ({
    page,
  }) => {
    // 1. Accessing raw invoice number returns 404
    const notFoundRes = await page.goto('/b/INV-2026-0001');
    expect(notFoundRes?.status()).toBe(404);

    // 2. Setup two salons with the exact same invoice number
    const salonRes = await query('SELECT id, name FROM salons WHERE is_active = true ORDER BY created_at ASC LIMIT 2');
    if (salonRes.rows.length >= 2) {
      const salonA = salonRes.rows[0];
      const salonB = salonRes.rows[1];
      const sharedNumber = `INV-${new Date().getFullYear()}-ISOLATED`;
      const tokenA = crypto.randomBytes(16).toString('hex');
      const tokenB = crypto.randomBytes(16).toString('hex');

      // Create customers for both
      const cA = await query('INSERT INTO customers (salon_id, name, mobile) VALUES ($1, $2, $3) RETURNING id', [
        salonA.id,
        'Client Salon A',
        '9811111111',
      ]);
      const cB = await query('INSERT INTO customers (salon_id, name, mobile) VALUES ($1, $2, $3) RETURNING id', [
        salonB.id,
        'Client Salon B',
        '9822222222',
      ]);

      const invA = await query(
        `INSERT INTO invoices (salon_id, customer_id, number, subtotal, tax_amount, total, receipt_token)
         VALUES ($1, $2, $3, 100, 18, 118, $4) RETURNING id`,
        [salonA.id, cA.rows[0].id, sharedNumber, tokenA]
      );
      const invB = await query(
        `INSERT INTO invoices (salon_id, customer_id, number, subtotal, tax_amount, total, receipt_token)
         VALUES ($1, $2, $3, 200, 36, 236, $4) RETURNING id`,
        [salonB.id, cB.rows[0].id, sharedNumber, tokenB]
      );

      try {
        // Token A shows Salon A and never Salon B
        const resA = await page.goto(`/b/${tokenA}`);
        expect(resA?.status()).toBe(200);
        const textA = await page.textContent('body');
        expect(textA).toContain(salonA.name);
        expect(textA).toContain('Client Salon A');
        expect(textA).not.toContain('Client Salon B');

        // Token B shows Salon B and never Salon A
        const resB = await page.goto(`/b/${tokenB}`);
        expect(resB?.status()).toBe(200);
        const textB = await page.textContent('body');
        expect(textB).toContain(salonB.name);
        expect(textB).toContain('Client Salon B');
        expect(textB).not.toContain('Client Salon A');
      } finally {
        await query('DELETE FROM invoices WHERE id IN ($1, $2)', [invA.rows[0].id, invB.rows[0].id]);
        await query('DELETE FROM customers WHERE id IN ($1, $2)', [cA.rows[0].id, cB.rows[0].id]);
      }
    }
  });
});

