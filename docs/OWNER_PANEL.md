# Owner & Staff Panel (ERP) Documentation

> **Last verified:** 2026-11-06 (Salon-branded invoice prefix management & sequential numbering verified)  
> **Status:** Verified against source code

---

## 1. Purpose and Users
The Owner Panel is the operational ERP system for salon owners, managers, and staff to run daily operations: queue and in-chair live sessions, appointment calendar scheduling, POS billing and receipts, customer relationship management (CRM), staff commissions, retail inventory, business analytics, and salon settings.

---

## 2. Page Routes Table

| Route | File Path | What It Does | Key Components Used |
|---|---|---|---|
| `/login` | `src/app/login/page.tsx` | Salon owner and staff login page. Includes one-click demo login button for showcase. | Login form |
| `/salon-owner` | `src/app/salon-owner/page.tsx` | Informational landing page for prospective salon owners redirecting to `/login`. | Landing page layout |
| `/register` | `src/app/register/page.tsx` | Tenant onboarding page: registers new salon, creates owner credentials, and provisions 14-day Pro trial. | Onboarding form |
| `/register-salon` | `src/app/register-salon/page.tsx` | Alias for `/register`. | Onboarding form |
| `/app` | `src/app/app/page.tsx` | Default tenant root route; automatically redirects to `/app/dashboard`. | Next.js redirect |
| `/app/dashboard` | `src/app/app/dashboard/page.tsx` | Executive summary: daily sales, appointment count, live queue count, monthly revenue, and recent appointments. | `DonutDistributionChart`, `BarComparisonChart`, `HourlyRushChart` |
| `/app/live` | `src/app/app/live/page.tsx` | Live floor queue: manages walk-in waiting list, moves clients to "In Chair" sessions, adds services/products, and checks out to POS. Fully responsive mobile scroll modals and theme-matched dark/light styling. | Live Kanban columns, Waitlist modal, Service/Product modal, POS Checkout modal |
| `/app/appointments` | `src/app/app/appointments/page.tsx` | Calendar & schedule management: Multi-Stylist Lanes view, 7-Day Matrix view, and Card list view. Manages status (In Chair, Done, Cancelled). Automatically greys out off/leave periods and non-shift hours with "Leave"/"Off" labels and prevents booking walk-ins into blocked intervals. | `SkeletonTable` |
| `/app/billing` | `src/app/app/billing/page.tsx` | POS Billing & Checkout: invoice generation, discount calculation, payment modes (Cash, UPI, Card), and GST calculation. | POS register form |
| `/app/customers` | `src/app/app/customers/page.tsx` | Client directory (CRM): search, contact details, total visits, lifetime spend, notes, and VIP status. | Customer list & modal |
| `/app/services` | `src/app/app/services/page.tsx` | Service catalog: service items, category classification, duration, pricing, and online booking visibility toggle. Includes mobile scrollable Add/Edit Service modal with pinned header/footer and full dark mode support. | Service table & modal |
| `/app/products` | `src/app/app/products/page.tsx` | Retail inventory: product tracking, stock count, cost price, selling price, and low stock threshold alerts. | Product table & modal |
| `/app/staff` | `src/app/app/staff/page.tsx` | Staff roster & schedules: stylist profiles, roles, commissions, assigned services, duty status, weekly shifts editor (7 days, start/end hours, working/off, copy salon hours), planned leave manager with high-contrast date display, and mobile viewport responsive scrollable modal dialogs. | Staff table, Add/Edit modal, Shifts & Leaves modal |
| `/app/memberships` | `src/app/app/memberships/page.tsx` | VIP membership & package management: discount rules, validity periods, and client assignment. | Membership cards & assignment modal |
| `/app/reports` | `src/app/app/reports/page.tsx` | Analytics and export: revenue breakdowns, staff commission statements, and CSV/PDF export. | `ReportExportModal`, `BarComparisonChart`, `DonutDistributionChart`, `HourlyRushChart` |
| `/app/reviews` | `src/app/app/reviews/page.tsx` | Reviews & ratings hub: aggregate rating, 5-star distribution, stylist rating leaderboard, client reviews feed, owner reply drawer/modal, and visibility toggle (`visible`/`hidden`). Gated by `reviews` plan flag (Pro/Premium). | Reviews dashboard, Star rating bars, Reply modal |
| `/app/settings` | `src/app/app/settings/page.tsx` | Salon configuration: business details, logo upload, operating hours, slot intervals, buffer gaps, advance booking limits, cancellation policy hours, custom invoice prefix management with live format preview, and holiday closures. Gated with owner role validation; displays a read-only informational banner and disables save actions when accessed by operational staff. | Settings tab panels |
| `/app/subscription` | `src/app/app/subscription/page.tsx` | Plan management: current subscription tier, trial status, feature matrix, and Razorpay upgrade/renewal. | Plan cards & Razorpay checkout |
| `/app/benefits` | `src/app/app/benefits/page.tsx` | Plan comparison matrix showing feature gates between Basic, Pro, and Premium. | Feature comparison table |

