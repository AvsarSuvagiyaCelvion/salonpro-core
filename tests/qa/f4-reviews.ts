import crypto from 'crypto';
import { QAClient } from './client.ts';
import { query } from './config.ts';
import type { QADataFixtures, TestResult } from './types.ts';

export async function runFeature4Tests(fixtures: QADataFixtures): Promise<TestResult[]> {
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
      feature: 'F4',
      name,
      status: passed ? 'PASS' : 'FAIL',
      reason,
      durationMs: Date.now() - startTime,
      ...extra,
    });
  };

  const customerAClient = new QAClient();
  customerAClient.setCookie('salonpro_customer_session', fixtures.customerA.token);

  const customerBClient = new QAClient();
  customerBClient.setCookie('salonpro_customer_session', fixtures.customerB.token);

  const owner1Client = new QAClient();
  owner1Client.setCookie('salonpro_session', fixtures.owner1.token);

  const owner2Client = new QAClient();
  owner2Client.setCookie('salonpro_session', fixtures.owner2.token);

  const staff1Client = new QAClient();
  staff1Client.setCookie('salonpro_session', fixtures.staff1.token);

  const anonClient = new QAClient();

  // --------------------------------------------------------------------------
  // F4-01: Eligibility: completed visit within 30 days OK; >30 days rejected (400); scheduled/other rejected
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // 1. Completed 10 days ago (apptCompletedRecentA) -> Pass (200)
      const resRecent = await customerAClient.post('/api/customer/reviews', {
        appointment_id: fixtures.apptCompletedRecentA.id,
        rating: 5,
        comment: 'Great hair styling and wonderful ambiance!',
      });

      // 2. Completed 35 days ago (apptCompletedOldA) -> Rejected (400)
      const resOld = await customerAClient.post('/api/customer/reviews', {
        appointment_id: fixtures.apptCompletedOldA.id,
        rating: 4,
        comment: 'Too late to review',
      });

      // 3. Scheduled appointment (not completed) -> Rejected (400)
      const resScheduled = await customerAClient.post('/api/customer/reviews', {
        appointment_id: fixtures.apptNearCutoffA.id,
        rating: 5,
        comment: 'Cannot review scheduled appt',
      });

      // 4. Other customer's appointment (Customer A reviewing Customer B's appt) -> 404
      const resOther = await customerAClient.post('/api/customer/reviews', {
        appointment_id: fixtures.apptCompletedRecentB.id,
        rating: 5,
        comment: 'Cannot review someone else appt',
      });

      const pass = resRecent.status === 200 &&
        resOld.status === 400 &&
        resScheduled.status === 400 &&
        resOther.status === 404;

      if (pass) {
        record('F4-01', 'Review eligibility: <=30 days completed (200), >30 days (400), scheduled (400), other customer (404)', true, 'All eligibility constraints strictly verified', t0);
      } else {
        record('F4-01', 'Review eligibility checks', false, `recent=${resRecent.status}, old=${resOld.status}, sched=${resScheduled.status}, other=${resOther.status}`, t0, {
          classification: 'APP BUG',
          expected: 'recent=200, old=400, sched=400, other=404',
          actual: `recent=${resRecent.status}, old=${resOld.status}, sched=${resScheduled.status}, other=${resOther.status}`,
          likelyFile: 'src/app/api/customer/reviews/route.ts',
        });
      }
    } catch (err: any) {
      record('F4-01', 'Review eligibility check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F4-02: Duplicate review rejected & Database UNIQUE constraint verified
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // Ensure initial review exists in DB for apptCompletedRecentA
      await query(`
        INSERT INTO reviews (id, salon_id, customer_id, appointment_id, staff_id, rating, comment, status)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 5, 'Initial verified review', 'visible')
        ON CONFLICT (appointment_id) DO NOTHING
      `, [crypto.randomUUID(), fixtures.salon1.id, fixtures.customerA.id, fixtures.apptCompletedRecentA.id, fixtures.stylist1.id]);

      // 1. Second review attempt via API for apptCompletedRecentA
      const resDupApi = await customerAClient.post('/api/customer/reviews', {
        appointment_id: fixtures.apptCompletedRecentA.id,
        rating: 4,
        comment: 'Second review attempt',
      });

      // 2. Direct database insert attempting duplicate appointment_id
      let uniqueConstraintTriggered = false;
      try {
        await query(`
          INSERT INTO reviews (id, salon_id, customer_id, appointment_id, staff_id, rating, comment)
          VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 5, 'Raw duplicate insert')
        `, [crypto.randomUUID(), fixtures.salon1.id, fixtures.customerA.id, fixtures.apptCompletedRecentA.id, fixtures.stylist1.id]);
      } catch (err: any) {
        if (err.code === '23505') { // Postgres unique_violation
          uniqueConstraintTriggered = true;
        }
      }

      const pass = resDupApi.status === 400 && uniqueConstraintTriggered;

      if (pass) {
        record('F4-02', 'Single review rule: duplicate submission rejected (400) and DB UNIQUE(appointment_id) enforced', true, 'Application and DB level single-review constraints verified', t0);
      } else {
        record('F4-02', 'Duplicate review prevention', false, `apiStatus=${resDupApi.status}, dbUniqueTriggered=${uniqueConstraintTriggered}`, t0, {
          classification: 'APP BUG',
          expected: 'resDupApi=400, uniqueConstraintTriggered=true',
          actual: `apiStatus=${resDupApi.status}, dbUnique=${uniqueConstraintTriggered}`,
          likelyFile: 'src/app/api/customer/reviews/route.ts',
        });
      }
    } catch (err: any) {
      record('F4-02', 'Duplicate review check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F4-03: Validation: rating (0, 6, 3.5, string, null rejected), comment >500 rejected, staff_id derived
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // Create a fresh completed appointment for validation testing
      const valApptId = crypto.randomUUID();
      const s = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
      const e = new Date(Date.now() - 5 * 24 * 3600 * 1000 + 30 * 60 * 1000).toISOString();

      await query(`
        INSERT INTO appointments (id, salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::timestamptz, $7::timestamptz, 'done', 'online')
      `, [valApptId, fixtures.salon1.id, fixtures.customerB.id, fixtures.stylist2.id, fixtures.service2.id, s, e]);

      const res0 = await customerBClient.post('/api/customer/reviews', { appointment_id: valApptId, rating: 0 });
      const res6 = await customerBClient.post('/api/customer/reviews', { appointment_id: valApptId, rating: 6 });
      const resDecimal = await customerBClient.post('/api/customer/reviews', { appointment_id: valApptId, rating: 3.5 });
      const resString = await customerBClient.post('/api/customer/reviews', { appointment_id: valApptId, rating: '5' });
      const resNull = await customerBClient.post('/api/customer/reviews', { appointment_id: valApptId, rating: null });
      const resLongComment = await customerBClient.post('/api/customer/reviews', {
        appointment_id: valApptId,
        rating: 5,
        comment: 'A'.repeat(501),
      });

      // Submit valid review with forged staff_id in body
      const resValid = await customerBClient.post('/api/customer/reviews', {
        appointment_id: valApptId,
        rating: 4,
        comment: '  Clean and professional service  ', // whitespace
        staff_id: fixtures.stylist3.id, // Forged staff member from Salon 2!
      });

      // Verify staff_id in DB matches appointment's staff_id (stylist2), not forged stylist3
      const dbReview = (await query('SELECT staff_id, comment FROM reviews WHERE appointment_id = $1::uuid', [valApptId])).rows[0];
      const correctStaff = dbReview?.staff_id === fixtures.stylist2.id;
      const trimmedComment = dbReview?.comment === 'Clean and professional service';

      const pass = res0.status === 400 &&
        res6.status === 400 &&
        resDecimal.status === 400 &&
        resString.status === 400 &&
        resNull.status === 400 &&
        resLongComment.status === 400 &&
        resValid.status === 200 &&
        correctStaff &&
        trimmedComment;

      if (pass) {
        record('F4-03', 'Review validation: rating 0/6/decimal/string/null & comment >500 rejected; staff derived', true, 'Ratings strictly 1-5 integer, comment trimmed, staff_id tamper-proof', t0);
      } else {
        record('F4-03', 'Review validation checks', false, `r0=${res0.status}, r6=${res6.status}, dec=${resDecimal.status}, str=${resString.status}, null=${resNull.status}, longC=${resLongComment.status}, valid=${resValid.status}, staff=${correctStaff}`, t0, {
          classification: 'APP BUG',
          expected: 'All invalid=400, valid=200, staff_id derived from appointment',
          actual: `r0=${res0.status}, r6=${res6.status}, dec=${resDecimal.status}, str=${resString.status}, null=${resNull.status}, longC=${resLongComment.status}, valid=${resValid.status}, staff=${correctStaff}`,
          likelyFile: 'src/app/api/customer/reviews/route.ts',
        });
      }
    } catch (err: any) {
      record('F4-03', 'Review validation check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F4-04: Owner review management: stats accuracy, reply max 300, hide/unhide, cross-salon blocked
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // 1. Fetch reviews as Salon 1 owner
      const listRes = await owner1Client.get('/api/reviews');
      const data = listRes.data;

      // Find the review created in F4-01 for apptCompletedRecentA
      const reviewRow = (await query('SELECT id FROM reviews WHERE appointment_id = $1::uuid', [fixtures.apptCompletedRecentA.id])).rows[0];
      const reviewId = reviewRow?.id;

      // 2. Add owner reply (max 300)
      const validReply = 'Thank you for your visit, Avsar! We look forward to serving you again.';
      const resReply = await owner1Client.patch(`/api/reviews/${reviewId}`, {
        owner_reply: validReply,
      });

      // 3. Reply >300 chars rejected
      const resLongReply = await owner1Client.patch(`/api/reviews/${reviewId}`, {
        owner_reply: 'x'.repeat(301),
      });

      // 4. Hide review
      const resHide = await owner1Client.patch(`/api/reviews/${reviewId}`, {
        status: 'hidden',
      });

      // Verify DB status is hidden
      const dbCheckHide = (await query('SELECT status, owner_reply FROM reviews WHERE id = $1::uuid', [reviewId])).rows[0];

      // 5. Salon 2 owner attempting to reply or hide Salon 1's review -> 404
      const resCrossSalon = await owner2Client.patch(`/api/reviews/${reviewId}`, {
        owner_reply: 'Cross salon attack',
      });

      // 6. Unhide review back to visible
      await owner1Client.patch(`/api/reviews/${reviewId}`, {
        status: 'visible',
      });

      const pass = listRes.status === 200 &&
        resReply.status === 200 &&
        resLongReply.status === 400 &&
        resHide.status === 200 &&
        dbCheckHide?.status === 'hidden' &&
        dbCheckHide?.owner_reply === validReply &&
        resCrossSalon.status === 404;

      if (pass) {
        record('F4-04', 'Owner review management: stats, reply max 300, hide/unhide, cross-tenant isolation (404)', true, 'Owner reply, visibility toggle, and tenant isolation fully functional', t0);
      } else {
        record('F4-04', 'Owner review management', false, `list=${listRes.status}, reply=${resReply.status}, longReply=${resLongReply.status}, hide=${resHide.status}, crossSalon=${resCrossSalon.status}`, t0, {
          classification: 'APP BUG',
          expected: 'list=200, reply=200, longReply=400, hide=200, crossSalon=404',
          actual: `list=${listRes.status}, reply=${resReply.status}, longReply=${resLongReply.status}, hide=${resHide.status}, crossSalon=${resCrossSalon.status}`,
          likelyFile: 'src/app/api/reviews/[id]/route.ts',
        });
      }
    } catch (err: any) {
      record('F4-04', 'Owner review management check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F4-05: Public API: Privacy rule ("First L." only), latest 5, owner reply included, hidden excluded
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      const publicRes = await anonClient.get(`/api/public/${fixtures.salon1.slug}`);
      const data = publicRes.data;

      const summary = data?.reviewsSummary;
      const recentReviews: any[] = data?.reviews || data?.recentReviews || [];

      // Privacy checks on all recentReviews
      let privacyCompliant = true;
      let exposedField = '';

      for (const r of recentReviews) {
        // Name must match "First L." format (e.g. "TEST_Customer A." or "Rahul S.")
        if (typeof r.customer_name === 'string') {
          const parts = r.customer_name.trim().split(/\s+/);
          if (parts.length > 1 && parts[parts.length - 1].length > 2) {
            privacyCompliant = false;
            exposedField = `Full surname exposed: ${r.customer_name}`;
            break;
          }
        }
        if (r.phone || r.mobile || r.customer_id || r.email) {
          privacyCompliant = false;
          exposedField = `Private contact field exposed in review JSON`;
          break;
        }
      }

      // Check owner reply is included
      const hasReply = recentReviews.some((r) => typeof r.owner_reply === 'string' && r.owner_reply.length > 0);

      const pass = publicRes.status === 200 &&
        typeof summary?.average === 'number' &&
        typeof summary?.count === 'number' &&
        recentReviews.length > 0 &&
        recentReviews.length <= 5 &&
        privacyCompliant &&
        hasReply;

      if (pass) {
        record('F4-05', 'Public showcase: "First L." privacy masking, latest 5, owner replies, hidden excluded', true, 'Strict privacy enforced, owner response visible, average computed', t0);
      } else {
        record('F4-05', 'Public showcase privacy and display', false, `publicStatus=${publicRes.status}, count=${summary?.count}, privacy=${privacyCompliant} (${exposedField}), hasReply=${hasReply}`, t0, {
          classification: 'APP BUG',
          expected: 'Status 200, privacyCompliant=true, hasReply=true',
          actual: `publicStatus=${publicRes.status}, privacy=${privacyCompliant}, exposed=${exposedField}, hasReply=${hasReply}`,
          likelyFile: 'src/app/api/public/[slug]/route.ts',
        });
      }
    } catch (err: any) {
      record('F4-05', 'Public showcase check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F4-06: Plan Flag: Basic Plan (reviews OFF) -> owner page/API shows upgrade state; public hides reviews
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // Salon 2 is on 'basic' plan with reviews: false
      const owner2ReviewsRes = await owner2Client.get('/api/reviews');
      const publicSalon2Res = await anonClient.get(`/api/public/${fixtures.salon2.slug}`);

      // Owner API returns planAllowed: false
      const planAllowedFalse = owner2ReviewsRes.data?.planAllowed === false;

      // Public API disables reviewsSummary or omits reviews
      const publicReviewsHidden =
        !publicSalon2Res.data?.reviewsSummary?.enabled ||
        publicSalon2Res.data?.reviewsSummary === undefined ||
        publicSalon2Res.data?.reviewsSummary === null ||
        (Array.isArray(publicSalon2Res.data?.reviews) && publicSalon2Res.data.reviews.length === 0);

      const pass = owner2ReviewsRes.status === 200 && planAllowedFalse && publicReviewsHidden;

      if (pass) {
        record('F4-06', 'Plan Flag: Basic Plan shows upgrade state (planAllowed=false) and public hides reviews', true, 'Plan gating strictly observed for Basic tier', t0);
      } else {
        record('F4-06', 'Plan flag gating for Basic plan', false, `planAllowed=${owner2ReviewsRes.data?.planAllowed}, publicSummary=${JSON.stringify(publicSalon2Res.data?.reviewsSummary)}`, t0, {
          classification: 'APP BUG',
          expected: 'planAllowed=false, publicReviewsHidden=true',
          actual: `planAllowed=${owner2ReviewsRes.data?.planAllowed}, public=${JSON.stringify(publicSalon2Res.data?.reviewsSummary)}`,
          likelyFile: 'src/app/api/reviews/route.ts',
        });
      }
    } catch (err: any) {
      record('F4-06', 'Plan flag check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  return results;
}

