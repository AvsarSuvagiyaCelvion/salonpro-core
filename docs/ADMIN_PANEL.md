# Platform Admin Panel Documentation

> **Last verified:** 2026-11-06  
> **Status:** Verified against source code

---

## 1. Purpose and Users
The Platform Admin Panel provides Google DeepMind / SalonPro platform super administrators with multi-tenant oversight: tenant salon provisioning, subscription and plan configuration, custom domain verification, platform-wide analytics (MRR, churn, total revenue), and administrative security controls.

---

## 2. Page Routes Table

| Route | File Path | What It Does | Key Components Used |
|---|---|---|---|
| `/admin/login` | `src/app/admin/login/page.tsx` | Super Admin login form. Protected by IP rate limiting and secure bcrypt password verification. | Admin login form |
| `/admin` | `src/app/admin/page.tsx` | Platform overview dashboard: total salons, active tenants, MRR, total platform appointments, and recent signups. | KPI metric cards |
| `/admin/salons` | `src/app/admin/salons/page.tsx` | Tenant directory: search, inspect salon details, toggle active/inactive status, manually change plan, and verify custom domains. | Salons table & edit modal |
| `/admin/owners` | `src/app/admin/owners/page.tsx` | Owner accounts directory: inspect registered tenant owners, contact emails, mobile numbers, and linked salon workspaces. | Owners table |
| `/admin/plans` | `src/app/admin/plans/page.tsx` | SaaS plan editor: configure Basic, Pro, and Premium plans, monthly prices, staff/service limits, and feature flags. | Plan cards & feature toggles |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | SaaS business intelligence: MRR trend charts, plan distribution, and platform growth metrics. | `AreaTrendChart`, `DonutDistributionChart` |
| `/admin/security` | `src/app/admin/security/page.tsx` | Platform security console: manage super admin team accounts, review authentication rate-limiting locks, and audit events. | Security table & invite modal |

---

## 3. API Routes Table

| Endpoint | Methods | File Path | Auth Required | What It Does |
|---|---|---|---|---|
| `/api/admin/auth` | `GET`, `POST` | `src/app/api/admin/auth/route.ts` | None for `POST`; `salonpro_admin_session` for `GET` | Authenticates super admin using email/password (or environment fallback `ADMIN_EMAIL`/`ADMIN_PASSWORD`); sets `salonpro_admin_session` cookie. |
| `/api/admin/logout` | `POST` | `src/app/api/admin/logout/route.ts` | `salonpro_admin_session` | Clears `salonpro_admin_session` cookie. |
| `/api/admin/overview` | `GET` | `src/app/api/admin/overview/route.ts` | `salonpro_admin_session` (Role: `super_admin`) | Aggregates high-level metrics (active salons, trial salons, revenue, total appointments). |
| `/api/admin/salons` | `GET`, `POST` | `src/app/api/admin/salons/route.ts` | `salonpro_admin_session` (Role: `super_admin`) | Lists all tenant salons with plan and owner details, or provisions a new salon manually. |
| `/api/admin/salons/[id]` | `PATCH`, `DELETE` | `src/app/api/admin/salons/[id]/route.ts` | `salonpro_admin_session` (Role: `super_admin`) | Modifies salon plan, toggles active status, verifies custom domain, or purges salon. |
| `/api/admin/plans` | `GET`, `POST` | `src/app/api/admin/plans/route.ts` | `salonpro_admin_session` (Role: `super_admin`) | Lists all SaaS pricing plans and feature flags. |
| `/api/admin/plans/[id]` | `PATCH`, `DELETE` | `src/app/api/admin/plans/[id]/route.ts` | `salonpro_admin_session` (Role: `super_admin`) | Updates plan limits, pricing, and feature flags. |
| `/api/admin/admins` | `GET`, `POST`, `DELETE` | `src/app/api/admin/admins/route.ts` | `salonpro_admin_session` (Role: `super_admin`) | Manages platform administrator accounts in `platform_admins`. |
| `/api/admin/export` | `GET` | `src/app/api/admin/export/route.ts` | `salonpro_admin_session` (Role: `super_admin`) | Exports platform-wide salon directories and transaction records. |

---

## 4. Components Used Only by This Panel

| Component | File Path | Purpose |
|---|---|---|
| `AdminLayout` | `src/app/admin/layout.tsx` | Platform sidebar navigation, active admin badge, dark theme toggle, and session logout. |

---

## 5. Database Tables Touched

