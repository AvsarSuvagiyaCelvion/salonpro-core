# Demo Build Steps: from zero to a working client demo link

Goal: a live link (on Vercel) where every MUST feature in DEMO_SPEC.md really works, with sample data.

Stack: Next.js (React, TypeScript, Tailwind), Node API routes, PostgreSQL on Supabase, plain `pg` library, deployed on Vercel.

How to use this file: do the steps in order. For each step, paste the PROMPT into Antigravity (use /plan first for big steps), then do the CHECK yourself in the browser. Only go to the next step when the CHECK passes. Commit to git after every passing step.

---

## STEP 0: Accounts and folder (30 minutes, you do this, not the AI)

1. Folder `salonpro` with DEVELOPMENT.md, DEMO_SPEC.md and this file inside.

2. Supabase: new project (name salonpro, region Mumbai or Singapore). Save the database password. Copy the connection string (Project Settings, Database, Connection string, "Transaction pooler" or "URI").

3. GitHub: create an empty repository `salonpro` (private).

4. Vercel: sign in with GitHub.

5. Antigravity: create a project pointing to the `salonpro` folder.

CHECK: you have a Supabase connection string, an empty GitHub repo, and Antigravity open on your folder.

## STEP 1: Project skeleton and database connection

PROMPT:

> Read DEVELOPMENT.md and DEMO_SPEC.md. We are building a demo, not the full product. Create a Next.js (App Router, TypeScript, Tailwind) project in this folder. Add the `pg` library. Create `src/lib/db.ts` that connects with `process.env.DATABASE_URL` (use SSL, pool of max 5). Create `.env.local` with placeholders DATABASE_URL, DEMO_EMAIL=owner@glowstudio.demo, DEMO_PASSWORD=demo1234, SESSION_SECRET. Add `.env.local` to .gitignore. Create `/api/health` that runs `select now()` and returns it. Explain each command before I run it. Do not ask for my real keys in chat; tell me which file to paste them in.

CHECK: `npm run dev` runs. Open `/api/health`. It shows a date from the database. Then `git init`, commit, push to GitHub.

## STEP 2: Deploy early

PROMPT: none. Do this yourself: in Vercel, Add New Project, import the GitHub repo, add the same environment variables (DATABASE_URL, DEMO_EMAIL, DEMO_PASSWORD, SESSION_SECRET) in Project Settings, Deploy.

CHECK: the Vercel link opens, and `/api/health` on that link shows a database date. From now on every `git push` updates the demo link.

## STEP 3: Database tables and sample data

PROMPT:

> Create SQL migration files in `supabase/migrations/` (just plain SQL, numbered) and a small script `npm run db:setup` that runs them and then `seed.sql` against DATABASE_URL. Tables: salons (id, name, slug, brand_color, logo_url, open_time, close_time, working_days int[], slot_minutes, buffer_minutes, min_advance_hours, max_advance_days, send_reminders), staff (id, salon_id, name, role_title, service_commission_pct, product_commission_pct, active, show_online), services (id, salon_id, name, category, description, duration_min, price, online_enabled), staff_services (staff_id, service_id), products (id, salon_id, name, brand, sku, price, cost_price, stock, min_stock, active), customers (id, salon_id, name, mobile, email, note, birthday), appointments (id, salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status: scheduled|arrived|done|cancelled, source: online|owner, note), waiting (id, salon_id, customer_id, created_at), sessions (id, salon_id, customer_id, status: active|completed, started_at), session_items (id, session_id, kind: service|product, ref_id, name, staff_id, qty, unit_price), invoices (id, salon_id, session_id, number, customer_id, subtotal, discount_type, discount_value, discount_amount, total, created_at), payments (id, invoice_id, method: cash|card|upi|online, amount, reference, note, created_at), membership_plans (id, salon_id, name, services_discount_pct, products_discount_pct, price, validity_days, active), package_plans (id, salon_id, name, price, validity_days, active), package_plan_items (package_id, kind, ref_id, qty), customer_plans (id, customer_id, kind: membership|package, plan_id, starts_on, expires_on, amount_paid). Add this no-overlap rule: `create extension if not exists btree_gist; alter table appointments add constraint no_overlap exclude using gist (staff_id with =, tstzrange(starts_at, ends_at) with &&) where (status in ('scheduled','arrived'));`. Every salon-owned table has salon_id. Seed ONE salon "Glow Studio" (slug glow-studio, open 10:00, close 19:00, Mon to Sat, slot 30, buffer 10, min advance 1 hour, max advance 14 days), 3 staff, 8 services with sample prices, 3 products (one low stock), 12 customers, about 25 paid invoices over the last 7 days with payments (cash, upi, card) so the dashboard has real history, 3 appointments today and tomorrow, 1 membership plan, 1 package plan.

CHECK: run `npm run db:setup`. Open pgAdmin, connect to Supabase, and see the tables with rows. Try inserting two overlapping appointments for the same staff in pgAdmin: the second must fail with an error.

