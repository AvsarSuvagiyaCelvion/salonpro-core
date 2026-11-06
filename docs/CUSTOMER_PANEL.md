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
| `/[slug]` | `src/app/[slug]/page.tsx` | Primary public showcase & booking wizard for a salon identified by unique slug. Displays salon average rating stars & count, and recent customer reviews with owner replies (when `reviews` plan flag is active). | `BookingWizard` (`src/components/booking/BookingWizard.tsx`) |
| `/book/[slug]` | `src/app/book/[slug]/page.tsx` | Alias for public booking wizard (supports direct `/book/<slug>` links). | `BookingWizard` (`src/components/booking/BookingWizard.tsx`) |
| `/portal` | `src/app/portal/page.tsx` | Customer portal: authenticated client dashboard showing upcoming visits, past visits, invoices, VIP plans, profile editor, PIN change, self-service cancel/reschedule, and "Rate this visit" modal for completed appointments within 30 days. Supports `?tab=profile` query param. Also renders customer login/signup when unauthenticated. | `CustomerPortalPage`, `ThemeToggle`, `ImageUploader`, `PrintReceiptButton` |
| `/my-account` | `src/app/my-account/page.tsx` | Alias route re-exporting `/portal`. | `CustomerPortalPage` |
| `/customer/login` | `src/app/customer/login/page.tsx` | Alias route re-exporting `/portal` (renders in login mode). | `CustomerPortalPage` |
| `/customer/signup` | `src/app/customer/signup/page.tsx` | Alias route re-exporting `/portal` (renders in signup mode). | `CustomerPortalPage` |
| `/b/[number]` | `src/app/b/[number]/page.tsx` | Public or authenticated digital receipt and tax invoice view. Rendered in printable format with PDF download option. | `PrintReceiptButton` (`src/components/receipt/PrintReceiptButton.tsx`) |

---

## 3. API Routes Table

