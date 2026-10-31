import { test, expect } from '@playwright/test';
import { normalizeIndianPhone, sendWhatsAppInvoiceReceipt } from '../../src/lib/whatsapp';
import { query } from '../../src/lib/db';
import crypto from 'crypto';

test.describe('Task 6: WhatsApp Cloud API template with PDF document header and delivery status', () => {
  let salonId: string;
  let salonOwnerEmail: string;
  let ownerToken: string;
  let invoiceId: string;
  let invoiceNumber: string;

  test.beforeAll(async () => {
    // Pick an active salon and its owner
    const sRes = await query(
      `SELECT s.id, s.name, u.email 
       FROM salons s 
       JOIN users u ON u.salon_id = s.id 
       WHERE s.is_active = true AND u.role = 'owner'
       LIMIT 1`
    );
    expect(sRes.rows.length).toBeGreaterThan(0);
    salonId = sRes.rows[0].id;
    salonOwnerEmail = sRes.rows[0].email;

    // Create a test customer and invoice
    const token = crypto.randomBytes(16).toString('hex');
    const custRes = await query(
      `INSERT INTO customers (salon_id, name, mobile) 
       VALUES ($1, 'WA Test Customer', '9876543210') RETURNING id`,
      [salonId]
    );
    const customerId = custRes.rows[0].id;

    invoiceNumber = `INV-${new Date().getFullYear()}-WA999`;
    const invRes = await query(
      `INSERT INTO invoices (salon_id, customer_id, number, subtotal, tax_amount, total, receipt_token)
       VALUES ($1, $2, $3, 1000, 180, 1180, $4) RETURNING id`,
      [salonId, customerId, invoiceNumber, token]
    );
    invoiceId = invRes.rows[0].id;
  });

  test.afterAll(async () => {
    if (invoiceId) {
      await query('DELETE FROM invoices WHERE id = $1', [invoiceId]);
    }
  });

  test('6.1 normalizeIndianPhone correctly parses +91, 0-prefix, 10-digit, and flags invalid numbers', () => {
    // 10 digits
    const n1 = normalizeIndianPhone('9876500001');
    expect(n1.valid).toBe(true);
    expect(n1.e164).toBe('+919876500001');
    expect(n1.waId).toBe('919876500001');

    // 11 digits with leading 0
    const n2 = normalizeIndianPhone('09876500001');
    expect(n2.valid).toBe(true);
    expect(n2.e164).toBe('+919876500001');

    // 12 digits with 91 prefix
    const n3 = normalizeIndianPhone('919876500001');
    expect(n3.valid).toBe(true);
    expect(n3.e164).toBe('+919876500001');

    // Formatted with spaces and dashes
    const n4 = normalizeIndianPhone('+91 98765-00001');
    expect(n4.valid).toBe(true);
    expect(n4.e164).toBe('+919876500001');

    // Invalid short number
    const n5 = normalizeIndianPhone('12345');
    expect(n5.valid).toBe(false);
  });

  test('6.2 sendWhatsAppInvoiceReceipt generates unguessable receipt link with PDF header parameters', async () => {
    const unguessableToken = crypto.randomBytes(16).toString('hex');
    const result = await sendWhatsAppInvoiceReceipt({
      salonId,
      salonName: 'Elite Unisex Studio',
      invoiceId,
      invoiceNumber,
      receiptToken: unguessableToken,
      customerName: 'Aarav Patel',
      customerMobile: '9876500001',
      subtotal: 1000,
      taxAmount: 180,
      total: 1180,
    });

    // Receipt URL must use the unguessable token
    expect(result.receiptUrl).toContain(`/b/${unguessableToken}`);

    // If credentials are not in CI/local test env, status must be pending_credentials or failed (never fake sent)
    if (!process.env.WHATSAPP_CLOUD_API_TOKEN) {
      expect(result.status).toBe('pending_credentials');
      expect(result.success).toBe(false);
    }
  });

  test('6.3 /api/billing/whatsapp returns success: true ONLY when status is "sent"', async ({
    request,
  }) => {
    // Perform owner login to obtain session cookie
    const loginRes = await request.post('/api/login', {
      data: {
        email: salonOwnerEmail,
        password: process.env.TEST_OWNER_PASSWORD || 'password123',
      },
    });

    // If login succeeds with valid test credentials
    if (loginRes.status() === 200) {
      const waRes = await request.post('/api/billing/whatsapp', {
        data: {
          invoice_id: invoiceId,
        },
      });

      const body = await waRes.json();

      // In environment without verified live Meta Cloud API credentials,
      // it must return status 422/502 and success: false (NEVER success: true unless status === 'sent')
      if (body.delivery?.status !== 'sent') {
        expect(waRes.status()).not.toBe(200);
        expect(body.success).toBe(false);
        expect(body.status).toBe(body.delivery?.status);
      } else {
        expect(waRes.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.status).toBe('sent');
      }
    }
  });
});

