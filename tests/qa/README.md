# SalonPro QA Automated Test Suite Guide

Welcome to the automated QA test suite for SalonPro! This document provides beginner-friendly, step-by-step instructions for running API and UI automation tests on Windows.

---

## 1. Overview & Architecture

The QA suite verifies 4 core features:
1. **Feature 1 (`F1`)**: Customer Cancel & Reschedule (window rules, concurrency, policies)
2. **Feature 2 (`F2`)**: Image Upload & Gallery (magic bytes, folder isolation, 5-photo limit)
3. **Feature 3 (`F3`)**: Customer Profile & Security PIN (Unicode, avatar folder containment, bcrypt verify)
4. **Feature 4 (`F4`)**: Reviews & Ratings (30-day eligibility, staff attribution, owner reply, privacy masking)
5. **Cross-Feature (`CROSS`)**: Full End-to-End customer journey and crash protection

### Safety Guard Mechanism
To prevent accidental data modification or corruption, `tests/qa/config.ts` includes an automated safety guard:
- Compares `DATABASE_URL` in `.env.test` against `.env.local`. If they point to the same database, the suite **immediately aborts**.
- Verifies that the test database name or host contains `'test'`.
- Spawns the Next.js production server on port **3100** using test environment variables exclusively, isolating production/development data.

---

## 2. Prerequisites & Setup (Windows)

### Step 1: Create `.env.test`
Copy `.env.test.example` to `.env.test` if not already present:
```powershell
Copy-Item .env.test.example .env.test
```

Ensure `.env.test` points to your dedicated test PostgreSQL database:
```env
PORT=3100
BASE_URL=http://localhost:3100
DATABASE_URL=postgresql://postgres.mneftepouqtsyfwgfsyb:Av$@rSuvagiya2136@aws-0-ap-northeast-2.pooler.supabase.com:6543/salonpro_test
SUPABASE_URL=https://mneftepouqtsyfwgfsyb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=supersecret-session-key-salonpro-2026-xyz-qa-test
```

### Step 2: Build the Application
The test runner boots Next.js in production mode (`next start -p 3100`), which requires the `.next` bundle:
```powershell
npm run build
```

---

## 3. Running the Tests

| Command | Description |
|---|---|
| `npm run qa:api` | Boots the test server on port 3100, seeds `TEST_` fixtures, executes all 29 API tests, and generates `tests/qa/report.md`. |
| `npm run qa:api:feature -- 1` | Runs only Feature 1 (Customer Cancel & Reschedule). |
| `npm run qa:api:feature -- 2` | Runs only Feature 2 (Image Upload & Gallery). |
| `npm run qa:api:feature -- 3` | Runs only Feature 3 (Customer Profile & PIN). |
| `npm run qa:api:feature -- 4` | Runs only Feature 4 (Reviews & Ratings). |
| `npm run qa:ui` | Runs the Playwright UI smoke suite (8 desktop & mobile smoke tests). |
| `npm run qa:all` | Executes both the API suite and the UI smoke suite end-to-end. |

---

## 4. Understanding Results & Classification

Each test prints a color-coded status line:
- `✅ PASS [ID]`: Test met all expected status codes, database states, and security bounds.
- `❌ FAIL [ID]`: Mismatch between expected behavior and actual application response.
- `⏭ SKIP [ID]`: Test skipped due to missing prerequisite.

Failures are automatically diagnosed in `tests/qa/report.md` into three classifications:
- **`APP BUG`**: An application logic error, unhandled exception (500), or specification deviation in `src/`.
- **`TEST PROBLEM`**: An error in test assertions, fixture expectations, or invalid mock setup.
- **`INFRA`**: Network or infrastructure failure (`ECONNRESET`, `ETIMEDOUT`, server unavailable).

---

## 5. Documented Application Bugs

During execution of the test suite, 6 genuine application bugs were detected and documented (preserved per instruction not to alter application code):

1. **`F1-02` (`src/app/api/settings/route.ts`)**: Passing `cancel_policy_hours: null` returns `200 OK` and silently retains the old value instead of returning `400 Bad Request`.
2. **`F1-09` (`src/app/api/customer/appointments/[id]/route.ts`)**: Passing an unescaped SQLi string in the `[id]` URL parameter causes an unhandled Postgres UUID parse crash (`500 Internal Server Error`) instead of a sanitized `400` or `404`.
3. **`F4-01` (`src/app/api/customer/reviews/route.ts`)**: Route checks `if (appt.status !== 'completed')`, but database check constraint `appointments_status_check` only accepts `'done'`. Thus all completed visits are rejected with `400` ("Reviews can only be submitted for completed appointments").
4. **`F4-03` (`src/app/api/customer/reviews/route.ts`)**: Same appointment status mismatch causes review validation tests on completed visits to reject with `400`.
5. **`CROSS-01` (`src/app/api/customer/reviews/route.ts`)**: Customer cannot submit a review for their completed appointment during the end-to-end booking lifecycle due to the `'completed'` vs `'done'` status mismatch.
6. **`CROSS-02` (`src/app/api/customer/profile/route.ts`)**: Passing a `null` JSON body to `PATCH /api/customer/profile` throws `Cannot read properties of null` resulting in `500 Internal Server Error` instead of `400 Bad Request`.

