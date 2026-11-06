# SalonPro QA Automation Test Report

> **Generated At:** 2026-11-06T06:42:59.894Z  
> **Base URL:** http://localhost:3100  
> **Total Duration:** 57.57s  
> **Overall Result:** ❌ FAILED (23/29 passed)

## 1. Feature Summary

| Feature | Total | Passed | Failed | Skipped | Pass Rate |
|---|---|---|---|---|---|
| F1: Cancel & Reschedule | 10 | 8 | 2 | 0 | 80.0% |
| F2: Image Upload & Gallery | 5 | 5 | 0 | 0 | 100.0% |
| F3: Customer Profile & PIN Change | 6 | 6 | 0 | 0 | 100.0% |
| F4: Reviews & Ratings | 6 | 4 | 2 | 0 | 66.7% |
| Cross-Feature & E2E Flow | 2 | 0 | 2 | 0 | 0.0% |
| **TOTAL** | **29** | **23** | **6** | **0** | **79.3%** |

## 2. Test Execution Details

| ID | Feature | Test Case | Status | Duration | Reason / Details |
|---|---|---|---|---|---|
| `F1-01` | F1 | Settings: cancel_policy_hours saves and persists | ✅ PASS | 664ms | Saved 6 hours and persisted to DB |
| `F1-02` | F1 | Settings: invalid cancel_policy_hours rejected (-1, 73, "abc", null) | ❌ FAIL | 691ms | Value null returned status 200 instead of 400 |
| `F1-03` | F1 | Cancel inside window: status cancelled, cancelled_by=customer, slot freed | ✅ PASS | 2437ms | Appt cancelled properly and appears in customer & owner lists |
| `F1-04` | F1 | Cancel outside window: returns 400 with policy cutoff message | ✅ PASS | 330ms | Blocked with clear cancellation cutoff message |
| `F1-05` | F1 | Cancel non-scheduled appointments rejected | ✅ PASS | 658ms | Already cancelled & completed appointments rejected with 400 |
| `F1-06` | F1 | Reschedule: success, increments count, 3rd reschedule rejected | ✅ PASS | 3741ms | Rescheduled twice successfully, 3rd attempt correctly blocked |
| `F1-07` | F1 | Reschedule rejects invalid inputs (past, outside hours, malformed, unknown action) | ✅ PASS | 1479ms | All invalid reschedule inputs rejected with 400 |
| `F1-08` | F1 | Concurrency: simultaneous reschedules -> exactly one 200, one 409 isOverlap | ✅ PASS | 1920ms | Locking prevented double-booking (200 + 409) |
| `F1-09` | F1 | Security: cancel/reschedule endpoint protection | ❌ FAIL | 685ms | idor=404, noAuth=401, expired=401, tampered=401, owner=401, sqli=500 |
| `F1-10` | F1 | Demo salon cancellation handling | ✅ PASS | 330ms | Handled gracefully without 500 (status 404) |
| `F2-01` | F2 | Demo salon simulation: returns simulated success without storage writes | ✅ PASS | 175ms | Demo upload returned mock success with demo flag |
| `F2-02` | F2 | Upload rejections: >400KB, 0 bytes, EXE magic bytes, SVG, missing file, unauth | ✅ PASS | 838ms | All invalid file uploads correctly rejected |
| `F2-03` | F2 | Storage delete isolation: cross-tenant, customer-to-owner, traversal blocked (403) | ✅ PASS | 18ms | Strict directory prefix validation enforced |
| `F2-04` | F2 | Gallery limit: 5 photos maximum, 6th photo rejected by upload & settings API | ✅ PASS | 1618ms | Enforced MAX_GALLERY_PHOTOS = 5 |
| `F2-05` | F2 | Stored URL rules (data: URI rejected) & public API returns gallery | ✅ PASS | 1135ms | data: URI blocked with 400 and public API returned 5 gallery photos |
| `F3-01` | F3 | GET profile: returns only own fields, no other customer data, no PIN hash in JSON | ✅ PASS | 169ms | Own fields returned safely without PIN hash |
| `F3-02` | F3 | PATCH profile: name/email/address persist, phone immutable, Unicode/Gujarati accepted | ✅ PASS | 478ms | Trimmed, saved Gujarati name, phone remained untouched |
| `F3-03` | F3 | PATCH profile validation: short/long name, bad/long email, long address rejected (400) | ✅ PASS | 822ms | All boundary violations rejected with 400 |
| `F3-04` | F3 | avatar_url security: own-folder accepted; other customer, external, data:, js: rejected | ✅ PASS | 979ms | Strict customer avatar folder containment verified |
| `F3-05` | F3 | PIN change: wrong/letters/same rejected; valid change updates bcrypt & login works | ✅ PASS | 5902ms | Full PIN change lifecycle and authentication verification passed |
| `F3-06` | F3 | Owner CRM: customer email/address displayed and customer notes (PUT) preserved | ✅ PASS | 473ms | Owner customer details and notes integration functional |
| `F4-01` | F4 | Review eligibility checks | ❌ FAIL | 1219ms | recent=400, old=400, sched=400, other=404 |
| `F4-02` | F4 | Single review rule: duplicate submission rejected (400) and DB UNIQUE(appointment_id) enforced | ✅ PASS | 605ms | Application and DB level single-review constraints verified |
| `F4-03` | F4 | Review validation checks | ❌ FAIL | 2561ms | r0=400, r6=400, dec=400, str=400, null=400, longC=400, valid=400, staff=false |
| `F4-04` | F4 | Owner review management: stats, reply max 300, hide/unhide, cross-tenant isolation (404) | ✅ PASS | 3036ms | Owner reply, visibility toggle, and tenant isolation fully functional |
| `F4-05` | F4 | Public showcase: "First L." privacy masking, latest 5, owner replies, hidden excluded | ✅ PASS | 1196ms | Strict privacy enforced, owner response visible, average computed |
| `F4-06` | F4 | Plan Flag: Basic Plan shows upgrade state (planAllowed=false) and public hides reviews | ✅ PASS | 1358ms | Plan gating strictly observed for Basic tier |
| `CROSS-01` | CROSS | End-to-End flow | ❌ FAIL | 9747ms | book=200, resched=200, profile=200, review=400, reply=200, foundPub=true, hide=200, hiddenPub=true |
| `CROSS-02` | CROSS | Crash protection | ❌ FAIL | 307ms | PATCH /api/customer/profile returned status 500 |

