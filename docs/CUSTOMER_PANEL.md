# Customer Panel Documentation

> **Last verified:** 2026-11-06  
> **Status:** Verified against source code

---

## 1. Purpose and Users
The Customer Panel enables salon clients to discover salon services, select stylists, book time slots online in Indian Standard Time (IST), manage self-service cancellations and rescheduling within salon policy windows, view digital bills/receipts, and access VIP membership benefits.

---

## 2. Page Routes Table

| Route | File Path | What It Does | Key Components Used |
|---|---|---|---|
| `/[slug]` | `src/app/[slug]/page.tsx` | Primary public showcase & booking wizard for a salon identified by unique slug. | `BookingWizard` (`src/components/booking/BookingWizard.tsx`) |
| `/book/[slug]` | `src/app/book/[slug]/page.tsx` | Alias for public booking wizard (supports direct `/book/<slug>` links). | `BookingWizard` (`src/components/booking/BookingWizard.tsx`) |
| `/portal` | `src/app/portal/page.tsx` | Customer portal: authenticated client dashboard showing upcoming visits, past visits, invoices, VIP plans, and self-service cancel/reschedule. Also renders customer login/signup when unauthenticated. | `CustomerPortalPage`, `ThemeToggle`, `PrintReceiptButton` |
| `/my-account` | `src/app/my-account/page.tsx` | Alias route re-exporting `/portal`. | `CustomerPortalPage` |
| `/customer/login` | `src/app/customer/login/page.tsx` | Alias route re-exporting `/portal` (renders in login mode). | `CustomerPortalPage` |
| `/customer/signup` | `src/app/customer/signup/page.tsx` | Alias route re-exporting `/portal` (renders in signup mode). | `CustomerPortalPage` |
| `/b/[number]` | `src/app/b/[number]/page.tsx` | Public or authenticated digital receipt and tax invoice view. Rendered in printable format with PDF download option. | `PrintReceiptButton` (`src/components/receipt/PrintReceiptButton.tsx`) |

---

## 3. API Routes Table

| Endpoint | Methods | File Path | Auth Required | What It Does |
|---|---|---|---|---|
| `/api/public/[slug]` | `GET` | `src/app/api/public/[slug]/route.ts` | None (Public) | Fetches salon details, service list, active staff, and working days for the booking wizard. |
| `/api/public/[slug]/slots` | `GET` | `src/app/api/public/[slug]/slots/route.ts` | None (Public) | Computes real-time available time slots for a given date, service, and optional staff member. |
| `/api/public/[slug]/book` | `POST` | `src/app/api/public/[slug]/book/route.ts` | None (Public with rate limit & PIN) | Validates customer PIN, checks concurrency via PostgreSQL advisory locks, and books appointment atomically. |
| `/api/customer/auth` | `GET`, `POST` | `src/app/api/customer/auth/route.ts` | Cookie for `GET`; None for `POST` | Checks customer session or signs in / registers a new customer using 10-digit mobile & 4-digit PIN. Sets `salonpro_customer_session`. |
| `/api/customer/logout` | `POST` | `src/app/api/customer/logout/route.ts` | `salonpro_customer_session` | Clears the `salonpro_customer_session` HTTP-only cookie. |
| `/api/customer/records` | `GET`, `PATCH` | `src/app/api/customer/records/route.ts` | `salonpro_customer_session` | Fetches customer profile, upcoming/past appointments, invoices, active VIP plans, and cancellation policy hours. |
| `/api/customer/appointments/[id]` | `PATCH` | `src/app/api/customer/appointments/[id]/route.ts` | `salonpro_customer_session` | Handles customer self-service `cancel` or `reschedule` within the salon's cancellation window. Prevents duplicate booking via advisory lock. |

---

## 4. Components Used Only by This Panel

| Component | File Path | Purpose |
|---|---|---|
| `BookingWizard` | `src/components/booking/BookingWizard.tsx` | Multi-step booking engine (Step 1: Service selection -> Step 2: Stylist -> Step 3: Date/Time slot -> Step 4: Contact & PIN -> Step 5: Confirmation + WhatsApp redirect). |
| `PrintReceiptButton` | `src/components/receipt/PrintReceiptButton.tsx` | Triggers browser print dialog (`window.print()`) and HTML2PDF receipt generation on `/b/[number]`. |

---

## 5. Database Tables Touched

