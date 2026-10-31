import { test, expect } from '@playwright/test';
import { getAvailableSlots } from '../../src/lib/slots';

test.describe('Task 1: Weekday computation using UTC noon and working_days match', () => {
  test('all 7 weekdays (Sun to Sat) map accurately to working_days [0, 1, 2, 3, 4, 5, 6]', async () => {
    // Reference consecutive 7 days from Sunday to Saturday:
    // 2026-11-01 is Sunday (0)
    // 2026-11-02 is Monday (1)
    // 2026-11-03 is Tuesday (2)
    // 2026-11-04 is Wednesday (3)
    // 2026-11-05 is Thursday (4)
    // 2026-11-06 is Friday (5)
    // 2026-11-07 is Saturday (6)
    const testDays = [
      { date: '2026-11-01', expectedDay: 0, name: 'Sunday' },
      { date: '2026-11-02', expectedDay: 1, name: 'Monday' },
      { date: '2026-11-03', expectedDay: 2, name: 'Tuesday' },
      { date: '2026-11-04', expectedDay: 3, name: 'Wednesday' },
      { date: '2026-11-05', expectedDay: 4, name: 'Thursday' },
      { date: '2026-11-06', expectedDay: 5, name: 'Friday' },
      { date: '2026-11-07', expectedDay: 6, name: 'Saturday' },
    ];

    for (const d of testDays) {
      const computedUTCDay = new Date(`${d.date}T12:00:00Z`).getUTCDay();
      expect(computedUTCDay, `${d.date} (${d.name}) must compute to UTC day ${d.expectedDay}`).toBe(d.expectedDay);
    }
  });

  test('Slots API marks closed/open correctly across all 7 weekdays based on salon working_days', async ({ request }) => {
    // Query slots API for Pari Beauty Studio Branch 1 across all 7 days
    const salonSlug = 'pari-beauty-studio-branch-1';
    const salonRes = await request.get(`/api/public/${salonSlug}`);
    const salonData = await salonRes.json();
    const serviceId = salonData.services[0].id;
    const workingDays: number[] = salonData.salon.working_days || [1, 2, 3, 4, 5, 6, 0];

    // Check each of the 7 days
    const dates = [
      '2026-11-01', // Sun (0)
      '2026-11-02', // Mon (1)
      '2026-11-03', // Tue (2)
      '2026-11-04', // Wed (3)
      '2026-11-05', // Thu (4)
      '2026-11-06', // Fri (5)
      '2026-11-07', // Sat (6)
    ];

    for (const dt of dates) {
      const dayNum = new Date(`${dt}T12:00:00Z`).getUTCDay();
      const isExpectedClosed = !workingDays.includes(dayNum);

      const res = await request.get(`/api/public/${salonSlug}/slots?service_id=${serviceId}&date=${dt}`);
      const data = await res.json();
      expect(data.isClosedDay).toBe(isExpectedClosed);
      if (isExpectedClosed) {
        expect(data.slots.length).toBe(0);
      } else {
        expect(data.slots.length).toBeGreaterThan(0);
      }
    }
  });
});