---

## 3. API Routes Table

| Endpoint | Methods | File Path | Auth Required | What It Does |
|---|---|---|---|---|
| `/api/login` | `POST` | `src/app/api/login/route.ts` | None | Authenticates salon owner/staff via email and password; sets `salonpro_session` cookie. |
| `/api/register` | `POST` | `src/app/api/register/route.ts` | None | Provisions new salon, owner account, default services, and trial period. |
| `/api/logout` | `POST` | `src/app/api/logout/route.ts` | `salonpro_session` | Clears `salonpro_session` cookie. |
| `/api/demo/owner-login` | `GET`, `POST` | `src/app/api/demo/owner-login/route.ts` | None (Public Demo) | Logs user into demo salon workspace (`dixa-beauty-salon`) as owner without credentials. |
| `/api/dashboard/stats` | `GET` | `src/app/api/dashboard/stats/route.ts` | `salonpro_session` | Returns analytical metrics (revenue, appointments, waiting clients, `totalProducts`, and `lowStockProducts`). |
| `/api/appointments` | `GET`, `POST` | `src/app/api/appointments/route.ts` | `salonpro_session` | Lists filtered appointments or creates new internal owner booking. |
| `/api/appointments/[id]` | `PATCH`, `DELETE` | `src/app/api/appointments/[id]/route.ts` | `salonpro_session` | Updates appointment status (`arrived`, `cancelled`, `done`) or removes it. |
| `/api/appointments/[id]/start-session` | `POST` | `src/app/api/appointments/[id]/start-session/route.ts` | `salonpro_session` | Converts scheduled appointment into an active in-chair beauty session. |
| `/api/live` | `GET` | `src/app/api/live/route.ts` | `salonpro_session` | Returns combined waiting list and active in-chair sessions. |
| `/api/live/waiting` | `GET`, `POST` | `src/app/api/live/waiting/route.ts` | `salonpro_session` | Adds walk-in client to waiting list. |
| `/api/live/waiting/[id]` | `DELETE` | `src/app/api/live/waiting/[id]/route.ts` | `salonpro_session` | Removes client from waiting list. |
| `/api/live/sessions` | `GET`, `POST` | `src/app/api/live/sessions/route.ts` | `salonpro_session` | Creates or lists active in-chair sessions. |
| `/api/live/sessions/[id]/items` | `GET`, `POST` | `src/app/api/live/sessions/[id]/items/route.ts` | `salonpro_session` | Adds service or product line item to an active session. |
| `/api/live/sessions/[id]/items/[itemId]` | `DELETE` | `src/app/api/live/sessions/[id]/items/[itemId]/route.ts` | `salonpro_session` | Deletes a line item from an active session. |
| `/api/live/sessions/[id]/complete` | `POST` | `src/app/api/live/sessions/[id]/complete/route.ts` | `salonpro_session` | Completes session, creates invoice, records payments, updates stock, and awards commission. |
| `/api/billing` | `GET`, `POST` | `src/app/api/billing/route.ts` | `salonpro_session` | Lists past invoices or creates manual direct POS invoice. |
| `/api/billing/pay` | `POST` | `src/app/api/billing/pay/route.ts` | `salonpro_session` | Records partial or full payment against an outstanding invoice. |
| `/api/billing/whatsapp` | `POST` | `src/app/api/billing/whatsapp/route.ts` | `salonpro_session` | Triggers digital receipt WhatsApp message via Cloud API or Twilio. |
| `/api/customers` | `GET`, `POST` | `src/app/api/customers/route.ts` | `salonpro_session` | Searches/lists clients or creates new customer profile. |
| `/api/customers/[id]` | `GET`, `PATCH`, `DELETE` | `src/app/api/customers/[id]/route.ts` | `salonpro_session` | Fetches client details, updates profile/notes, or removes client. |
| `/api/customers/[id]/invoices` | `GET` | `src/app/api/customers/[id]/invoices/route.ts` | `salonpro_session` | Lists all billing history for a specific customer. |
| `/api/services` | `GET`, `POST` | `src/app/api/services/route.ts` | `salonpro_session` | Lists or creates salon services. Enforces plan service limits. |
| `/api/services/[id]` | `PATCH`, `DELETE` | `src/app/api/services/[id]/route.ts` | `salonpro_session` | Updates service details/pricing or deletes service. |
| `/api/products` | `GET`, `POST` | `src/app/api/products/route.ts` | `salonpro_session` | Lists inventory products or adds new retail product. |
| `/api/products/[id]` | `PATCH`, `DELETE` | `src/app/api/products/[id]/route.ts` | `salonpro_session` | Updates product inventory levels, price, or details. |
| `/api/products/sell` | `POST` | `src/app/api/products/sell/route.ts` | `salonpro_session` | Direct POS sale for retail products without service session. |
| `/api/staff` | `GET`, `POST` | `src/app/api/staff/route.ts` | `salonpro_session` | Lists staff or creates new stylist profile. Enforces plan staff limits. |
| `/api/staff/[id]` | `PATCH`, `DELETE` | `src/app/api/staff/[id]/route.ts` | `salonpro_session` | Updates stylist roles, commission percentages, or deletes staff. |
| `/api/staff/[id]/shifts` | `GET`, `PUT` | `src/app/api/staff/[id]/shifts/route.ts` | `salonpro_session` (Role: `owner`) | `GET` fetches 7-day weekly shifts for a stylist (falls back to salon hours if not set) and salon operating window. `PUT` updates weekly shifts (0=Sunday to 6=Saturday), validates shifts lie within salon operating hours, and returns a non-destructive warning list of existing appointments conflicting with shortened shifts / off days. Rate-limited to 30 requests / 15 min. |
| `/api/staff/[id]/leaves` | `GET`, `POST`, `DELETE` | `src/app/api/staff/[id]/leaves/route.ts` | `salonpro_session` (Role: `owner`) | `GET` lists planned leaves for a stylist. `POST` adds leave (`from_date`, `to_date`, `reason` max 120 chars) and returns existing scheduled appointment conflicts as non-destructive warnings. `DELETE` removes a planned leave by `leaveId`. Rate-limited to 30 requests / 15 min. |
| `/api/staff/availability` | `GET` | `src/app/api/staff/availability/route.ts` | `salonpro_session` | Returns consolidated daily or date-range working windows (`isWorking`, `start`, `end`, reason) for all active salon staff, combining salon working days, salon holidays, staff shifts, and staff leaves. |
| `/api/memberships` | `GET`, `POST` | `src/app/api/memberships/route.ts` | `salonpro_session` (Feature: `memberships`) | Lists or creates VIP membership plans. Gated by plan feature. |
| `/api/memberships/assign` | `POST` | `src/app/api/memberships/assign/route.ts` | `salonpro_session` (Feature: `memberships`) | Assigns VIP plan to customer. |
| `/api/reports` | `GET` | `src/app/api/reports/route.ts` | `salonpro_session` | Aggregates daily/monthly revenue, staff commission reports, and cash summary. |
| `/api/reviews` | `GET` | `src/app/api/reviews/route.ts` | `salonpro_session` (Feature: `reviews`) | Lists paginated reviews for the salon with status (`all`/`visible`/`hidden`), star (1-5), and staff filters. Computes overall average, total count, 5-to-1 star distribution breakdown, and staff average ratings. Returns `planAllowed`. |
| `/api/reviews/[id]` | `PATCH` | `src/app/api/reviews/[id]/route.ts` | `salonpro_session` (Feature: `reviews`) | Adds or updates an owner reply (max 300 chars, records `owner_replied_at`) or toggles status (`visible`/`hidden`). Scoped to salon owner/staff; rate-limited to 30 requests / 15 min. |
| `/api/export` | `GET` | `src/app/api/export/route.ts` | `salonpro_session` (Feature: `export`) | Exports clients, invoices, appointments, or products as CSV/PDF. Gated by plan. |
| `/api/settings` | `GET`, `PUT`, `PATCH` | `src/app/api/settings/route.ts` | `salonpro_session` (Role: `owner`) | Reads and saves salon operating rules, buffer gap, advance notice, cancellation policy, and branding. |
| `/api/settings/photos` | `GET`, `POST`, `DELETE` | `src/app/api/settings/photos/route.ts` | `salonpro_session` (Role: `owner`) | Fetches, adds, or deletes salon gallery photos. Enforces `MAX_GALLERY_PHOTOS = 5`. |
| `/api/upload` | `POST`, `DELETE` | `src/app/api/upload/route.ts` | `salonpro_session` or `salonpro_customer_session` | Authenticated file upload to Supabase Storage `salon-media` bucket. Validates magic bytes, enforces <=400KB server size limit, rate limits requests, and manages object deletion. |
| `/api/holidays` | `GET`, `POST` | `src/app/api/holidays/route.ts` | `salonpro_session` (Role: `owner`) | Lists or adds temporary salon closures and holidays. |
| `/api/holidays/[id]` | `DELETE` | `src/app/api/holidays/[id]/route.ts` | `salonpro_session` (Role: `owner`) | Deletes a salon closure date. |
| `/api/subscription` | `GET` | `src/app/api/subscription/route.ts` | `salonpro_session` | Fetches active subscription details and trial status. |
| `/api/subscription/payments` | `GET` | `src/app/api/subscription/payments/route.ts` | `salonpro_session` | Fetches Razorpay payment history for the salon. |
| `/api/subscription/razorpay/create-order` | `POST` | `src/app/api/subscription/razorpay/create-order/route.ts` | `salonpro_session` | Generates Razorpay Order ID for subscription payment. |
| `/api/subscription/razorpay/verify` | `POST` | `src/app/api/subscription/razorpay/verify/route.ts` | `salonpro_session` | Verifies Razorpay payment signature and updates plan in database. |
| `/api/subscription/razorpay/webhook` | `POST` | `src/app/api/subscription/razorpay/webhook/route.ts` | Webhook Signature | Receives Razorpay asynchronous subscription event notifications. |

