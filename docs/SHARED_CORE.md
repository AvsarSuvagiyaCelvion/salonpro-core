# Shared Core Architecture & Infrastructure

> **Last verified:** 2026-11-06  
> **Status:** Verified against source code

---

## 1. Authentication & JWT Session Cookies

SalonPro operates three strictly isolated authentication realms powered by `jose` (HS256 signed JWTs) using `SESSION_SECRET`:

| Cookie Name | Exported Constant | Realm / Role | Expiration | Key Payload Fields | Verification Function |
|---|---|---|---|---|---|
| `salonpro_session` | `COOKIE_NAME` | Tenant Owner & Staff | 7 days | `email`, `role`, `salonId`, `userId`, `salonSlug` | `verifySessionToken()` in `src/lib/auth.ts`, `requireTenant()` in `src/lib/api-auth.ts` |
| `salonpro_customer_session` | `CUSTOMER_COOKIE_NAME` | Client / Customer | 30 days | `customerId`, `mobile`, `name`, `salonId`, `role: 'customer'` | `verifyCustomerSessionToken()` in `src/lib/auth.ts` |
| `salonpro_admin_session` | `ADMIN_COOKIE_NAME` | Platform Super Admin | 8 hours | `email`, `role: 'super_admin'` | `verifyAdminSessionToken()` in `src/lib/auth.ts`, `requireAdmin()` in `src/lib/api-auth.ts` |

### Security Golden Rule
> **CRITICAL**: Never read or trust `salon_id` or `customer_id` from the request body or query parameters in authenticated endpoints. Always derive `salonId` and `userId`/`customerId` exclusively from the verified JWT cookie via `requireTenant` or `verifyCustomerSessionToken`.

---

## 2. Next.js Middleware (`src/proxy.ts`)
The proxy middleware intercepts every incoming HTTP request and performs:
1. **Subdomain Extraction**: Resolves tenant slugs from headers:
   - Local development: `<slug>.localhost:3000`
   - Production root domain: `<slug>.salonpro.in`
   - Vercel preview URLs: `<slug>.<project>.vercel.app`
2. **Custom Domain Resolution**: Resolves third-party vanity domains (e.g. `booking.salonglam.com`) against `salons.custom_domain` with `custom_domain_verified = true` (backed by a 60-second in-memory cache).
3. **Internal URL Rewriting**:
   - `GET /` on a tenant subdomain rewrites internally to `/[slug]` (public booking wizard).
   - `GET /book` rewrites internally to `/book/[slug]`.
4. **Header Forwarding**: Strips incoming spoofed client headers and sets sanitized downstream headers:
   - `x-tenant-slug`: The resolved salon slug.
   - `x-current-host`: The incoming Host header.
5. **Route Protection**:
   - `/admin/*`: Redirects to `/admin/login` if `salonpro_admin_session` is missing.
   - `/app/*`: Redirects to `/login` if `salonpro_session` is missing.
   - `/api/*`: Checks `PUBLIC_API_PREFIXES` whitelist; otherwise requires a valid tenant or admin session.

---

## 3. Permissions & Role Hierarchy
- **`super_admin`**: Full platform authority across all salons, plans, domains, and global analytics.
- **`owner`**: Full salon tenant authority. Can edit salon settings, operating hours, cancellation policies, staff commissions, product prices, and manage subscription billing.
- **`staff`**: Operational floor authority. Can view appointments, manage live sessions, add services/products, and complete POS billing. Blocked from viewing business commission reports, modifying salon settings, or changing plans.
- **`customer`**: Self-service client authority. Can view personal appointments and receipts, cancel or reschedule bookings within policy windows.

### Role Re-verification
In `requireTenant()`, the user's role is not blindly trusted from the JWT: it re-queries `users.role` from PostgreSQL (with a 10-second in-memory cache `userAuthCache`) to immediately enforce role downgrades or account deactivations.

---

## 4. Database Connection Pool (`src/lib/db.ts`)
- **Library**: `pg` (`Pool`).
- **Global Pool Caching**: Cached on `global.__dbPool` to preserve connection pools across warm serverless execution lambdas.
- **Connection Configuration**:
  - `connectionString`: `process.env.DATABASE_URL`
  - `max`: `process.env.DB_POOL_MAX` (defaults to 3 connections per serverless instance to prevent Supabase connection exhaustion)
  - `idleTimeoutMillis`: 30,000ms
  - `connectionTimeoutMillis`: 10,000ms
  - `ssl`: Uses `rejectUnauthorized: true` with `process.env.DATABASE_CA_CERT` if provided; otherwise `{ rejectUnauthorized: false }`.