| Endpoint | Methods | File Path | Auth Required | What It Does |
|---|---|---|---|---|
| `/api/public/[slug]` | `GET` | `src/app/api/public/[slug]/route.ts` | None (Public) | Fetches salon details, brand logo, gallery photos (`salon_photos`), service list, active staff, and working days for the booking wizard. |
| `/api/public/[slug]/slots` | `GET` | `src/app/api/public/[slug]/slots/route.ts` | None (Public) | Computes real-time available time slots for a given date, service, and optional staff member. |
| `/api/public/[slug]/book` | `POST` | `src/app/api/public/[slug]/book/route.ts` | None (Public with rate limit & PIN) | Validates customer PIN, checks concurrency via PostgreSQL advisory locks, and books appointment atomically. |
| `/api/customer/auth` | `GET`, `POST` | `src/app/api/customer/auth/route.ts` | Cookie for `GET`; None for `POST` | Checks customer session or signs in / registers a new customer using 10-digit mobile & 4-digit PIN. Sets `salonpro_customer_session`. |
| `/api/customer/logout` | `POST` | `src/app/api/customer/logout/route.ts` | `salonpro_customer_session` | Clears the `salonpro_customer_session` HTTP-only cookie. |
| `/api/customer/records` | `GET`, `PATCH` | `src/app/api/customer/records/route.ts` | `salonpro_customer_session` | Fetches customer profile, upcoming/past appointments, invoices, active VIP plans, and cancellation policy hours. |
| `/api/customer/appointments/[id]` | `PATCH` | `src/app/api/customer/appointments/[id]/route.ts` | `salonpro_customer_session` | Handles customer self-service `cancel` or `reschedule` within the salon's cancellation window. Prevents duplicate booking via advisory lock. |
| `/api/customer/profile` | `GET`, `PATCH` | `src/app/api/customer/profile/route.ts` | `salonpro_customer_session` | `GET` returns logged-in client profile. `PATCH` updates name (2-60 chars), email, address (max 250), and avatar_url (strictly within customer's own folder in `salon-media` bucket). Phone is read-only. Rate-limited to 20 updates / 15 min. |
| `/api/customer/profile/pin` | `POST` | `src/app/api/customer/profile/pin/route.ts` | `salonpro_customer_session` | Updates customer 4-digit PIN. Requires current PIN, new 4-digit PIN (must differ), and confirm PIN. Verifies current PIN via bcryptjs and hashes new PIN. Protected by strict brute-force rate limit (5 attempts / 15 min per customer + IP). |
| `/api/customer/reviews` | `GET`, `POST` | `src/app/api/customer/reviews/route.ts` | `salonpro_customer_session` | `GET` lists all reviews submitted by the authenticated customer. `POST` submits review for a completed appointment within 30 days (1-5 stars, optional comment max 500 chars). Rate-limited to 10 submissions / 15 min. Simulates success for demo salon `dixa-beauty-salon`. |

---

## 4. Components Used Only by This Panel

| Component | File Path | Purpose |
|---|---|---|
| `BookingWizard` | `src/components/booking/BookingWizard.tsx` | Multi-step booking engine (Step 1: Salon gallery & Service selection -> Step 2: Stylist -> Step 3: Date/Time slot -> Step 4: Contact & PIN -> Step 5: Confirmation + WhatsApp redirect). Includes brand logo display and lazy-loaded responsive photo gallery (`loading="lazy"`). |
| `PrintReceiptButton` | `src/components/receipt/PrintReceiptButton.tsx` | Triggers browser print dialog (`window.print()`) and HTML2PDF receipt generation on `/b/[number]`. |

---

## 5. Database Tables Touched

| Table | Key Columns Touched | Read/Write | Migration File |
|---|---|---|---|
| `salons` | `id`, `name`, `slug`, `brand_color`, `logo_url`, `phone`, `booking_enabled`, `open_time`, `close_time`, `working_days`, `slot_minutes`, `buffer_minutes`, `min_advance_hours`, `max_advance_days`, `cancel_policy_hours` | Read | `001_initial_schema.sql`, `003_add_settings_columns.sql`, `015_customer_cancel_reschedule.sql` |
| `salon_photos` | `id`, `salon_id`, `url`, `sort_order` | Read | `016_salon_photos.sql` |
| `services` | `id`, `salon_id`, `name`, `category`, `duration_min`, `price`, `online_enabled` | Read | `001_initial_schema.sql` |
| `staff` | `id`, `salon_id`, `name`, `role_title`, `active`, `show_online` | Read | `001_initial_schema.sql` |
| `staff_services` | `staff_id`, `service_id` | Read | `001_initial_schema.sql` |
| `salon_holidays` | `salon_id`, `start_date`, `end_date`, `title` | Read | `014_salon_holidays.sql` |
| `customers` | `id`, `salon_id`, `name`, `mobile`, `email`, `address`, `avatar_url`, `pin`, `last_login_at` | Read / Write | `001_initial_schema.sql`, `004_add_customer_auth.sql`, `012_dedupe_and_unique_customers.sql`, `017_customer_profile_columns.sql` |
| `appointments` | `id`, `salon_id`, `customer_id`, `staff_id`, `service_id`, `starts_at`, `ends_at`, `status`, `source`, `cancelled_by`, `cancelled_at`, `rescheduled_count` | Read / Write | `001_initial_schema.sql`, `015_customer_cancel_reschedule.sql` |
| `invoices` | `id`, `salon_id`, `customer_id`, `number`, `receipt_token`, `subtotal`, `tax_amount`, `total` | Read | `001_initial_schema.sql`, `007_invoices_tax_and_tenant_indexes.sql`, `010_backfill_invoice_receipt_tokens.sql` |
| `payments` | `invoice_id`, `amount`, `payment_method` | Read | `001_initial_schema.sql` |
| `customer_plans` | `customer_id`, `plan_id`, `kind`, `starts_on`, `expires_on` | Read | `001_initial_schema.sql` |
| `reviews` | `id`, `salon_id`, `customer_id`, `appointment_id`, `staff_id`, `rating`, `comment`, `owner_reply`, `owner_replied_at`, `status`, `created_at` | Read / Write | `018_reviews.sql` |

---

## 6. Main User Flows

### Flow 1: Public Online Booking
1. **Visit salon link**: Client loads `/<slug>` or `/book/<slug>`. `BookingWizard.tsx` calls `GET /api/public/[slug]` to load brand logo, gallery photos (`salon_photos`), services, active staff, and operating schedule.
2. **Step 1 - Ambience Gallery & Pick Service**: User browses responsive lazy-loaded salon gallery photos, selects category and service. Duration and price are recorded.
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

### Flow 4: Customer Profile Edit & Security PIN Change
1. **Access Profile**: Logged-in customer visits `/portal?tab=profile` or clicks "Profile & Security" tab.
2. **Edit Profile Details**: User updates Name, Email, Address, or uploads avatar photo via `ImageUploader` (square crop <=60 KB). Phone remains read-only.
3. **Submit Profile Update**: Calls `PATCH /api/customer/profile`. Backend validates name length (2-60 chars), email regex, address length (max 250), and verifies `avatar_url` points strictly to the customer's own storage directory (`customers/{customerId}/...`). Updates DB, re-issues session cookie if name changed, and updates portal header avatar and name.
4. **Change 4-Digit Security PIN**: User inputs Current PIN, New 4-digit PIN, and Confirm PIN. Calls `POST /api/customer/profile/pin`. Backend checks brute-force rate limit (5 attempts / 15 min), verifies current PIN using `bcryptjs`, hashes new PIN, and updates database.

### Flow 5: Customer Post-Visit Review Submission
1. **Trigger Review Modal**: From `/portal` under "Past Visits History", client locates a completed appointment completed within the past 30 days without an existing review. Clicks "Rate this visit".
2. **Modal Input**: Selects 1 to 5 stars (responsive single-row on 320px screens) and optionally types feedback (max 500 characters).
3. **Submit Review**: Clicks "Submit Review". UI calls `POST /api/customer/reviews`.
4. **Backend Processing**:
   - Authenticates customer session token.
   - Enforces rate limit (`cust_review_submit:<customerId>`, 10 / 15 min).
   - Validates appointment belongs to logged-in customer and is in `completed` status.
   - Enforces recency check: `a.ends_at >= NOW() - INTERVAL '30 days'`.
   - Derives `staff_id` and `salon_id` from the appointment record.
   - Handles demo salon `dixa-beauty-salon` with simulated success.
   - Inserts record into `reviews` table (`status = 'visible'`). Unique constraint on `appointment_id` prevents duplicates.
5. **UI Update**: Modal closes, review is saved to local state, and the visit card now shows the customer's star rating, comment, and any future salon response read-only.

---

## 7. Business Rules and Edge Cases
- **Timezone**: All booking timestamps are interpreted and stored in Indian Standard Time (`Asia/Kolkata`, UTC+05:30).
- **Advisory Lock Concurrency**: Serialized using PostgreSQL `pg_advisory_xact_lock(hashtext(lockKey))` to eliminate race conditions between simultaneous bookings.
- **Cancellation Cutoff**: Governed by `salons.cancel_policy_hours` (default 2 hours, customizable 0-72 hours). If cutoff has passed, requests return HTTP 400 instructing the client to call the salon directly.
- **Reschedule Limit**: Max 2 reschedules per appointment. On the 3rd attempt, returns HTTP 400.
- **Customer Phone Immutability**: Customer mobile number is the primary identity token and cannot be edited via portal profile updates.
- **Customer Storage Isolation**: Avatars can only be stored under `customers/{customerId}/...` in bucket `salon-media`. External URLs or data URIs are rejected with HTTP 400.
- **Brute Force Defense**: PIN updates lock after 5 consecutive failed attempts for 15 minutes.
- **Demo Salon (`dixa-beauty-salon`)**: Simulates public bookings, cancellations, reschedules, and review submissions without writing persistent records to the database.
- **Review Submission Window & Privacy**: Reviews can only be submitted for `completed` visits within 30 days of appointment completion. Rating is an integer 1-5; comment is optional up to 500 characters. Public listing displays only "First name + last initial" (e.g. "Rahul S.") to protect customer privacy; phone numbers and full surnames are never exposed over public endpoints.
- **Honeypot Bot Protection**: `POST /api/public/[slug]/book` contains hidden field `hp`. If populated by spam bots, silently returns mock success.
- **Anti-IDOR on Receipts (`/b/[number]`)**:
  - Unauthenticated access is allowed **only** when requested via the 64-character unguessable `receipt_token`.
  - Accessing via sequential invoice number requires an active session matching the invoice's `customer_id`, the salon's `owner`/`staff`, or a `super_admin`.

---

## 8. Shared Dependencies
- `src/lib/auth.ts`: `CUSTOMER_COOKIE_NAME`, `verifyCustomerSessionToken`, `createCustomerSessionToken`.
- `src/lib/slots.ts`: `getAvailableSlots` shared between booking wizard and portal reschedule modal.
- `src/lib/rate-limit.ts`: Throttling booking submissions, customer PIN attempts, and profile edits.
- `src/lib/storage.ts`: Storage path validation and Supabase Storage client for customer avatar uploads.
- `src/lib/holidays.ts`: `checkDateHoliday` to disable closed holiday slots.
- `src/proxy.ts`: Subdomain rewrite from `tenant.salonpro.in/` to `/[slug]`.

---

## 9. Cross-Panel Effects
- **Online Booking**: Immediately appears in the Owner ERP live board (`/app/live`) and appointments calendar (`/app/appointments`).
- **Customer Cancellation**: Flags appointment as `status = 'cancelled'` and `cancelled_by = 'customer'`. Displays with "Cancelled by customer" pill in Owner appointments view.
- **Customer Reschedule**: Updates `starts_at` and `ends_at` on the appointment, frees the old slot, and reflects immediately across owner schedules.
- **Customer Profile & Avatar**: Updated email, address, and avatar are immediately visible to owners in `/app/customers` (client table, bill modal, and detail views).

---

## 10. Known Gaps / TODO / UNVERIFIED Items
- Direct automated customer SMS / WhatsApp reminders currently require manual click or external webhook integrations; no background cron worker is currently running in this deployment.

---

## 11. "Where to Look First" Cheat Sheet
- **Change slot generation rules**: `src/lib/slots.ts`
- **Modify public booking submission**: `src/app/api/public/[slug]/book/route.ts`
- **Edit booking wizard UI/steps**: `src/components/booking/BookingWizard.tsx`
- **Customer portal cancel/reschedule logic**: `src/app/api/customer/appointments/[id]/route.ts`
- **Customer portal UI**: `src/app/portal/page.tsx`
- **Digital receipt rendering & print format**: `src/app/b/[number]/page.tsx`

