# SalonPro SaaS — Complete Commercial Acquisition & Handover Package

This document is prepared for **Business Buyers, IT Agencies, Software Resellers, and SaaS Investors** acquiring the complete intellectual property, production source code, and white-label distribution rights for **SalonPro**.

---

## 1. Executive Summary

| Attribute | Details |
|---|---|
| **Product Name** | **SalonPro Cloud ERP & Multi-Tenant Booking Suite** |
| **Technology Stack** | Next.js 15 (React 19, Turbopack, App Router), PostgreSQL, Supabase, Tailwind CSS v4, Jose JWT |
| **Live Production Demo** | [https://salonpro-plum.vercel.app](https://salonpro-plum.vercel.app) *(1-Click Demo Sandbox built-in)* |
| **Target Customers** | Independent Salons, Luxury Spas, Barbershop Chains, Beauty Parlours, Nail & Skin Studios |
| **Ownership Rights Transferred** | **100% Full Source Code, Complete IP, Database Schemas, Zero Royalty / Resale Rights** |
| **Target Acquisition Price** | ₹35,000 – ₹50,000 (Immediate Buyout) |

---

## 2. Business Model & ROI for the Buyer (How to Make ₹3–5 Lakhs)

If you are an IT Agency, Freelancer, or Tech Entrepreneur, here is the proven monetization playbook:

### Strategy A: Turnkey B2B Reselling to Salons
* **One-time Setup Fee per Salon:** ₹15,000 to ₹25,000
* **Monthly Cloud & WhatsApp Maintenance:** ₹999 to ₹1,499 / month
* **Numbers with just 15 Local Salons:**
  * 15 salons × ₹20,000 setup = **₹3,00,000 instant cash**
  * 15 salons × ₹1,200/mo = **₹18,000 / month recurring passive MRR**
  * **Payback Period on your ₹35,000 investment:** Less than 14 days (Just 2 client signups)!

### Strategy B: Micro-SaaS Subscription (Nationwide Cloud)
* Offer a 7-day free trial on your custom domain.
* Basic Plan: ₹699/mo | Pro Plan: ₹1,299/mo | Enterprise: ₹2,499/mo.
* Automated lockout upon trial conclusion compels conversion.

---

## 3. Core Architectural Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│                          SALONPRO ARCHITECTURE                         │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ 1. Platform Admin  │ 2. Tenant ERP      │ 3. Client & Public Portal    │
│    (/admin)        │    (/app)          │    (/book, /portal, /b)      │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ • MRR Analytics    │ • Touch POS Cashier│ • Online Slot Picker         │
│ • Tenant Salons    │ • Daily Expenses   │ • Conflict Prevention        │
│ • Plan Pricing     │ • Net P&L in Hand  │ • 1-Tap UPI Receipt (/b)     │
│ • Security & Audit │ • Staff Commission │ • WhatsApp Direct Invoices   │
│ • Global UPI Setup │ • Live Studio Chair│ • Customer Loyalty Portal    │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

### Key Differentiators built for the Indian Market:
1. **0% MDR Direct UPI Payments:** Counter dynamic QR and 1-tap Google Pay / PhonePe deep-links direct funds straight into the salon's bank account with zero payment gateway cut.
2. **Device-Adaptive WhatsApp Invoicing:** Detects Desktop (`web.whatsapp.com`) vs Mobile (`api.whatsapp.com`) to avoid encoding corruption and deliver beautiful digital bills with PDF download.
3. **Daily Expenses & Net Profit Tracker:** Tracks petty cash outflows (tea, laundry, cleaning, supplies) and calculates `Net Profit in Hand = Gross Sales - Expenses`.
4. **1-Click WhatsApp Client Re-Engagement:** 1-tap promotion button to reactivate clients who haven't visited in 30+ days.
5. **Zero-Friction 7-Day Free Trial:** Newly registered salons are automatically provisioned with 4 starter services and lead stylist profile; upon trial expiration, multi-tenant middleware automatically suspends non-billing routes until reactivation.

---

## 4. 5-Minute Zero-Downtime Deployment Guide

Deploying SalonPro requires zero expensive servers. It runs entirely on free/hobby tiers of **Vercel** and **Supabase**:

### Step 1: Clone & Install Dependencies
```bash
git clone <your-private-repo-url>
cd salonpro
npm install
```

### Step 2: Configure Environment Variables (`.env.local`)
```env
# Supabase PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?sslmode=require
DB_POOL_MAX=20

# JWT Auth Secret
SESSION_SECRET=your-secure-random-32-char-session-secret

# Razorpay Test / Live Keys
RAZORPAY_KEY_ID=rzp_live_xxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxx

# Super Admin Credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123
```

### Step 3: Run Database Migrations
Run the SQL files in `supabase/migrations/` sequentially (001 to 025) in your Supabase SQL Editor.

### Step 4: Deploy to Vercel
Connect your GitHub repository to Vercel and hit **Deploy**. The Next.js 15 Turbopack pipeline compiles all 90 routes in under 45 seconds.

---

## 5. Security & Multi-Tenancy Guarantees
* **Strict Tenant Isolation:** Every database query enforces `salon_id` extracted from cryptographically signed HS256 JWT cookies; incoming IDs from request bodies are rejected.
* **Anti-IDOR Public Receipts:** Receipts use unguessable 128-bit cryptographic tokens (`receipt_token`); sequential invoice lookup requires tenant/owner authorization.
* **Rate-Limiting Protection:** Built-in sliding-window rate limiters block brute-force attempts on admin, tenant login, and public booking APIs.
* **Automated Security Verification:** Includes automated security test suite `node scripts/run-security-tests.js` (6/6 tests passing).

---

## 6. Handover Checklist for the Buyer
- [x] Full Git repository access transfer.
- [x] Complete database schema (Migrations 001 through 025).
- [x] Production Next.js 15 Turbopack verified build.
- [x] Platform Super Admin credentials setup guide.
- [x] 1-Click Sandbox Demo data isolation.
- [x] 100% White-Label resale rights.