## 3. Failure Breakdown & Diagnoses

### `F1-02`: Settings: invalid cancel_policy_hours rejected (-1, 73, "abc", null)
- **Classification:** `APP BUG`
- **Likely Affected File:** `src/app/api/settings/route.ts`
- **Expected:** Status 400 for all invalid values
- **Actual:** Value null returned status 200 instead of 400

### `F1-09`: Security: cancel/reschedule endpoint protection
- **Classification:** `APP BUG`
- **Likely Affected File:** `src/app/api/customer/appointments/[id]/route.ts`
- **Expected:** idor:404, noAuth:401, expired:401, tampered:401, owner:401, sqli:400/404
- **Actual:** idor=404, noAuth=401, expired=401, tampered=401, owner=401, sqli=500

### `F4-01`: Review eligibility checks
- **Classification:** `APP BUG`
- **Likely Affected File:** `src/app/api/customer/reviews/route.ts`
- **Expected:** recent=200, old=400, sched=400, other=404
- **Actual:** recent=400, old=400, sched=400, other=404

### `F4-03`: Review validation checks
- **Classification:** `APP BUG`
- **Likely Affected File:** `src/app/api/customer/reviews/route.ts`
- **Expected:** All invalid=400, valid=200, staff_id derived from appointment
- **Actual:** r0=400, r6=400, dec=400, str=400, null=400, longC=400, valid=400, staff=false

### `CROSS-01`: End-to-End flow
- **Classification:** `APP BUG`
- **Expected:** All steps return 200 and reflect state changes
- **Actual:** book=200, resched=200, profile=200, review=400, found=true, hidden=true

### `CROSS-02`: Crash protection
- **Classification:** `APP BUG`
- **Expected:** All status < 500 (e.g. 400, 401, 404)
- **Actual:** PATCH /api/customer/profile returned status 500