---

## 4. Components Used Only by This Panel

| Component | File Path | Purpose |
|---|---|---|
| `SkeletonTable` | `src/components/ui/SkeletonTable.tsx` | Loading skeleton placeholder for tables in appointments, staff, and services. |
| `ReportExportModal` | `src/components/reports/ReportExportModal.tsx` | Date range selector modal for exporting PDF/CSV reports. |
| `AreaTrendChart` | `src/components/charts/AreaTrendChart.tsx` | SVG area chart showing revenue trends on dashboard. |
| `BarComparisonChart` | `src/components/charts/BarComparisonChart.tsx` | Comparison bar chart for service categories in reports. |
| `DonutDistributionChart` | `src/components/charts/DonutDistributionChart.tsx` | Visual distribution chart for payment modes (Cash, UPI, Card). |
| `HourlyRushChart` | `src/components/charts/HourlyRushChart.tsx` | Peak hours hourly rush histogram for salon footfall. |
| `BrandLoader` | `src/components/ui/BrandLoader.tsx` | Branded spinner for full-screen loading transitions. |
| `ImageUploader` | `src/components/ui/ImageUploader.tsx` | Client-side image upload and preview component with canvas compression (target <=200KB for gallery, <=60KB square crop for logo/avatar). Fully responsive from 320px with dedicated `mode="logo"`, `mode="avatar"`, and `mode="default"` styles. |