## STEP 4: Login and app layout

PROMPT:

> Build a simple demo login. `/login` page with email and password (pre-filled with the demo values shown below the form). `/api/login` checks DEMO_EMAIL and DEMO_PASSWORD and sets a signed httpOnly cookie (use the `jose` library with SESSION_SECRET). Middleware protects everything under `/app`. Build the owner layout under `/app` with a left sidebar: Dashboard, Live studio, Appointments, Billing and payments, Customers, Staff, Services, Products, Memberships and packages, Reports, Settings, Sign out. Top bar shows the salon name and logo. Mobile: the sidebar becomes a top scroll menu. Style: colours ink #2a1630, accent from the salon brand colour (default #b3135b), fonts Bricolage Grotesque and DM Sans, light and dark mode. Put a small banner "Demo with sample data" at the top.

CHECK: wrong password is refused with a clear message. Right password opens the dashboard shell. Visiting `/app` without login goes to `/login`. Sign out works. Check on phone width.

## STEP 5: Services, Staff and Customers (simple CRUD)

PROMPT:

> Build these pages under `/app` with API routes and real database reads and writes: (1) Services: table, "Add service" form (name, category, description, duration, price), edit, and a toggle for online booking. (2) Staff: table, "Add staff" form (name, role, service commission %, product commission %, services they do), toggle Working or On leave, toggle Show online. (3) Customers: table with search by name or mobile, "Add customer" form, show visits and total spent from invoices. Show clear success and error messages. Validate inputs on the server.

CHECK: add a service, a staff member and a customer. Refresh the page. They are still there. Check in pgAdmin that the rows exist.

## STEP 6: Live studio (the most important screen)

PROMPT:

> Build `/app/live` with three columns: Waiting, In service, To collect. Flow: "Add customer" pop-up (search an existing customer or type a mobile number; a new number asks for the name) adds to waiting. "Start session" moves the customer from waiting to an active session. On a session card: "+ Service" (pick service and staff), "+ Product" (pick product; refuse if stock is 0), a running total. "Complete" opens a pop-up with a services discount and a products discount (none, percentage, fixed) and creates an invoice with a number like INV-0001 in one database transaction: it reduces product stock, updates staff session count, and marks the session completed. The invoice then appears in "To collect". Use transactions for all multi-step writes.

CHECK: add a waiting customer, start a session, add 1 service and 1 product, complete with a 10% discount. The invoice total is correct and the product stock went down by 1. The customer disappears from In service and appears in To collect.

## STEP 7: Payments and billing

PROMPT:

> Build "Process payment" and "Add payment" pop-ups: amount (default the amount due), method (cash, card, UPI, online transfer), reference, note. Reject amounts above the due amount or below 1. An invoice with partial payments shows Partial, with full payment shows Paid, and with none shows Pending. Build `/app/billing`: table of invoices (number, customer, total, paid, due, status) with "View bill" and "Add payment". Build a bill view: items, discount, CGST 9% and SGST 9% (prices include GST, so calculate the tax inside the total), payment list. Also build a Payment history page: cards for total, cash and digital totals, and a table of payments.

CHECK: pay an invoice in two parts (cash then UPI). It goes Pending, Partial, Paid. Over-paying is refused. The numbers on the bill add up.

## STEP 8: WhatsApp bill preview (demo version)

PROMPT:

> After an invoice is created, show a "Bill sent on WhatsApp" panel: a green chat bubble with the message "Hi {first name}, thank you for visiting {salon}. Your bill {number}: {items}. Total ₹{total}. Download your bill: {site}/b/{number}". Create a public page `/b/[number]` that shows the bill (no login) so the link in the message really works. Add a "Send again" button that only shows a "Sent" tick. Do NOT call any real WhatsApp API. Add a small label "Demo: in the live product this is sent automatically".

CHECK: complete a session, see the WhatsApp preview, open the `/b/INV-xxxx` link in a private window, and see the bill.

## STEP 9: Appointments and the public booking page

PROMPT:

> (1) Owner side `/app/appointments`: list with date range and status filters, "New appointment" form (customer, service, staff, date, time). Statuses: scheduled, arrived, done, cancelled. "Arrived" adds the customer to the Waiting list. "Cancel" frees the time. If the database rejects an overlap (the no_overlap constraint), show: "This staff member is already booked at that time. Pick another time." (2) Free-slot logic in `src/lib/slots.ts`: a slot is free if it is inside salon open hours and working days, inside the max advance days, not earlier than min advance hours from now, the staff member is active and shows online and does that service, and it does not overlap another active appointment (include the service duration and buffer). "Anyone" picks the first free eligible staff member. (3) Public page `/{slug}` (for example /glow-studio) with the salon cover (logo, name, colour, hours) and a booking wizard: choose service, staff (or anyone), day, free time slots only; then name and mobile; then a 4-digit code (demo code 1234, say so on screen); then a confirmation with a WhatsApp-style message preview. Creating the booking inserts the customer if new, and the appointment as source online. If two people book the same slot, the second sees "This time was just taken, please pick another" and goes back to the times.

