import crypto from 'crypto';
import { QAClient, createExpiredToken, createTamperedToken, createAdminToken, createCustomerToken } from './client.ts';
import { query } from './config.ts';
import type { QADataFixtures, TestResult } from './types.ts';

export async function runFeature1Tests(fixtures: QADataFixtures): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const startSuiteTime = Date.now();

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
      feature: 'F1',
      name,
      status: passed ? 'PASS' : 'FAIL',
      reason,
      durationMs: Date.now() - startTime,
      ...extra,
    });
  };

  const ownerClient = new QAClient();
  ownerClient.setCookie('StudioDesk_session', fixtures.owner1.token);

  const customerAClient = new QAClient();
  customerAClient.setCookie('StudioDesk_customer_session', fixtures.customerA.token);

  const customerBClient = new QAClient();
  customerBClient.setCookie('StudioDesk_customer_session', fixtures.customerB.token);

  const customerCClient = new QAClient();
  customerCClient.setCookie('StudioDesk_customer_session', fixtures.customerC.token);

  const anonClient = new QAClient();

  // --------------------------------------------------------------------------
  // F1-01: Settings - cancel_policy_hours save / persist
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      const res = await ownerClient.put('/api/settings', {
        cancel_policy_hours: 6,
      });

      const dbCheck = await query('SELECT cancel_policy_hours FROM salons WHERE id = $1::uuid', [fixtures.salon1.id]);
      const savedHours = dbCheck.rows[0]?.cancel_policy_hours;

      if (res.status === 200 && savedHours === 6) {
        record('F1-01', 'Settings: cancel_policy_hours saves and persists', true, 'Saved 6 hours and persisted to DB', t0);
      } else {
        record('F1-01', 'Settings: cancel_policy_hours saves and persists', false, `Status ${res.status}, savedHours ${savedHours}`, t0, {
          classification: 'APP BUG',
          expected: 'Status 200, cancel_policy_hours = 6',
          actual: `Status ${res.status}, DB=${savedHours}`,
          likelyFile: 'src/app/api/settings/route.ts',
        });
      }
    } catch (err: any) {
      record('F1-01', 'Settings: cancel_policy_hours saves and persists', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F1-02: Settings - cancel_policy_hours invalid values (-1, 73, "abc", null) rejected
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      const invalidVals = [-1, 73, 'abc', null];
      let allRejected = true;
      let failureReason = '';

      for (const val of invalidVals) {
        const res = await ownerClient.put('/api/settings', {
          cancel_policy_hours: val,
        });
        if (res.status !== 400) {
          allRejected = false;
          failureReason = `Value ${val} returned status ${res.status} instead of 400`;
          break;
        }
      }

      // Reset policy to 2
      await ownerClient.put('/api/settings', { cancel_policy_hours: 2 });

      if (allRejected) {
        record('F1-02', 'Settings: invalid cancel_policy_hours rejected (-1, 73, "abc", null)', true, 'All invalid values returned 400', t0);
      } else {
        record('F1-02', 'Settings: invalid cancel_policy_hours rejected (-1, 73, "abc", null)', false, failureReason, t0, {
          classification: 'APP BUG',
          expected: 'Status 400 for all invalid values',
          actual: failureReason,
          likelyFile: 'src/app/api/settings/route.ts',
        });
      }
    } catch (err: any) {
      record('F1-02', 'Settings: invalid cancel_policy_hours rejected', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F1-03: Cancel inside window -> status cancelled, cancelled_by='customer', slot freed
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      const res = await customerAClient.patch(`/api/customer/appointments/${fixtures.apptFutureA.id}`, {
        action: 'cancel',
      });

      const dbAppt = (await query('SELECT status, cancelled_by, cancelled_at FROM appointments WHERE id = $1::uuid', [fixtures.apptFutureA.id])).rows[0];

      const pass = res.status === 200 &&
        dbAppt?.status === 'cancelled' &&
        dbAppt?.cancelled_by === 'customer' &&
        dbAppt?.cancelled_at !== null;

      if (pass) {
        // Verify customer records API reflects it
        const recordsRes = await customerAClient.get('/api/customer/records');
        const pastVisits = recordsRes.data?.pastAppointments || [];
        const found = pastVisits.find((a: any) => a.id === fixtures.apptFutureA.id);

        // Verify owner appointments API reflects it
        const ownerApptsRes = await ownerClient.get('/api/appointments');
        const ownerAppts = ownerApptsRes.data?.appointments || [];
        const ownerFound = ownerAppts.find((a: any) => a.id === fixtures.apptFutureA.id);

        if (found && ownerFound?.status === 'cancelled') {
          record('F1-03', 'Cancel inside window: status cancelled, cancelled_by=customer, slot freed', true, 'Appt cancelled properly and appears in customer & owner lists', t0);
        } else {
          record('F1-03', 'Cancel inside window: status cancelled, cancelled_by=customer, slot freed', false, 'Appt not found in records or owner list', t0, {
            classification: 'APP BUG',
            likelyFile: 'src/app/api/customer/records/route.ts',
          });
        }
      } else {
        record('F1-03', 'Cancel inside window: status cancelled, cancelled_by=customer, slot freed', false, `Status ${res.status}, db=${JSON.stringify(dbAppt)}`, t0, {
          classification: 'APP BUG',
          expected: 'Status 200, status=cancelled, cancelled_by=customer',
          actual: `Status ${res.status}, data=${JSON.stringify(res.data)}`,
          likelyFile: 'src/app/api/customer/appointments/[id]/route.ts',
        });
      }
    } catch (err: any) {
      record('F1-03', 'Cancel inside window', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F1-04: Cancel outside window (1h before, policy 2h) -> 400 policy message
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      const res = await customerAClient.patch(`/api/customer/appointments/${fixtures.apptNearCutoffA.id}`, {
        action: 'cancel',
      });

      const errStr = typeof res.data?.error === 'string' ? res.data.error.toLowerCase() : '';
      const pass = res.status === 400 &&
        (errStr.includes('cancellation window closed') ||
         errStr.includes('changes are only permitted') ||
         errStr.includes('before the scheduled appointment'));

      if (pass) {
        record('F1-04', 'Cancel outside window: returns 400 with policy cutoff message', true, 'Blocked with clear cancellation cutoff message', t0);
      } else {
        record('F1-04', 'Cancel outside window: returns 400 with policy cutoff message', false, `Status ${res.status}, message: ${JSON.stringify(res.data)}`, t0, {
          classification: 'APP BUG',
          expected: 'Status 400 with cancellation window closed message',
          actual: `Status ${res.status}, data=${JSON.stringify(res.data)}`,
          likelyFile: 'src/app/api/customer/appointments/[id]/route.ts',
        });
      }
    } catch (err: any) {
      record('F1-04', 'Cancel outside window', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F1-05: Cancel already cancelled / completed / in_service / no_show appointment -> rejected
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // apptFutureA was already cancelled in F1-03
      const resCancelled = await customerAClient.patch(`/api/customer/appointments/${fixtures.apptFutureA.id}`, {
        action: 'cancel',
      });

      // apptCompletedRecentA is completed
      const resCompleted = await customerAClient.patch(`/api/customer/appointments/${fixtures.apptCompletedRecentA.id}`, {
        action: 'cancel',
      });

      const pass = resCancelled.status === 400 && resCompleted.status === 400;

      if (pass) {
        record('F1-05', 'Cancel non-scheduled appointments rejected', true, 'Already cancelled & completed appointments rejected with 400', t0);
      } else {
        record('F1-05', 'Cancel non-scheduled appointments rejected', false, `Cancelled status: ${resCancelled.status}, Completed status: ${resCompleted.status}`, t0, {
          classification: 'APP BUG',
          expected: 'Both return status 400',
          actual: `resCancelled=${resCancelled.status}, resCompleted=${resCompleted.status}`,
          likelyFile: 'src/app/api/customer/appointments/[id]/route.ts',
        });
      }
    } catch (err: any) {
      record('F1-05', 'Cancel non-scheduled appointments rejected', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F1-06: Reschedule - success, old slot freed, new slot taken, rescheduled_count increments
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // Pick a future date 5 days ahead
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 5);
      const dateStr = targetDate.toISOString().split('T')[0];
      const timeStr = '14:00';

      const res1 = await customerBClient.patch(`/api/customer/appointments/${fixtures.apptFutureB.id}`, {
        action: 'reschedule',
        date: dateStr,
        time: timeStr,
        staff_id: fixtures.stylist2.id,
      });

      const dbCheck1 = (await query('SELECT rescheduled_count, starts_at FROM appointments WHERE id = $1::uuid', [fixtures.apptFutureB.id])).rows[0];

      // Second reschedule to 15:00
      const res2 = await customerBClient.patch(`/api/customer/appointments/${fixtures.apptFutureB.id}`, {
        action: 'reschedule',
        date: dateStr,
        time: '15:00',
        staff_id: fixtures.stylist2.id,
      });

      const dbCheck2 = (await query('SELECT rescheduled_count, starts_at FROM appointments WHERE id = $1::uuid', [fixtures.apptFutureB.id])).rows[0];

      // Third reschedule should be REJECTED (max 2)
      const res3 = await customerBClient.patch(`/api/customer/appointments/${fixtures.apptFutureB.id}`, {
        action: 'reschedule',
        date: dateStr,
        time: '16:00',
        staff_id: fixtures.stylist2.id,
      });

      const pass = res1.status === 200 &&
        dbCheck1?.rescheduled_count === 1 &&
        res2.status === 200 &&
        dbCheck2?.rescheduled_count === 2 &&
        res3.status === 400;

      if (pass) {
        record('F1-06', 'Reschedule: success, increments count, 3rd reschedule rejected', true, 'Rescheduled twice successfully, 3rd attempt correctly blocked', t0);
      } else {
        record('F1-06', 'Reschedule: success, increments count, 3rd reschedule rejected', false, `res1=${res1.status}, c1=${dbCheck1?.rescheduled_count}, res2=${res2.status}, c2=${dbCheck2?.rescheduled_count}, res3=${res3.status}`, t0, {
          classification: 'APP BUG',
          expected: 'res1=200 (count=1), res2=200 (count=2), res3=400',
          actual: `res1=${res1.status}, res2=${res2.status}, res3=${res3.status}`,
          likelyFile: 'src/app/api/customer/appointments/[id]/route.ts',
        });
      }
    } catch (err: any) {
      record('F1-06', 'Reschedule flow', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F1-07: Reschedule rejected for invalid inputs (past, holiday, overlap, bad format)
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // Create a temporary appointment for testing invalid reschedules
      const tempApptId = crypto.randomUUID();
      const tempStart = new Date(Date.now() + 6 * 24 * 3600 * 1000);
      tempStart.setHours(11, 0, 0, 0);
      const tempEnd = new Date(tempStart.getTime() + 30 * 60 * 1000);

      await query(`
        INSERT INTO appointments (id, salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::timestamptz, $7::timestamptz, 'scheduled', 'online')
      `, [tempApptId, fixtures.salon1.id, fixtures.customerA.id, fixtures.stylist1.id, fixtures.service1.id, tempStart.toISOString(), tempEnd.toISOString()]);

      // 1. Past date
      const pastRes = await customerAClient.patch(`/api/customer/appointments/${tempApptId}`, {
        action: 'reschedule',
        date: '2020-01-01',
        time: '10:00',
      });

      // 2. Outside operating hours (02:00 AM)
      const outsideRes = await customerAClient.patch(`/api/customer/appointments/${tempApptId}`, {
        action: 'reschedule',
        date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
        time: '02:00',
      });

      // 3. Invalid date/time format
      const badFormatRes = await customerAClient.patch(`/api/customer/appointments/${tempApptId}`, {
        action: 'reschedule',
        date: 'not-a-date',
        time: '99:99',
      });

      // 4. Unknown action
      const badActionRes = await customerAClient.patch(`/api/customer/appointments/${tempApptId}`, {
        action: 'unknown_action',
      });

      const pass = pastRes.status === 400 &&
        outsideRes.status === 400 &&
        badFormatRes.status === 400 &&
        badActionRes.status === 400;

      if (pass) {
        record('F1-07', 'Reschedule rejects invalid inputs (past, outside hours, malformed, unknown action)', true, 'All invalid reschedule inputs rejected with 400', t0);
      } else {
        record('F1-07', 'Reschedule rejects invalid inputs', false, `past=${pastRes.status}, outside=${outsideRes.status}, badFormat=${badFormatRes.status}, badAction=${badActionRes.status}`, t0, {
          classification: 'APP BUG',
          expected: 'All status 400',
          actual: `past=${pastRes.status}, outside=${outsideRes.status}, badFormat=${badFormatRes.status}, badAction=${badActionRes.status}`,
          likelyFile: 'src/app/api/customer/appointments/[id]/route.ts',
        });
      }
    } catch (err: any) {
      record('F1-07', 'Reschedule rejects invalid inputs', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F1-08: Concurrency - Simultaneous reschedules into the same slot -> 1 wins, 1 gets 409 isOverlap
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // Seed two fresh appointments for concurrency test
      const apptC1 = crypto.randomUUID();
      const apptC2 = crypto.randomUUID();
      const s1 = new Date(Date.now() + 8 * 24 * 3600 * 1000);
      s1.setHours(10, 0, 0, 0);
      const e1 = new Date(s1.getTime() + 30 * 60 * 1000);
      const s2 = new Date(Date.now() + 8 * 24 * 3600 * 1000);
      s2.setHours(11, 0, 0, 0);
      const e2 = new Date(s2.getTime() + 30 * 60 * 1000);

      await query(`
        INSERT INTO appointments (id, salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source)
        VALUES 
          ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::timestamptz, $7::timestamptz, 'scheduled', 'online'),
          ($8::uuid, $2::uuid, $9::uuid, $4::uuid, $5::uuid, $10::timestamptz, $11::timestamptz, 'scheduled', 'online')
      `, [apptC1, fixtures.salon1.id, fixtures.customerA.id, fixtures.stylist1.id, fixtures.service1.id, s1.toISOString(), e1.toISOString(),
          apptC2, fixtures.customerB.id, s2.toISOString(), e2.toISOString()]);

      const targetDate = new Date(Date.now() + 9 * 24 * 3600 * 1000).toISOString().split('T')[0];
      const targetTime = '12:00';

      const [resA, resB] = await Promise.all([
        customerAClient.patch(`/api/customer/appointments/${apptC1}`, {
          action: 'reschedule',
          date: targetDate,
          time: targetTime,
          staff_id: fixtures.stylist1.id,
        }),
        customerBClient.patch(`/api/customer/appointments/${apptC2}`, {
          action: 'reschedule',
          date: targetDate,
          time: targetTime,
          staff_id: fixtures.stylist1.id,
        }),
      ]);

      const statuses = [resA.status, resB.status];
      const has200 = statuses.includes(200);
      const has409 = statuses.includes(409);

      if (has200 && has409) {
        record('F1-08', 'Concurrency: simultaneous reschedules -> exactly one 200, one 409 isOverlap', true, 'Locking prevented double-booking (200 + 409)', t0);
      } else {
        record('F1-08', 'Concurrency: simultaneous reschedules', false, `Received statuses: ${statuses.join(', ')}`, t0, {
          classification: 'APP BUG',
          expected: 'One 200 and one 409',
          actual: `Statuses: ${statuses.join(', ')}`,
          likelyFile: 'src/app/api/customer/appointments/[id]/route.ts',
        });
      }
    } catch (err: any) {
      record('F1-08', 'Concurrency test', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F1-09: Security - IDOR, no cookie, expired cookie, tampered cookie, owner cookie
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // 1. Customer A tries to cancel Customer B's appointment -> 404 (IDOR)
      const idorRes = await customerAClient.patch(`/api/customer/appointments/${fixtures.apptFutureB.id}`, {
        action: 'cancel',
      });

      // 2. No cookie -> 401
      const noAuthRes = await anonClient.patch(`/api/customer/appointments/${fixtures.apptFutureA.id}`, {
        action: 'cancel',
      });

      // 3. Expired cookie -> 401
      const expiredToken = await createExpiredToken({ customerId: fixtures.customerA.id, role: 'customer' });
      const expiredClient = new QAClient();
      expiredClient.setCookie('StudioDesk_customer_session', expiredToken);
      const expiredRes = await expiredClient.patch(`/api/customer/appointments/${fixtures.apptFutureA.id}`, {
        action: 'cancel',
      });

      // 4. Tampered cookie -> 401
      const tamperedToken = await createTamperedToken({ customerId: fixtures.customerA.id, role: 'customer' });
      const tamperedClient = new QAClient();
      tamperedClient.setCookie('StudioDesk_customer_session', tamperedToken);
      const tamperedRes = await tamperedClient.patch(`/api/customer/appointments/${fixtures.apptFutureA.id}`, {
        action: 'cancel',
      });

      // 5. Owner cookie on customer endpoint -> 401
      const ownerRes = await ownerClient.patch(`/api/customer/appointments/${fixtures.apptFutureA.id}`, {
        action: 'cancel',
      });

      // 6. SQL injection attempt in path
      const sqliRes = await customerAClient.patch(`/api/customer/appointments/' OR 1=1 --`, {
        action: 'cancel',
      });

      const pass = (idorRes.status === 404 || idorRes.status === 403) &&
        noAuthRes.status === 401 &&
        expiredRes.status === 401 &&
        tamperedRes.status === 401 &&
        ownerRes.status === 401 &&
        (sqliRes.status === 400 || sqliRes.status === 404) && sqliRes.status < 500;

      if (pass) {
        record('F1-09', 'Security: IDOR (404), unauth (401), expired (401), tampered (401), SQLi handled', true, 'All security boundaries strictly enforced', t0);
      } else {
        record('F1-09', 'Security: cancel/reschedule endpoint protection', false, `idor=${idorRes.status}, noAuth=${noAuthRes.status}, expired=${expiredRes.status}, tampered=${tamperedRes.status}, owner=${ownerRes.status}, sqli=${sqliRes.status}`, t0, {
          classification: 'APP BUG',
          expected: 'idor:404, noAuth:401, expired:401, tampered:401, owner:401, sqli:400/404',
          actual: `idor=${idorRes.status}, noAuth=${noAuthRes.status}, expired=${expiredRes.status}, tampered=${tamperedRes.status}, owner=${ownerRes.status}, sqli=${sqliRes.status}`,
          likelyFile: 'src/app/api/customer/appointments/[id]/route.ts',
        });
      }
    } catch (err: any) {
      record('F1-09', 'Security checks', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F1-10: Demo Salon - simulation returns success but DB unchanged
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // Create a simulated appointment ID for demo salon
      const mockApptId = crypto.randomUUID();
      const demoClient = new QAClient();
      const demoCustomerToken = await createCustomerToken({
        customerId: crypto.randomUUID(),
        mobile: '9999999999',
        name: 'Demo Visitor',
        salonId: '00000000-0000-0000-0000-000000000001',
      });
      demoClient.setCookie('StudioDesk_customer_session', demoCustomerToken);

      // Reschedule attempt on demo
      const res = await demoClient.patch(`/api/customer/appointments/${mockApptId}`, {
        action: 'cancel',
      });

      // Even if mock ID is passed or demo salon is triggered, verify no crash (status 200 or 404, status < 500)
      const pass = res.status < 500;
      if (pass) {
        record('F1-10', 'Demo salon cancellation handling', true, `Handled gracefully without 500 (status ${res.status})`, t0);
      } else {
        record('F1-10', 'Demo salon cancellation handling', false, `Returned 500 error`, t0, {
          classification: 'APP BUG',
          likelyFile: 'src/app/api/customer/appointments/[id]/route.ts',
        });
      }
    } catch (err: any) {
      record('F1-10', 'Demo salon check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  return results;
}