---

## 5. Database Tables Touched

| Table | Key Columns Touched | Read/Write | Migration File |
|---|---|---|---|
| `users` | `id`, `salon_id`, `email`, `password_hash`, `role`, `is_active` | Read / Write | `006_users_and_tenant_auth.sql` |
| `salons` | `id`, `name`, `slug`, `brand_color`, `logo_url`, `open_time`, `close_time`, `working_days`, `slot_minutes`, `buffer_minutes`, `min_advance_hours`, `max_advance_days`, `cancel_policy_hours`, `invoice_counter`, `invoice_prefix`, `plan`, `trial_ends_at`, `subscription_status` | Read / Write | `001_initial_schema.sql`, `003_add_settings_columns.sql`, `008_plans_limits.sql`, `009_auth_rate_limits_and_invoice_counter.sql`, `015_customer_cancel_reschedule.sql`, `020_add_salon_invoice_prefix.sql` |
| `salon_photos` | `id`, `salon_id`, `url`, `storage_path`, `sort_order`, `created_at` | Read / Write | `016_salon_photos.sql` |
| `staff` | `id`, `salon_id`, `name`, `role_title`, `service_commission_pct`, `product_commission_pct`, `active`, `show_online` | Read / Write | `001_initial_schema.sql` |
| `services` | `id`, `salon_id`, `name`, `category`, `duration_min`, `price`, `online_enabled` | Read / Write | `001_initial_schema.sql` |
| `staff_services` | `staff_id`, `service_id` | Read / Write | `001_initial_schema.sql` |
| `products` | `id`, `salon_id`, `name`, `brand`, `sku`, `price`, `cost_price`, `stock`, `min_stock`, `active` | Read / Write | `001_initial_schema.sql` |
| `customers` | `id`, `salon_id`, `name`, `mobile`, `email`, `address`, `avatar_url`, `note`, `birthday`, `pin` | Read / Write | `001_initial_schema.sql`, `012_dedupe_and_unique_customers.sql`, `017_customer_profile_columns.sql` |
| `appointments` | `id`, `salon_id`, `customer_id`, `staff_id`, `service_id`, `starts_at`, `ends_at`, `status`, `source`, `cancelled_by`, `cancelled_at`, `rescheduled_count` | Read / Write | `001_initial_schema.sql`, `015_customer_cancel_reschedule.sql` |
| `waiting` | `id`, `salon_id`, `customer_id`, `created_at` | Read / Write | `001_initial_schema.sql` |
| `sessions` | `id`, `salon_id`, `customer_id`, `status`, `started_at` | Read / Write | `001_initial_schema.sql` |
| `session_items` | `id`, `session_id`, `staff_id`, `item_type`, `item_id`, `quantity`, `price` | Read / Write | `001_initial_schema.sql` |
| `invoices` | `id`, `salon_id`, `customer_id`, `number`, `receipt_token`, `subtotal`, `discount_amount`, `tax_amount`, `total` | Read / Write | `001_initial_schema.sql`, `007_invoices_tax_and_tenant_indexes.sql`, `010_backfill_invoice_receipt_tokens.sql` |
| `payments` | `id`, `invoice_id`, `amount`, `payment_method`, `created_at` | Read / Write | `001_initial_schema.sql` |
| `salon_holidays` | `id`, `salon_id`, `title`, `start_date`, `end_date`, `note` | Read / Write | `014_salon_holidays.sql` |
| `subscription_payments` | `id`, `salon_id`, `razorpay_order_id`, `razorpay_payment_id`, `amount`, `status` | Read / Write | `011_subscription_payments.sql` |
| `reviews` | `id`, `salon_id`, `customer_id`, `appointment_id`, `staff_id`, `rating`, `comment`, `owner_reply`, `owner_replied_at`, `status`, `created_at` | Read / Write | `018_reviews.sql` |
| `staff_shifts` | `id`, `staff_id`, `salon_id`, `weekday`, `start_time`, `end_time`, `is_off`, `created_at` | Read / Write | `019_staff_shifts_and_leaves.sql` |
| `staff_leaves` | `id`, `staff_id`, `salon_id`, `from_date`, `to_date`, `reason`, `created_at` | Read / Write | `019_staff_shifts_and_leaves.sql` |