| Table | Key Columns Touched | Read/Write | Migration File |
|---|---|---|---|
| `salons` | `id`, `name`, `slug`, `phone`, `booking_enabled`, `open_time`, `close_time`, `working_days`, `slot_minutes`, `buffer_minutes`, `min_advance_hours`, `max_advance_days`, `cancel_policy_hours` | Read | `001_initial_schema.sql`, `003_add_settings_columns.sql`, `015_customer_cancel_reschedule.sql` |
| `services` | `id`, `salon_id`, `name`, `category`, `duration_min`, `price`, `online_enabled` | Read | `001_initial_schema.sql` |
| `staff` | `id`, `salon_id`, `name`, `role_title`, `active`, `show_online` | Read | `001_initial_schema.sql` |
| `staff_services` | `staff_id`, `service_id` | Read | `001_initial_schema.sql` |
| `salon_holidays` | `salon_id`, `start_date`, `end_date`, `title` | Read | `014_salon_holidays.sql` |
| `customers` | `id`, `salon_id`, `name`, `mobile`, `email`, `pin`, `last_login_at` | Read / Write | `001_initial_schema.sql`, `004_add_customer_auth.sql`, `012_dedupe_and_unique_customers.sql` |
| `appointments` | `id`, `salon_id`, `customer_id`, `staff_id`, `service_id`, `starts_at`, `ends_at`, `status`, `source`, `cancelled_by`, `cancelled_at`, `rescheduled_count` | Read / Write | `001_initial_schema.sql`, `015_customer_cancel_reschedule.sql` |
| `invoices` | `id`, `salon_id`, `customer_id`, `number`, `receipt_token`, `subtotal`, `tax_amount`, `total` | Read | `001_initial_schema.sql`, `007_invoices_tax_and_tenant_indexes.sql`, `010_backfill_invoice_receipt_tokens.sql` |
| `payments` | `invoice_id`, `amount`, `payment_method` | Read | `001_initial_schema.sql` |
| `customer_plans` | `customer_id`, `plan_id`, `kind`, `starts_on`, `expires_on` | Read | `001_initial_schema.sql` |

---

## 6. Main User Flows

### Flow 1: Public Online Booking
1. **Visit salon link**: Client loads `/<slug>` or `/book/<slug>`. `BookingWizard.tsx` calls `GET /api/public/[slug]` to load services, active staff, and operating schedule.
2. **Step 1 - Pick Service**: User selects category and service. Duration and price are recorded.
3. **Step 2 - Pick Stylist**: User selects specific stylist or "Anyone / First Available".
4. **Step 3 - Pick Date & Slot**: Selecting a date calls `GET /api/public/[slug]/slots?service_id=...&date=...&staff_id=...`. `src/lib/slots.ts` calculates available time slots considering operating hours, buffers, advance rules, existing appointments, and holidays.
5. **Step 4 - Details & PIN**: Client inputs 10-digit mobile, name, and 4-digit PIN.
6. **Step 5 - Atomic Reservation**: Submit calls `POST /api/public/[slug]/book`. The backend:
   - Verifies rate limits and rate limits on wrong PINs.
   - Handles Demo salon (`dixa-beauty-salon` simulates success).
   - Opens transaction in `src/app/api/public/[slug]/book/route.ts` with `pg_advisory_xact_lock(hashtext('salonId:staffId'))`.
   - Re-checks slot availability with `tstzrange` conflict check.
   - Inserts or verifies customer PIN using `bcrypt`.
   - Inserts appointment with `source = 'online'`, `status = 'scheduled'`.
   - Sets HTTP-only cookie `salonpro_customer_session`.
   - Returns appointment confirmation + prefilled WhatsApp link.

### Flow 2: Customer Self-Service Cancellation
1. **View Appointments**: Logged-in customer visits `/portal`. Client calls `GET /api/customer/records`.
2. **Cutoff Check**: For each `scheduled` visit, UI checks `starts_at - (salon.cancel_policy_hours * 3600000) >= Date.now()`.
3. **Open Cancel Modal**: User clicks "Cancel". Confirmation modal appears with appointment details.
4. **Submit Cancellation**: User confirms. UI calls `PATCH /api/customer/appointments/[id]` with `{ action: 'cancel' }`.
5. **Backend Processing**:
   - Authenticates customer session token.
   - Enforces rate limit (`cust_appt_action:<customerId>`).
   - Verifies ownership (`customer_id == payload.customerId`) and status is `scheduled`.
   - Checks `now <= starts_at - policy_hours`. If past cutoff, returns HTTP 400.
   - For demo salon (`dixa-beauty-salon`), returns simulated success.
   - Updates `appointments` table: `status = 'cancelled'`, `cancelled_by = 'customer'`, `cancelled_at = NOW()`.
