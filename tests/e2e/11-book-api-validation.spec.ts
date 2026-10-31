import { test, expect } from '@playwright/test';
import { query } from '../../src/lib/db';

test.describe('Task 5: Book API server-side validations & atomic customer creation', () => {
  let salonSlug: string;
  let salonId: string;
  let serviceId: string;
  const testMobile = '9825123456';

  test.beforeAll(async () => {
    // Pick an active salon
    const sRes = await query(
      `SELECT id, slug, open_time, close_time, working_days, min_advance_hours, max_advance_days 
       FROM salons WHERE is_active = true ORDER BY created_at ASC LIMIT 1`
    );
    expect(sRes.rows.length).toBeGreaterThan(0);
    salonId = sRes.rows[0].id;
    salonSlug = sRes.rows[0].slug;

    // Pick an active service
    const srvRes = await query(
      `SELECT id, name, duration_min, price FROM services WHERE salon_id = $1 LIMIT 1`,
      [salonId]
    );
    expect(srvRes.rows.length).toBeGreaterThan(0);
    serviceId = srvRes.rows[0].id;

    // Clean test customer
    await query('DELETE FROM customers WHERE salon_id = $1 AND mobile = $2', [salonId, testMobile]);
  });

  test.afterAll(async () => {
    await query('DELETE FROM customers WHERE salon_id = $1 AND mobile = $2', [salonId, testMobile]);
  });

  test('5.1 Rejects past time slot with 400', async ({ request }) => {
    // 2 days in the past
    const pastDate = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    const res = await request.post(`/api/public/${salonSlug}/book`, {
      data: {
        service_id: serviceId,
        staff_id: 'anyone',
        date: pastDate,
        time: '10:00',
        name: 'Past Booking Test',
        mobile: testMobile,
        code: '1234',
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('past');
  });

  test('5.2 Rejects time slot outside salon operating hours with 400', async ({ request }) => {
    // 3 days in the future at 04:00 AM (before opening)
    const futureDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

    const res = await request.post(`/api/public/${salonSlug}/book`, {
      data: {
        service_id: serviceId,
        staff_id: 'anyone',
        date: futureDate,
        time: '04:00',
        name: 'Early Morning Test',
        mobile: testMobile,
        code: '1234',
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('outside salon operating hours');
  });

  test('5.3 Rejects booking beyond max advance days with 400', async ({ request }) => {
    // 90 days in the future (exceeds default 30 days max advance)
    const farDate = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

    const res = await request.post(`/api/public/${salonSlug}/book`, {
      data: {
        service_id: serviceId,
        staff_id: 'anyone',
        date: farDate,
        time: '11:00',
        name: 'Far Future Test',
        mobile: testMobile,
        code: '1234',
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('advance');
  });

  test('5.4 Non-existent service returns 404 without client.release() crash', async ({ request }) => {
    const validFuture = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
    const nonExistentServiceId = '00000000-0000-0000-0000-000000000000';

    const res = await request.post(`/api/public/${salonSlug}/book`, {
      data: {
        service_id: nonExistentServiceId,
        staff_id: 'anyone',
        date: validFuture,
        time: '11:00',
        name: 'Invalid Service Test',
        mobile: testMobile,
        code: '1234',
      },
    });

    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Service not found');
  });

  test('5.5 Valid booking creates customer inside transaction with bcrypt-hashed PIN', async ({
    request,
  }) => {
    // Find next working day for this salon
    const sData = await query('SELECT working_days FROM salons WHERE id = $1', [salonId]);
    const workingDays: number[] = sData.rows[0]?.working_days || [1, 2, 3, 4, 5, 6];

    let targetDateStr = '';
    for (let i = 1; i <= 7; i++) {
      const d = new Date(Date.now() + i * 86400000);
      const iso = d.toISOString().split('T')[0];
      const weekday = new Date(`${iso}T12:00:00Z`).getUTCDay();
      if (workingDays.includes(weekday)) {
        targetDateStr = iso;
        break;
      }
    }
    expect(targetDateStr).not.toBe('');

    const bookingRes = await request.post(`/api/public/${salonSlug}/book`, {
      data: {
        service_id: serviceId,
        staff_id: 'anyone',
        date: targetDateStr,
        time: '14:30',
        name: 'Atomic Customer',
        mobile: testMobile,
        code: '8899',
      },
    });

    expect(bookingRes.status()).toBe(200);
    const data = await bookingRes.json();
    expect(data.success).toBe(true);

    // Verify customer was created with bcrypt-hashed PIN in database
    const custRes = await query('SELECT pin FROM customers WHERE salon_id = $1 AND mobile = $2', [
      salonId,
      testMobile,
    ]);
    expect(custRes.rows.length).toBe(1);
    const storedPin = custRes.rows[0].pin;
    expect(storedPin.startsWith('$2')).toBe(true);

    // Cleanup created appointment
    if (data.appointment?.id) {
      await query('DELETE FROM appointments WHERE id = $1', [data.appointment.id]);
    }
  });
});