- **Automatic Retry**: Idempotent `SELECT` and `WITH` queries automatically retry once with a 150ms backoff if a transient network disconnect (`ECONNRESET`, `ETIMEDOUT`) occurs.

---

## 5. Rate Limiting (`src/lib/rate-limit.ts`)
- **Dual-Layer Engine**: Fast in-memory map cache backed by PostgreSQL persistent table `auth_rate_limits`.
- **Client IP Extraction**: Reads first IP from `x-forwarded-for` or `x-real-ip`.
- **Enforced Rate Limits**:
  - Public booking submissions: Max 20 attempts per IP per 15 minutes.
  - Customer booking PIN attempts: Max 5 incorrect PIN attempts per (salon, mobile) per 15 minutes.
  - Admin login: Max 10 attempts per IP per 15 minutes.
  - Customer appointment self-service actions: Max 30 requests per minute per customer.

---

## 6. SaaS Plans & Feature Flags (`src/lib/plan.ts`)

| Plan Slug | Plan Name | Staff Limit | Service Limit | WhatsApp msgs/mo | Key Feature Flags Enabled |
|---|---|---|---|---|---|
| `basic` | Basic Plan | 3 staff | 30 services | 0 | Public booking, POS checkout |
| `pro` | Pro Studio | 10 staff | 100 services | 200 | `logo_upload`, `commission_report`, `memberships`, `calendar_view`, `customer_cancel`, `export`, `coupons` |
| `premium` | Enterprise / Luxury | Unlimited (0) | Unlimited (0) | 1,000+ | All Pro features + `custom_domain`, `priority_support` |

- **Trial Period**: Every newly registered salon automatically receives a 14-day Pro trial (`trial_ends_at = NOW() + 14 days`).
- **Caching**: Plan context is cached for 30 seconds (`planCache`). Calling `invalidateSalonPlanCache(salonId)` purges it when settings or subscriptions change.
- **Enforcement Helpers**:
  - `requireFeature(featureKey, salonId)`: Returns HTTP 403 if feature flag is false.
  - `requireLimit(limitKey, currentCount, salonId)`: Returns HTTP 403 if usage exceeds plan limit.

---

## 7. Storage & File Uploads
- **Current Architecture**: Salon brand logos are uploaded via client-side `FileReader` as base64 data URLs (`data:image/...;base64,...`) and stored directly in the `salons.logo_url` column in PostgreSQL.
- **Constraints**: Maximum file size is client-validated to <= 2MB. Saving a new logo requires the `logo_upload` plan feature.
- **No external S3/Cloud Storage**: There are currently no third-party object storage buckets required; the application does not rely on local filesystem writes for user uploads.

---

## 8. Date, Time & IST Helpers
- **Standard Timezone**: Indian Standard Time (`Asia/Kolkata`, UTC+05:30).
- **Time Formatting**: Uses `{ timeZone: 'Asia/Kolkata' }` on all `toLocaleDateString` and `toLocaleTimeString` calls.
- **Weekday Computation**: Day of week (0 = Sunday, 6 = Saturday) is strictly calculated at UTC noon to avoid calendar day offset shifts across midnight:
  ```ts
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
  ```
- **Time Offset Parsing**: All ISO date-time strings are parsed explicitly with the `+05:30` offset:
  ```ts
  const startsAt = new Date(`${date}T${time}:00+05:30`);
  ```

---

## 9. Slot Generation & Overlap Serialization
Slot availability and collision prevention are governed by `src/lib/slots.ts` and atomic transactional locking:
1. **Candidate Slot Generation**: Iterates from `open_time` to `close_time` with step `slot_minutes` (e.g. 30 min) and buffer `buffer_minutes` (e.g. 10 min).
2. **Filters**:
   - Skips past slots in current IST time.
   - Skips slots within `min_advance_hours`.
   - Skips days outside `max_advance_days`.
   - Skips closed days from `working_days`.
   - Skips dates registered in `salon_holidays`.
3. **Advisory Transaction Lock**:
   ```sql
   SELECT pg_advisory_xact_lock(hashtext('salonId:staffId'));
   ```
   Locks specifically on the stylist within the salon so concurrent bookings for the same stylist are serialized.
4. **GiST Exclusion Constraint**: The database enforces physical overlap prevention via:
   ```sql
   EXCLUDE USING gist (staff_id WITH =, tstzrange(starts_at, ends_at) WITH &&)
   WHERE (status IN ('scheduled', 'arrived'))
   ```
