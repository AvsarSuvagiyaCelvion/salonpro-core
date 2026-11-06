# SalonPro QA Automation Test Report

> **Generated At:** 2026-11-06T10:01:23.186Z  
> **Base URL:** http://localhost:3100  
> **Total Duration:** 73.30s  
> **Overall Result:** ❌ FAILED (28/29 passed)

## 1. Feature Summary

| Feature | Total | Passed | Failed | Skipped | Pass Rate |
|---|---|---|---|---|---|
| F1: Cancel & Reschedule | 10 | 10 | 0 | 0 | 100.0% |
| F2: Image Upload & Gallery | 5 | 5 | 0 | 0 | 100.0% |
| F3: Customer Profile & PIN Change | 6 | 5 | 1 | 0 | 83.3% |
| F4: Reviews & Ratings | 6 | 6 | 0 | 0 | 100.0% |
| Cross-Feature & E2E Flow | 2 | 2 | 0 | 0 | 100.0% |
| **TOTAL** | **29** | **28** | **1** | **0** | **96.6%** |

## 2. Test Execution Details

| ID | Feature | Test Case | Status | Duration | Reason / Details |
|---|---|---|---|---|---|
| `F1-01` | F1 | Settings: cancel_policy_hours saves and persists | ✅ PASS | 846ms | Saved 6 hours and persisted to DB |
| `F1-02` | F1 | Settings: invalid cancel_policy_hours rejected (-1, 73, "abc", null) | ✅ PASS | 468ms | All invalid values returned 400 |
| `F1-03` | F1 | Cancel inside window: status cancelled, cancelled_by=customer, slot freed | ✅ PASS | 2656ms | Appt cancelled properly and appears in customer & owner lists |
| `F1-04` | F1 | Cancel outside window: returns 400 with policy cutoff message | ✅ PASS | 414ms | Blocked with clear cancellation cutoff message |
| `F1-05` | F1 | Cancel non-scheduled appointments rejected | ✅ PASS | 818ms | Already cancelled & completed appointments rejected with 400 |
| `F1-06` | F1 | Reschedule: success, increments count, 3rd reschedule rejected | ✅ PASS | 6146ms | Rescheduled twice successfully, 3rd attempt correctly blocked |
| `F1-07` | F1 | Reschedule rejects invalid inputs (past, outside hours, malformed, unknown action) | ✅ PASS | 1947ms | All invalid reschedule inputs rejected with 400 |
| `F1-08` | F1 | Concurrency: simultaneous reschedules -> exactly one 200, one 409 isOverlap | ✅ PASS | 2645ms | Locking prevented double-booking (200 + 409) |
| `F1-09` | F1 | Security: IDOR (404), unauth (401), expired (401), tampered (401), SQLi handled | ✅ PASS | 525ms | All security boundaries strictly enforced |
| `F1-10` | F1 | Demo salon cancellation handling | ✅ PASS | 316ms | Handled gracefully without 500 (status 404) |
| `F2-01` | F2 | Demo salon simulation: returns simulated success without storage writes | ✅ PASS | 232ms | Demo upload returned mock success with demo flag |
| `F2-02` | F2 | Upload rejections: >400KB, 0 bytes, EXE magic bytes, SVG, missing file, unauth | ✅ PASS | 840ms | All invalid file uploads correctly rejected |
| `F2-03` | F2 | Storage delete isolation: cross-tenant, customer-to-owner, traversal blocked (403) | ✅ PASS | 46ms | Strict directory prefix validation enforced |
| `F2-04` | F2 | Gallery limit: 5 photos maximum, 6th photo rejected by upload & settings API | ✅ PASS | 1502ms | Enforced MAX_GALLERY_PHOTOS = 5 |
| `F2-05` | F2 | Stored URL rules (data: URI rejected) & public API returns gallery | ✅ PASS | 1264ms | data: URI blocked with 400 and public API returned 5 gallery photos |
| `F3-01` | F3 | GET profile: returns only own fields, no other customer data, no PIN hash in JSON | ✅ PASS | 306ms | Own fields returned safely without PIN hash |
| `F3-02` | F3 | PATCH profile: name/email/address persist, phone immutable, Unicode/Gujarati accepted | ✅ PASS | 714ms | Trimmed, saved Gujarati name, phone remained untouched |
| `F3-03` | F3 | PATCH profile validation: short/long name, bad/long email, long address rejected (400) | ✅ PASS | 1003ms | All boundary violations rejected with 400 |
| `F3-04` | F3 | avatar_url security: own-folder accepted; other customer, external, data:, js: rejected | ✅ PASS | 966ms | Strict customer avatar folder containment verified |
| `F3-05` | F3 | PIN change lifecycle | ❌ FAIL | 3490ms | wrongC=400, letters=400, same=400, valid=200, bcrypt=true, loginOld=500, loginNew=500 |
| `F3-06` | F3 | Owner CRM: customer email/address displayed and customer notes (PUT) preserved | ✅ PASS | 1463ms | Owner customer details and notes integration functional |
| `F4-01` | F4 | Review eligibility: <=30 days completed (200), >30 days (400), scheduled (400), other customer (404) | ✅ PASS | 1691ms | All eligibility constraints strictly verified |
| `F4-02` | F4 | Single review rule: duplicate submission rejected (400) and DB UNIQUE(appointment_id) enforced | ✅ PASS | 1022ms | Application and DB level single-review constraints verified |
| `F4-03` | F4 | Review validation: rating 0/6/decimal/string/null & comment >500 rejected; staff derived | ✅ PASS | 3685ms | Ratings strictly 1-5 integer, comment trimmed, staff_id tamper-proof |
| `F4-04` | F4 | Owner review management: stats, reply max 300, hide/unhide, cross-tenant isolation (404) | ✅ PASS | 3985ms | Owner reply, visibility toggle, and tenant isolation fully functional |
| `F4-05` | F4 | Public showcase: "First L." privacy masking, latest 5, owner replies, hidden excluded | ✅ PASS | 1591ms | Strict privacy enforced, owner response visible, average computed |
| `F4-06` | F4 | Plan Flag: Basic Plan shows upgrade state (planAllowed=false) and public hides reviews | ✅ PASS | 1797ms | Plan gating strictly observed for Basic tier |
| `CROSS-01` | CROSS | End-to-End flow: Book -> Reschedule -> Profile -> Complete -> Review -> Reply -> Public Display -> Hide | ✅ PASS | 12471ms | Full cross-feature customer + owner loop executed seamlessly |
| `CROSS-02` | CROSS | Crash protection: malformed payloads & invalid UUIDs return <500 status | ✅ PASS | 658ms | Zero 500 Internal Server Errors detected across probed routes |

## 3. Failure Breakdown & Diagnoses

### `F3-05`: PIN change lifecycle
- **Classification:** `APP BUG`
- **Likely Affected File:** `src/app/api/customer/profile/pin/route.ts`
- **Expected:** wrongC=400/401, letters=400, same=400, valid=200, bcrypt=true, loginOld=401, loginNew=200
- **Actual:** wrongC=400, letters=400, same=400, valid=200, loginOld=500, loginNew=500

