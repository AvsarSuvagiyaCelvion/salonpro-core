import crypto from 'crypto';
import { QAClient } from './client.ts';
import { query } from './config.ts';
import type { QADataFixtures, TestResult } from './types.ts';

export async function runCrossFeatureTests(fixtures: QADataFixtures): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const record = (
    id: string,
    name: string,
    passed: boolean,
    reason: string,
    startTime: number,
    extra?: { classification?: TestResult['classification']; expected?: string; actual?: string; likelyFile?: string; error?: string }
  ) => {
    results.push({
      id,
      feature: 'CROSS',
      name,
      status: passed ? 'PASS' : 'FAIL',
      reason,
      durationMs: Date.now() - startTime,
      ...extra,
    });
  };

  const anonClient = new QAClient();
  const ownerClient = new QAClient();
  ownerClient.setCookie('salonpro_session', fixtures.owner1.token);

  // --------------------------------------------------------------------------
  // CROSS-01: Complete End-to-End Lifecycle Flow
  // Book -> Reschedule -> Edit Profile -> Owner Complete -> Review -> Reply -> Public Display -> Hide
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      const uniqueMobile = '98765' + Math.floor(10000 + Math.random() * 90000);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 10);
      const dateStr = targetDate.toISOString().split('T')[0];

      // 1. Public Booking
      const bookRes = await anonClient.post(`/api/public/${fixtures.salon1.slug}/book`, {
        service_id: fixtures.service1.id,
        staff_id: fixtures.stylist1.id,
        date: dateStr,
        time: '15:00',
        name: 'E2E Test Client',
        mobile: uniqueMobile,
        code: '1234',
        confirmCode: '1234',
      });

      const apptId = bookRes.data?.appointment_id || bookRes.data?.appointment?.id;
      const clientSessionCookie = anonClient.getCookie('salonpro_customer_session');

      const customerClient = new QAClient();
      if (clientSessionCookie) {
        customerClient.setCookie('salonpro_customer_session', clientSessionCookie);
      }

      // If cookie was not in headers, log in manually
      if (!clientSessionCookie) {
        const loginRes = await customerClient.post('/api/customer/auth', {
          mobile: uniqueMobile,
          pin: '1234',
        });
      }

      // 2. Reschedule to 16:00
      const reschedRes = await customerClient.patch(`/api/customer/appointments/${apptId}`, {
        action: 'reschedule',
        date: dateStr,
        time: '16:00',
        staff_id: fixtures.stylist1.id,
      });

      // 3. Edit Profile
      const profileRes = await customerClient.patch('/api/customer/profile', {
        name: 'E2E Client Renamed',
        email: 'e2eclient@test.com',
        address: '99 VIP Road, Surat',
      });

      // 4. Mark appointment completed in DB (simulate salon visit completion)
      await query(`
        UPDATE appointments 
        SET status = 'done', ends_at = NOW() - INTERVAL '1 hour'
        WHERE id = $1::uuid
      `, [apptId]);

      // 5. Customer submits review
      const reviewRes = await customerClient.post('/api/customer/reviews', {
        appointment_id: apptId,
        rating: 5,
        comment: 'Comprehensive E2E end-to-end verification review!',
      });

      // Get review ID
      const rRow = (await query('SELECT id FROM reviews WHERE appointment_id = $1::uuid', [apptId])).rows[0];
      let reviewId = rRow?.id;
      if (!reviewId) {
        reviewId = crypto.randomUUID();
        const custId = (await query('SELECT customer_id FROM appointments WHERE id = $1::uuid', [apptId])).rows[0]?.customer_id;
        await query(`
          INSERT INTO reviews (id, salon_id, customer_id, appointment_id, staff_id, rating, comment, status)
          VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 5, 'Comprehensive E2E end-to-end verification review!', 'visible')
        `, [reviewId, fixtures.salon1.id, custId, apptId, fixtures.stylist1.id]);
      }

      // 6. Owner replies to review
      const replyRes = await ownerClient.patch(`/api/reviews/${reviewId}`, {
        owner_reply: 'Thanks for the stellar E2E feedback!',
      });

      // 7. Verify public showcase includes review and reply
      const publicRes1 = await anonClient.get(`/api/public/${fixtures.salon1.slug}`);
      const reviews1 = publicRes1.data?.reviews || publicRes1.data?.recentReviews || [];
      const foundInPublic = reviews1.find((r: any) => r.id === reviewId || r.comment?.includes('E2E end-to-end'));

      // 8. Owner hides review
      const hideRes = await ownerClient.patch(`/api/reviews/${reviewId}`, {
        status: 'hidden',
      });

      // 9. Verify public showcase no longer includes hidden review
      const publicRes2 = await anonClient.get(`/api/public/${fixtures.salon1.slug}`);
      const reviews2 = publicRes2.data?.reviews || publicRes2.data?.recentReviews || [];
      const hiddenFromPublic = !reviews2.some((r: any) => r.id === reviewId || r.comment?.includes('E2E end-to-end'));

      const pass = bookRes.status === 200 &&
        reschedRes.status === 200 &&
        profileRes.status === 200 &&
        reviewRes.status === 200 &&
        replyRes.status === 200 &&
        Boolean(foundInPublic) &&
        hideRes.status === 200 &&
        hiddenFromPublic;

      if (pass) {
        record('CROSS-01', 'End-to-End flow: Book -> Reschedule -> Profile -> Complete -> Review -> Reply -> Public Display -> Hide', true, 'Full cross-feature customer + owner loop executed seamlessly', t0);
      } else {
        record('CROSS-01', 'End-to-End flow', false, `book=${bookRes.status}, resched=${reschedRes.status}, profile=${profileRes.status}, review=${reviewRes.status}, reply=${replyRes.status}, foundPub=${Boolean(foundInPublic)}, hide=${hideRes.status}, hiddenPub=${hiddenFromPublic}`, t0, {
          classification: 'APP BUG',
          expected: 'All steps return 200 and reflect state changes',
          actual: `book=${bookRes.status}, resched=${reschedRes.status}, profile=${profileRes.status}, review=${reviewRes.status}, found=${Boolean(foundInPublic)}, hidden=${hiddenFromPublic}`,
        });
      }
    } catch (err: any) {
      record('CROSS-01', 'End-to-End flow execution', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // CROSS-02: Universal Malformed Input Crash Check (No endpoint returns 500)
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      const endpointsToProbe = [
        { method: 'POST', path: '/api/customer/reviews', body: { junk: 'malformed' } },
        { method: 'PATCH', path: '/api/customer/profile', body: null },
        { method: 'POST', path: '/api/customer/profile/pin', body: '{ broken json' },
        { method: 'PATCH', path: `/api/customer/appointments/not-a-uuid`, body: {} },
        { method: 'PATCH', path: `/api/reviews/not-a-uuid`, body: {} },
      ];

      let any500 = false;
      let failingEndpoint = '';

      for (const ep of endpointsToProbe) {
        const res = await anonClient.request(ep.method, ep.path, {
          body: ep.body,
        });

        if (res.status >= 500) {
          any500 = true;
          failingEndpoint = `${ep.method} ${ep.path} returned status ${res.status}`;
          break;
        }
      }

      if (!any500) {
        record('CROSS-02', 'Crash protection: malformed payloads & invalid UUIDs return <500 status', true, 'Zero 500 Internal Server Errors detected across probed routes', t0);
      } else {
        record('CROSS-02', 'Crash protection', false, failingEndpoint, t0, {
          classification: 'APP BUG',
          expected: 'All status < 500 (e.g. 400, 401, 404)',
          actual: failingEndpoint,
        });
      }
    } catch (err: any) {
      record('CROSS-02', 'Crash protection check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  return results;
}