5. **Conflict Response**: If an overlap is detected before or during the locked transaction, the API returns HTTP `409 Conflict`:
   ```json
   { "isOverlap: true, "error": "This time slot was just taken. Please choose another time." }
   ```

---

## 10. Demo Mode Rules
- **Demo Salon Slug**: `dixa-beauty-salon`.
- **Public Booking**: In `src/app/api/public/[slug]/book/route.ts`, bookings for `dixa-beauty-salon` simulate success, format WhatsApp links, and return without writing to the database.
- **Customer Cancellation & Rescheduling**: In `src/app/api/customer/appointments/[id]/route.ts`, simulated success is returned without altering persistent rows.
- **One-Click Owner Login**: `/api/demo/owner-login` allows public instant sign-in into the demo salon ERP dashboard without password prompts.
- **Production Seed Guard**: `scripts/setup-db.js` blocks `--seed` execution if `NODE_ENV === 'production'`.

---

## 11. Environment Variables Reference

| Variable Name | Required | Default / Fallback | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (Supabase pooled or direct). |
| `DATABASE_CA_CERT` | Optional | — | SSL Root Certificate Authority for self-hosted or strict Postgres SSL. |
| `DB_POOL_MAX` | Optional | `3` | Maximum active connections per serverless instance pool. |
| `SESSION_SECRET` | **Yes** | — | Secret key used by `jose` to sign and verify all JWT tokens. |
| `ADMIN_EMAIL` | Optional | — | Super admin fallback login email. |
| `ADMIN_PASSWORD` | Optional | — | Super admin fallback login password. |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Optional | `salonpro.in` | Root domain used for tenant subdomain extraction in proxy. |
| `RAZORPAY_KEY_ID` | Optional | — | Razorpay API key for subscription payments. |
| `RAZORPAY_KEY_SECRET` | Optional | — | Razorpay API secret key. |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | — | Webhook signing secret for subscription lifecycle events. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional | — | Client-side Razorpay key for checkout modal. |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Optional | `8320653782` | Contact support phone number displayed on landing and login. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional | `avsarsuvagiya968@gmail.com` | Contact support email. |

---

## 12. Complete Database Migration Catalog

| Migration File | Key Purpose & Tables Altered |
|---|---|
| `001_initial_schema.sql` | Enables `btree_gist`; creates `salons`, `staff`, `services`, `staff_services`, `products`, `customers`, `appointments` (with `no_overlap` constraint), `waiting`, `sessions`, `session_items`, `invoices`, `payments`. |
| `002_add_whatsapp_sent.sql` | Adds `whatsapp_sent boolean DEFAULT false` to `invoices`. |
| `003_add_settings_columns.sql` | Adds `address`, `phone`, and `booking_enabled` to `salons`. |
| `004_add_customer_auth.sql` | Adds `pin text` and `last_login_at timestamptz` to `customers`. |
| `005_platform_admins_secure.sql` | Creates `platform_admins` table for super admin accounts with hashed credentials. |
| `006_users_and_tenant_auth.sql` | Creates `users` table for multi-user tenant authentication (`owner`, `staff`) linked to `salons`. |
| `007_invoices_tax_and_tenant_indexes.sql` | Adds `tax_rate`, `tax_amount`, `subtotal` to `invoices`; creates tenant compound indexes. |
| `008_plans_limits.sql` | Creates `plans` table; adds `plan`, `trial_ends_at`, `subscription_status` to `salons`. |
| `009_auth_rate_limits_and_invoice_counter.sql` | Creates `auth_rate_limits` table; adds atomic sequential `invoice_counter` to `salons`. |
| `010_backfill_invoice_receipt_tokens.sql` | Generates 64-character unguessable `receipt_token` on `invoices` for anti-IDOR public receipt access. |
| `011_subscription_payments.sql` | Creates `subscription_payments` table for tracking Razorpay tenant subscriptions. |
| `012_dedupe_and_unique_customers.sql` | Cleans duplicate customer entries and adds unique constraint `(salon_id, mobile)` on `customers`. |
| `013_enable_rls_public_tables.sql` | Enables PostgreSQL Row Level Security (RLS) policies on core tables. |
| `014_salon_holidays.sql` | Creates `salon_holidays` table for scheduled temporary salon closures. |
| `015_customer_cancel_reschedule.sql` | Adds `cancel_policy_hours` to `salons` (default 2); adds `cancelled_by`, `cancelled_at`, and `rescheduled_count` to `appointments`. |