| Table | Key Columns Touched | Read/Write | Migration File |
|---|---|---|---|
| `platform_admins` | `id`, `email`, `password_hash`, `role`, `is_active`, `last_login_at` | Read / Write | `005_platform_admins_secure.sql` |
| `salons` | `id`, `name`, `slug`, `plan`, `subscription_status`, `custom_domain`, `custom_domain_verified`, `is_active`, `trial_ends_at`, `subscription_ends_at` | Read / Write | `001_initial_schema.sql`, `008_plans_limits.sql` |
| `users` | `id`, `salon_id`, `email`, `role`, `is_active` | Read / Write | `006_users_and_tenant_auth.sql` |
| `plans` | `id`, `slug`, `name`, `price_inr`, `max_staff`, `max_services`, `wa_per_month`, `flags` | Read / Write | `008_plans_limits.sql` |
| `subscription_payments` | `id`, `salon_id`, `amount`, `status`, `created_at` | Read | `011_subscription_payments.sql` |
| `appointments` | `id`, `salon_id`, `created_at` | Read (Aggregated Count) | `001_initial_schema.sql` |
| `invoices` | `id`, `salon_id`, `total` | Read (Aggregated Count) | `001_initial_schema.sql` |
| `auth_rate_limits` | `key`, `failed_attempts`, `locked_until` | Read / Write | `009_auth_rate_limits_and_invoice_counter.sql` |

---

## 6. Main User Flows

### Flow 1: Super Admin Authentication
1. **Visit `/admin/login`**: IP rate limiting is checked via `checkRateLimit('admin_auth_ip:<ip>', 10, 900)`.
2. **Submit Credentials**: Calls `POST /api/admin/auth`.
   - Checks `platform_admins` table for matching email.
   - Compares password using `bcrypt.compare`.
   - If not in table, verifies against fallback environment variables `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
   - On success: signs JWT with `role: 'super_admin'`, sets HTTP-only cookie `salonpro_admin_session` (8-hour expiration).
3. **Redirect**: Directs admin to `/admin`.

### Flow 2: Custom Domain Verification
1. **Tenant Request**: A Premium salon requests a custom domain (e.g. `booking.glamstudio.com`).
2. **Admin Verification**: Super admin visits `/admin/salons` and locates the tenant.
3. **Verify DNS**: Admin verifies that DNS CNAME points to SalonPro, then clicks "Verify Domain".
4. **Update DB**: Calls `PATCH /api/admin/salons/[id]` with `{ custom_domain_verified: true }`.
5. **Proxy Activation**: In `src/proxy.ts`, `resolveCustomDomain` reads the verified domain and immediately maps incoming HTTP traffic to that salon's booking pages.

### Flow 3: Plan Limits & Feature Flag Configuration
1. **Open Plan Editor**: Admin opens `/admin/plans`.
2. **Toggle Flags**: Admin updates feature flags (e.g. toggling `memberships`, `export`, or `customer_cancel`) or changes `max_staff` limit.
3. **Persist**: Calls `PATCH /api/admin/plans/[id]`.
4. **Cache Invalidation**: Triggers `invalidateSalonPlanCache()`, propagating updated entitlements across all tenant workspaces immediately.

---

## 7. Business Rules and Edge Cases
- **Strict Role Isolation**: Admin routes require `role === 'super_admin'`. Regular salon owners or staff cannot access `/admin/*` or `/api/admin/*`.
- **Environment Fallback**: In bootstrap or emergency recovery scenarios, `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env.local` grant super admin access even if the `platform_admins` table is empty.
- **Deactivating a Salon**: Setting `is_active = false` immediately prevents salon owners/staff from logging in (`SALON_INACTIVE` error) and disables public customer booking for that slug.
- **Trial Extensions**: Super admins can manually extend `trial_ends_at` or override `subscription_status` to `'active'` directly from the salon edit modal.

---

## 8. Shared Dependencies
- `src/lib/api-auth.ts`: `requireAdmin`.
- `src/lib/auth.ts`: `ADMIN_COOKIE_NAME` (`salonpro_admin_session`), `verifyAdminSessionToken`, `createAdminSessionToken`.
- `src/lib/plan.ts`: `invalidateSalonPlanCache`.
- `src/proxy.ts`: Intercepts all requests to `/admin/*` and redirects unauthenticated requests to `/admin/login`.

---

## 9. Cross-Panel Effects
- **Deactivating a Tenant**: Instantly locks out the owner panel (`/app/*`) and turns public booking (`/[slug]`) to a 404 / closed page.
- **Upgrading a Plan**: Immediately unlocks gated modules in the Owner Panel (e.g., custom logo upload, VIP memberships, and advanced reports).
- **Custom Domain Verification**: Allows customer traffic from third-party domains to render the salon booking wizard directly.

---

## 10. Known Gaps / TODO / UNVERIFIED Items
- Automated DNS lookup/verification via Cloudflare or AWS Route53 API is UNVERIFIED / currently done manually by the super admin.
- Direct tenant impersonation (logging into a tenant's dashboard as owner from the admin panel) is not yet supported.

---

## 11. "Where to Look First" Cheat Sheet
- **Admin authentication & login logic**: `src/app/api/admin/auth/route.ts`
- **Tenant management API**: `src/app/api/admin/salons/route.ts` & `src/app/api/admin/salons/[id]/route.ts`
- **Plan feature flags & pricing**: `src/app/api/admin/plans/route.ts`
- **Super admin layout & navigation**: `src/app/admin/layout.tsx`

