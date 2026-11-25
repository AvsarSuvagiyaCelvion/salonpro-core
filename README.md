# StudioDesk Cloud ERP & Multi-Tenant Booking SaaS

StudioDesk is a full-featured, multi-tenant SaaS platform built for salons, spas, and beauty studios. It includes three interconnected portals:

1. **Client Booking & Self-Service Portal**: Mobile-first 4-step appointment booking wizard with real-time slot computation, stylist selection, appointment history, review ratings, and digital receipt view.
2. **Salon Owner & Staff ERP**: Live studio kanban board, appointment calendar, POS checkout & billing, inventory management, staff commissions, revenue analytics, and branding settings.
3. **Platform Super-Admin Portal**: Global tenant management, subscription tiers, platform metrics, security auditing, and plan entitlement control.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (Turbopack, App Router, React 19)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 14+ / Supabase with row-level locks and PostgreSQL advisory locks
- **Authentication**: JWT-based stateless tokens with bcrypt password/PIN hashing, brute-force rate-limiting, and 15-minute lockouts
- **Messaging**: Meta WhatsApp Cloud API (automated document templates with PDF receipts) & Twilio WhatsApp fallback
- **Testing**: Playwright End-to-End test suite across Mobile, Tablet, Laptop, and Desktop viewports

---

## 🚀 Quick Start Guide

### 1. Prerequisites

- **Node.js**: v20.x or higher
- **PostgreSQL**: PostgreSQL 14+ (or a Supabase cloud instance)
- **Package Manager**: npm or pnpm

### 2. Environment Setup

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

Key environment variables:
- `DATABASE_URL`: Connection string for PostgreSQL / Supabase. **Note:** In serverless environments (e.g. Vercel), ensure you use Supabase Transaction Pooler (port `6543`) with `?pgbouncer=true` to prevent connection exhaustion.
- `DB_POOL_MAX`: Maximum database client connections per serverless instance (defaults to `3`).
- `SESSION_SECRET`: 64-character secret string for session tokens and encryption
- `NEXT_PUBLIC_APP_URL`: Canonical public URL of your deployment
- `NEXT_PUBLIC_SUPPORT_PHONE`: WhatsApp support phone for password recovery
- `NEXT_PUBLIC_SUPPORT_EMAIL`: Support email address
- `WHATSAPP_CLOUD_API_TOKEN`: Meta Graph API token for automated WhatsApp PDF delivery
- `WHATSAPP_PHONE_NUMBER_ID`: Meta WhatsApp Phone Number ID
- `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Super-admin platform credentials
- `SUPABASE_URL`: Supabase project URL (e.g. `https://xyz.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role secret key (Server-only; used for authenticated storage uploads and deletions)

### 3. Supabase Storage Setup (`salon-media`)

StudioDesk uses a public-read Supabase Storage bucket for salon logos, branding images, and gallery photos:
1. In your **Supabase Dashboard**, navigate to **Storage** → **New Bucket**.
2. Set **Bucket Name** to: `salon-media`.
3. Toggle **Public Bucket** to **ON** (Allows public reads of images via CDN URLs without requiring query tokens).
4. Save bucket settings. Uploads, replacements, and deletions are handled exclusively via the server-side API (`/api/upload` and `/api/settings/photos`) using `SUPABASE_SERVICE_ROLE_KEY`.

### 4. Database Migration

Run all migrations in `supabase/migrations/` sequentially or run:

```bash
npm run db:setup
```

### 4. Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the application.

### 5. Production Build

```bash
npm run build
npm run start
```

---

## 🧪 Automated Testing

StudioDesk includes a comprehensive Playwright E2E test suite covering security, concurrency, auth rate-limiting, responsive layout, and billing workflows:

```bash
# Run all end-to-end tests
npx playwright test

# Run tests on specific viewports
npx playwright test --project="Desktop 1920x1080"
npx playwright test --project="Mobile 375x812"

# View HTML test execution report
npx playwright show-report tests/report
```

---

## 🔒 Security & Concurrency Architecture

- **Booking Concurrency & Advisory Locks**: Uses `pg_advisory_xact_lock(hashtext(key))` within PostgreSQL transactions to guarantee zero duplicate bookings across concurrent parallel requests.
- **Sequential Invoices**: Row-level locking (`FOR UPDATE`) on per-salon sequence counters guarantees sequential `INV-YYYY-XXXX` invoice numbers with unique `(salon_id, number)` constraints.
- **Unguessable Receipt Tokens**: Public digital receipts use 32-character cryptographic hex tokens (`/b/<token>`) instead of guessable sequential IDs.
- **Customer Privacy**: Customer mobile numbers on public receipts are automatically masked (e.g. `98XXXXX123`).
- **Auth Hardening**: PINs and passwords are encrypted with bcryptjs (cost factor 10). Failed login attempts are rate-limited with temporary 15-minute lockouts after 5 consecutive failures.