---

## 6. Main User Flows

### Flow 1: Live Salon Floor (Walk-in to Checkout)
1. **Walk-in Arrival**: Staff adds client on `/app/live` -> calls `POST /api/live/waiting`.
2. **Seat in Chair**: Staff clicks "Seat in Chair" -> calls `POST /api/live/sessions` with `customer_id`. Client moves from Waiting to "In Chair" column.
3. **Add Services & Retail**: Stylist adds service or retail item -> calls `POST /api/live/sessions/[id]/items` with `item_type`, `item_id`, `staff_id`, and `price`.
4. **Checkout & Bill**: Staff clicks "Complete & Bill" -> calls `POST /api/live/sessions/[id]/complete`:
   - Atomically increments salon invoice counter (`UPDATE salons SET invoice_counter = invoice_counter + 1`).
   - Inserts row in `invoices` with unique `receipt_token`.
   - Records payments in `payments` table.
   - Decrements inventory stock in `products` for any retail items sold.
   - Marks session `status = 'completed'`.
   - Generates digital receipt URL `/b/<receipt_token>`.

### Flow 2: Calendar Appointment Management
1. **View Schedule**: Stylist opens `/app/appointments`. Can toggle Multi-Stylist Lanes, Weekly Matrix, or Cards view.
2. **Customer Arrived**: When client arrives, click "Seat in Chair" -> updates appointment status to `arrived` via `PATCH /api/appointments/[id]`.
3. **Start POS**: Click "Start POS" -> converts appointment into active session via `POST /api/appointments/[id]/start-session`.
4. **Cancelled Appointments**: If cancelled by the customer via self-service, card automatically renders a badge: `Cancelled by customer`.