CHECK: book a slot on the public page from your phone. Open the owner Appointments page: it is there. Try to book the same staff and time again: refused. Cancel it in the owner page: the slot is free again on the public page. Mark another booking Arrived: the customer shows in Waiting.

## STEP 10: Dashboard and reports

PROMPT:

> Build `/app/dashboard`: period filter (today, 7 days, 30 days). Cards: revenue (from payments), sessions (completed), customers, active staff. Chart: revenue per day (use a small chart library or simple SVG, with labels and values readable in light and dark mode). Popular services (name, count, revenue), top staff (sessions, revenue), payment status counts (paid, partial, pending). Build `/app/reports`: tabs Overview and Staff. Overview: total revenue, sessions, average session value, revenue by payment method (bars or donut), payment status. Staff tab: service commission % and product commission % inputs, table with sessions, services revenue, products revenue, total, commission. All numbers come from real database queries, not hard-coded.

CHECK: complete a new session and pay it. Reload the dashboard: revenue and counts went up. Change a commission % and the commission column updates.

## STEP 11: Settings that change the public page

PROMPT:

> Build `/app/settings` with sections: Salon (name, address, phone), Branding (logo upload to Supabase Storage or as a base64 data URL for the demo, brand colour swatches that recolour the whole app and the public page), Booking (public link with a copy button and an Enable toggle, open and close time, slot length, buffer, working days, min advance hours, max advance days, send reminders toggle). Saving updates the salons row. The public booking page and the free-slot logic must read these values on every request.

CHECK: set closing time to 14:00: afternoon slots disappear on the public page. Uncheck Saturday: Saturday is unavailable. Change the brand colour: both the app and the public page change. Disable the public link: the public page shows "Booking is closed".

## STEP 12: SHOULD features (only if Steps 1 to 11 are done and tested)

PROMPT (products):

> Build `/app/products`: list with stock and a Low stock badge (stock at or below min), add and edit product (name, brand, SKU, price, cost price, stock, min stock, active).

PROMPT (memberships and packages):

> Build `/app/benefits`: membership plans (name, services discount %, products discount %, price, validity days), package plans (name, price, validity, included services with quantity), and "Assign to customer" (customer, plan, amount paid) which creates a customer_plans row. In the Complete session pop-up, if the customer has an active membership, pre-fill the discount from the plan.

CHECK: a low-stock product shows the badge. Assign a membership to a customer, start a session for that customer, complete it: the discount is pre-filled.

## STEP 13: Reset demo and polish

PROMPT:

> Add a protected `/api/demo/reset` and a "Reset demo data" button in the sidebar footer that clears all data and re-runs the seed. Add empty states with helpful text on every list. Add loading states and error toasts. Check every page on a 390px wide phone and on a laptop in light and dark mode. Fix text overflow, buttons smaller than 44px, and missing labels on inputs. Make the first page after login the dashboard.

CHECK: click Reset: sample data returns. No page has horizontal scroll on phone.

## STEP 14: Final test script (do this twice before sending the link)

Use the Vercel link, not localhost, and use your phone for the customer part.

1. Open the link, log in with the demo login. Dashboard shows numbers and a chart.

2. Live studio: add a new customer by mobile, start session, add a service and a product, complete with a 10% discount.

3. See the bill and the WhatsApp preview. Open the bill link in a private window.

4. Add a payment in two parts: cash, then UPI. Status turns Paid.

5. Dashboard and Reports: numbers went up.

6. Settings: change the brand colour and closing time. Open the public page `/glow-studio` on your phone: the colour and the time slots changed.

7. Book a slot on your phone with code 1234. See it in Appointments on the laptop.

8. Try to book the same time again: refused with a friendly message.

9. Mark that booking Arrived: the customer appears in Waiting.

10. Reports, Staff: commission looks right.

11. Click Reset demo. Everything returns to sample data. Fix anything that failed, then repeat from step 1.

## If you run out of time (cut in this order)

1. Step 12 (products, memberships, packages).

2. Calendar view and payment history page.

3. Logo upload (use text initials as the logo).

Never cut: Steps 6, 7, 8, 9, 11. These are what the client wants to see.

## Rules for the AI (repeat at the start of every new chat)

- Read DEVELOPMENT.md, DEMO_SPEC.md and DEMO_BUILD_STEPS.md and NOTES.md first.

- Do one step at a time. Show the plan first. Wait for me to say the CHECK passed.

- Use real database reads and writes. No fake or hard-coded data except the seed.

- Never put secrets in code. Tell me what to paste where.

- At the end of each work session, update NOTES.md with: done, broken, next.

## What to tell the client with the link

"This is a demo with sample data. Everything you see works: waiting list, sessions, billing, payments, appointments and the customer booking page. The WhatsApp bill is shown as a preview in the demo. In the full product it is sent automatically. Memberships, reports, and many-salon features are part of the full build."