6. **UI Refresh**: Modal closes, appointment moves to "Past Visits History" with badge `Cancelled (by you)`.

### Flow 3: Customer Self-Service Reschedule
1. **Open Reschedule Modal**: From `/portal`, customer clicks "Reschedule". Checks `rescheduled_count < 2`.
2. **Slot Selection**: User picks a new date. UI fetches available slots via `GET /api/public/[slug]/slots`.
3. **Submit Reschedule**: User selects slot and clicks "Confirm Reschedule". UI calls `PATCH /api/customer/appointments/[id]` with `{ action: 'reschedule', date, time, staff_id }`.
4. **Backend Concurrency Guard**:
   - Enforces max 2 reschedules (`rescheduled_count < 2`).
   - Validates date, time, operating hours, advance rules, and holidays.
   - Acquires PostgreSQL advisory transaction lock on `salon_id:staff_id`.
   - Verifies slot conflict excluding the current appointment (`a.id != $id`).
   - If slot was taken concurrently, returns HTTP `409` (`{ isOverlap: true }`). UI prompts user to choose another slot.
   - On success: updates `starts_at`, `ends_at`, `staff_id`, `rescheduled_count = rescheduled_count + 1`.

---

## 7. Business Rules and Edge Cases
- **Timezone**: All booking timestamps are interpreted and stored in Indian Standard Time (`Asia/Kolkata`, UTC+05:30).
- **Advisory Lock Concurrency**: Serialized using PostgreSQL `pg_advisory_xact_lock(hashtext(lockKey))` to eliminate race conditions between simultaneous bookings.
- **Cancellation Cutoff**: Governed by `salons.cancel_policy_hours` (default 2 hours, customizable 0-72 hours). If cutoff has passed, requests return HTTP 400 instructing the client to call the salon directly.
- **Reschedule Limit**: Max 2 reschedules per appointment. On the 3rd attempt, returns HTTP 400.
- **Demo Salon (`dixa-beauty-salon`)**: Simulates public bookings, cancellations, and reschedules without writing persistent records to the database.
- **Honeypot Bot Protection**: `POST /api/public/[slug]/book` contains hidden field `hp`. If populated by spam bots, silently returns mock success.
- **Anti-IDOR on Receipts (`/b/[number]`)**:
  - Unauthenticated access is allowed **only** when requested via the 64-character unguessable `receipt_token`.
  - Accessing via sequential invoice number requires an active session matching the invoice's `customer_id`, the salon's `owner`/`staff`, or a `super_admin`.

---

## 8. Shared Dependencies
- `src/lib/auth.ts`: `CUSTOMER_COOKIE_NAME`, `verifyCustomerSessionToken`, `createCustomerSessionToken`.
- `src/lib/slots.ts`: `getAvailableSlots` shared between booking wizard and portal reschedule modal.
- `src/lib/rate-limit.ts`: Throttling booking submissions and customer PIN attempts.
- `src/lib/holidays.ts`: `checkDateHoliday` to disable closed holiday slots.
- `src/proxy.ts`: Subdomain rewrite from `tenant.salonpro.in/` to `/[slug]`.

---

## 9. Cross-Panel Effects
- **Online Booking**: Immediately appears in the Owner ERP live board (`/app/live`) and appointments calendar (`/app/appointments`).
- **Customer Cancellation**: Flags appointment as `status = 'cancelled'` and `cancelled_by = 'customer'`. Displays with "Cancelled by customer" pill in Owner appointments view.
- **Customer Reschedule**: Updates `starts_at` and `ends_at` on the appointment, frees the old slot, and reflects immediately across owner schedules.

---

## 10. Known Gaps / TODO / UNVERIFIED Items
- Direct automated customer SMS / WhatsApp reminders currently require manual click or external webhook integrations; no background cron worker is currently running in this deployment.
- Customer account profile editing (changing name/phone) is currently UNVERIFIED / not exposed in the customer portal.

---

## 11. "Where to Look First" Cheat Sheet
- **Change slot generation rules**: `src/lib/slots.ts`
- **Modify public booking submission**: `src/app/api/public/[slug]/book/route.ts`
- **Edit booking wizard UI/steps**: `src/components/booking/BookingWizard.tsx`
- **Customer portal cancel/reschedule logic**: `src/app/api/customer/appointments/[id]/route.ts`
- **Customer portal UI**: `src/app/portal/page.tsx`
- **Digital receipt rendering & print format**: `src/app/b/[number]/page.tsx`