### Flow 3: Salon Settings & Policy Setup
1. **Open Settings**: Owner opens `/app/settings` -> `GET /api/settings` loads salon configuration and existing gallery photos.
2. **Brand Logo & Gallery Upload**: Owner uploads square brand logo or gallery photos (up to `MAX_GALLERY_PHOTOS = 5`) via `ImageUploader`:
   - Client compresses image via canvas in-browser (<=200KB for gallery, <=60KB square crop for logo).
   - Server verifies magic bytes and uploads to Supabase Storage `salon-media` bucket (`POST /api/upload`).
   - Gallery photo entries are saved in `salon_photos` (`POST /api/settings/photos`).
3. **Operating Rules**: Owner sets open/close times, slot step (e.g. 30m), buffer gap (e.g. 10m), advance notice hours, and cancellation policy window (*"Customers can cancel/reschedule up to ___ hours before"*).
4. **Save**: Click "Save Settings" -> `PUT /api/settings` validates values (cancellation hours strictly 0-72, logo path strictly in salon's own storage or existing external URL) and updates `salons` table.
5. **Temporary Closures**: Owner navigates to "Holidays & Closures" tab to block festival dates or renovation days (`POST /api/holidays`).

### Flow 4: Owner Review Moderation & Reply Management
1. **Open Reviews**: Owner navigates to `/app/reviews`. If on Basic plan, an upgrade banner prompting upgrade to Pro/Premium is displayed.
2. **View Analytics**: Dashboard displays average rating score (e.g. 4.8 / 5.0), total count, 5-to-1 star distribution bars, and staff-wise performance averages.
3. **Filter Reviews**: Owner filters by visibility status (`all`, `visible`, `hidden`), star rating (1 to 5), or stylist.
4. **Reply to Feedback**: Owner clicks "Reply" or "Edit Reply" on any review card. Modal opens allowing an official response up to 300 characters. Submitting calls `PATCH /api/reviews/[id]` with `{ owner_reply }`.
5. **Visibility Moderation**: Owner can toggle "Hide" / "Unhide" for any review. Hidden reviews are immediately excluded from public booking pages and the salon's public average rating. Calls `PATCH /api/reviews/[id]` with `{ status: 'hidden' | 'visible' }`.

### Flow 5: Staff Weekly Shifts & Leave Management
1. **Open Schedule Editor**: From `/app/staff`, owner clicks the calendar/clock icon "Manage Shifts & Leaves" next to any staff member.
2. **Edit Weekly Shifts**:
   - 7-day schedule (Sunday to Saturday) with toggle for Working / Off, start time, and end time.
   - "Copy salon hours" button quickly presets start and end times to the salon's default opening and closing hours.
   - Server validates shifts lie strictly within salon open/close hours.
   - On save (`PUT /api/staff/[id]/shifts`), upserts into `staff_shifts`.
   - Returns a non-destructive warning list of existing booked appointments that conflict with shortened shifts or newly marked off days (appointments are never auto-cancelled).
3. **Manage Planned Leaves**:
   - Owner switches to "Staff Leaves" tab to add dates (`from_date`, `to_date`, `reason` max 120 chars).
   - Past leaves are displayed greyed out; upcoming leaves can be removed (`DELETE /api/staff/[id]/leaves`).
   - Adding a leave (`POST /api/staff/[id]/leaves`) checks for existing booked appointments during that period and surfaces them as a warning banner.
4. **Calendar & Walk-in Integration**:
   - In `/app/appointments`, Multi-Stylist Lanes greys out stylists who are on leave or off, showing "🌴 Leave" or "⛔ Off" indicators.
   - Walk-in appointments booked via ERP check `getStaffWorkingWindow` and block scheduling when a stylist is off, on leave, or outside shift hours.

---

## 7. Business Rules and Edge Cases
- **Tenant Isolation**: Every database query strictly filters by `salon_id = auth.session.salonId`. `salon_id` is never read from request body.
- **Role Enforcement**:
  - `owner`: Has access to all settings, subscriptions, staff commissions, and deletions.
  - `staff`: Blocked from viewing financial reports, changing salon settings, or modifying subscriptions (`requireRole(session, ['owner'])` returns 403).
- **Subscription Gates**:
  - Gated by `src/lib/plan.ts`.
  - Basic: Max 3 staff, max 30 services, no logo upload, no custom domain, no export, no reviews management/showcase.
  - Pro: Max 10 staff, max 100 services, logo upload enabled, commission reports, memberships, export enabled, reviews management and public ratings showcase enabled.
  - Premium: Unlimited staff/services, custom domains, all features enabled.
  - Expired subscriptions return HTTP 402, redirecting owner to `/app/subscription`.
- **Demo Salon**: The demo salon `dixa-beauty-salon` allows instant one-click login via `/api/demo/owner-login` without entering a password.
- **Appointments Table Schema**: The `appointments` table has **no** `updated_at` column. Do not write to it.
- **Navigation Architecture (Mobile)**: Mobile navigation uses the responsive slide-out drawer exclusively (accessible from the top header hamburger menu). The mobile bottom dock navigation bar was retired to reclaim 96px vertical viewport real estate and avoid UI clipping.
- **Cache Security & Back-Forward Cache (bfcache)**:
  - Middleware (`src/proxy.ts`) enforces `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`, `Pragma: no-cache`, and `Expires: 0` for all `/app/*` and `/admin/*` routes.
  - Logout API (`/api/logout`, `/api/admin/logout`) sets immediate cookie expiration (`expires: new Date(0)`) and cache-busting headers.
  - App and Admin layouts listen for `pageshow` with `event.persisted` to force an immediate `window.location.reload()` when restored from bfcache, and execute `window.location.replace('/login')` on logout. This completely prevents stale authenticated dashboard views from appearing when tapping browser Back.
- **Inventory Alert Catalog Integrity**: The dashboard differentiates between zero stock warnings on existing inventory ("All retail product stocks are healthy!") and an empty product catalog ("No retail products found" with CTA to `/app/products`) by checking `totalProducts > 0`.
- **Appointments Filter Bar & Viewport Responsiveness**: Horizontal filter list (`All Stylists`, `all`, `scheduled`, `arrived`, `done`) enforces `pb-2.5 sm:pb-3` padding so the horizontal scrollbar does not sit tightly flush against action buttons on narrow or mobile viewports.
- **Stylist Lanes Grid Flexibility**: Stylist Lanes view adjusts `minWidth` dynamically (`100%` when viewing 1 stylist, `minmax(220px, 1fr)` when viewing multiple stylists) with smooth touch-scrolling, ensuring clean presentation on narrow 320px screens without arbitrary empty width blocks.
- **Universal Floating Toast Alerts**: Action feedback messages across bookings, updates, and cancellations render via a global floating toast notification at bottom-right (`src/components/ui/ToastContainer.tsx`), preventing notifications from being missed when scrolled down.
- **Customer Directory Focus**: Client roster strictly surfaces full client names prominently, without distracting "Member since" badges or promotional WhatsApp broadcasts.

---

## 8. Shared Dependencies
- `src/lib/api-auth.ts`: `requireTenant`, `requireRole`, `invalidateUserAuthCache`.
- `src/lib/auth.ts`: `COOKIE_NAME` (`salonpro_session`), `verifySessionToken`.
- `src/lib/availability.ts`: `getStaffWorkingWindow`, `getStaffWorkingWindowsForDate`, `findConflictingAppointmentsForShifts`, `findConflictingAppointmentsForLeave`.
- `src/lib/plan.ts`: `getSalonPlan`, `requireFeature`, `requireLimit`.
- `src/proxy.ts`: Directs authenticated owners hitting `/login` or `/` to `/app`.

---

## 9. Cross-Panel Effects
- **Owner Cancellation**: When an owner cancels an appointment via ERP, `cancelled_by` is set to `'owner'`. The customer sees this as cancelled in `/portal`.
- **Operating Hours Update**: Modifying `open_time`, `buffer_minutes`, or `cancel_policy_hours` immediately alters the slots rendered to clients on `/[slug]` and cancellation eligibility in `/portal`.
- **Service/Staff Visibility**: Toggling `online_enabled = false` or `show_online = false` immediately hides that service/staff from public booking.
- **Staff Shifts & Leaves**: Updating a stylist's weekly shift or adding planned leave immediately removes unavailable slots from public online booking (`/[slug]`) and customer reschedule (`/portal`), and greys out their lane in owner calendar (`/app/appointments`).

---

## 10. Known Gaps / TODO / UNVERIFIED Items
- Razorpay Webhook endpoint (`/api/subscription/razorpay/webhook`) expects `RAZORPAY_WEBHOOK_SECRET` in production; in local development, it operates in test mode.
- Inventory restocking purchase-order management is not yet built (stock is updated directly via product edit or POS checkout).

---

## 11. "Where to Look First" Cheat Sheet
- **Dashboard metrics calculation**: `src/app/api/dashboard/stats/route.ts`
- **POS completion & checkout logic**: `src/app/api/live/sessions/[id]/complete/route.ts`
- **Owner appointments & calendar**: `src/app/app/appointments/page.tsx`
- **Staff shifts, leaves & availability helper**: `src/lib/availability.ts` & `src/app/app/staff/page.tsx`
- **Owner settings & timings**: `src/app/app/settings/page.tsx` & `src/app/api/settings/route.ts`
- **Commission calculations**: `src/app/api/reports/route.ts`

