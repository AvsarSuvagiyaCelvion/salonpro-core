# Demo Spec: what the client's video shows, and what to build for the demo link

Source: the client's screen recording (about 6 minutes, a walkthrough of a salon management web app with a public booking page). The product in the video is another company's, and its branding is visible ("Powered by ..."). Build our own demo. Do NOT copy its name, logo, colours or exact layout. Take the ideas and the workflow only.

Frames I could not see clearly: booking wizard step 1 and step 3, Invoice settings, Payment Gateway settings, Access and URLs tab. Ask the client if these matter.

## 1. What is in the video (screen by screen, in order)

1. **Login.** Organisation or branch name on top. Email or username, password, Sign in. Text: "Contact your branch administrator for login assistance".
2. **Dashboard.** Period filter (this month). Four cards: Revenue, Sessions, Customers, Active staff. Revenue trend line chart (revenue and sessions by day). Popular services table (service, count, revenue). Top performing staff (staff, sessions, revenue). Payment status breakdown (Paid, Credit, Pending).
3. **Waiting area.** Button "Add customer to waiting". Pop-up: pick an existing customer or type a mobile number. New mobile number shows "New customer, please add details": first name, last name, email, notes. Waiting card shows name, wait time, and a "Start session" button.
4. **Sessions ("Beauty sessions").** "Start new session". A card per active customer: name, duration timer, services and products added (with staff name and price), total, payment status. Buttons: Service, Product, Complete.
5. **Complete session pop-up.** Customer, session ID, services, original total. Services discount (type: no discount, percentage, fixed amount; value). Products discount (same). Button: Complete session.
6. **Live studio.** One screen with three columns: Waiting area, Active sessions, Billing and payment. Refresh button.
7. **Process payment pop-up.** Total, paid, amount due. Payment amount. Method: Cash, Card, UPI, Online transfer. Notes.
8. **Billing and payments table.** Columns: session ID, customer, services count, total, paid, due, status (Paid, Partial, Pending), action icons. Show filters.
9. **Add payment pop-up.** Customer, session, total, amount due, payment amount, method, reference (transaction ID or cheque number), notes. Success message "Payment added successfully".
10. **Payment history.** Cards: total amount, total payments, cash payments, digital payments. Table: date and time, session, customer, method, reference, amount.
11. **Appointments.** Date range filter, filter by status, List and Calendar toggle, "New appointment". Table: date and time, customer, service, staff, status (Scheduled), actions (confirm, cancel).
12. **Management menu.** Customers, Appointments, Staff.
13. **Catalog: Services.** Cards: service name, description, price. "Add new service": name, description, price, duration in minutes. Edit and delete icons.
14. **Catalog: Products.** List with stock. Edit product: status (active), name, SKU, barcode, category, brand, selling price, cost price, stock quantity, minimum stock level, unit (bottle), track inventory checkbox, description, notes.
15. **Benefits: Membership plans.** Name, description, services discount %, products discount %, price, validity in days, status.
16. **Benefits: Members (membership subscribers).** List of customers with an active membership. Shows plan, discounts, start date, expiry, amount paid. Empty state: "No active membership subscribers".
17. **Benefits: Package plans.** "Add new package": name, description, price, validity days, status, package items (service or product, which one, quantity, Add). Card shows items with quantities, price, validity.
18. **Benefits: Assign benefits.** Search a customer by name or mobile. Then two actions: assign a membership, purchase a package (choose package, payment amount).
19. **Analytics: Reports.** Period (today, yesterday, last 7 days, last 30 days, last year) or custom dates. Tabs: Overview, Revenue, Staff performance, Services, Customers, Sessions. Overview: total revenue, total sessions, average session value, total customers, revenue by payment method (donut), payment status breakdown. Customers tab: top customers (sessions, total spent, average value).
20. **Analytics: Payment report.** Date range, Generate report, Export CSV, Print. Cards: total payments, services revenue, products revenue, completed sessions. Payment method summary (cash, card, UPI, online, credit). Day-wise breakdown table with totals.
21. **Analytics: Staff performance.** Date range, service commission %, product commission %. Overall table: staff, sessions, services, services revenue, products revenue, total revenue, average value, commission. Top services by staff.
22. **Settings (tabs):** General, Branding, Invoice, Booking, Payment gateway, Access and URLs.
    - Branding: branch logo upload (PNG, JPG, SVG, max 2 MB), used on invoices.
    - Booking: public booking URL with an Enable toggle and copy button. Schedule: opens at, closes at, slot duration (15 min), buffer, working days (Mon to Sun), minimum advance (hours), maximum advance (days). Options: require staff confirmation, send reminders (24 hours before). Save booking settings.
23. **Public booking page (customer, no login).** Salon name, "Book an appointment online", a 3-step progress bar. Step 2 seen: Select service (searchable dropdown with description and duration), preferred staff (optional, "Any available staff"), select date, special requests, Back and Continue. Footer: "Questions? Call us at [number]".

## 2. What the client wants (from the call)
- Software like this video.
- A demo link first. If he likes the demo, he gives the project. We must send the link within 3 days.
- Bulk WhatsApp messages to about 500 customers (offers).
- Bill goes to the customer automatically on WhatsApp after the service.
- Software later rented to other salons, with revenue share.

## 3. What to put in the demo (priority)

### MUST (this wins the client)
1. Login with salon name and logo.
2. Dashboard: revenue, sessions, customers, active staff, 7-day revenue chart, popular services, payment status. Use seeded sample data.
3. **Live studio flow end to end:** add customer to waiting, start session, add service and product, complete with a discount, bill is made, payment (cash, card, UPI), status turns Paid or Partial.
4. **Bill sent on WhatsApp (shown as a preview message).** This is our strong point and the client asked for it. In the demo only show the message text and a "Sent" tick. Do not send for real.
5. Billing and payments table with Add payment.
6. Appointments (list view) with New appointment. **No double booking** for the same staff member. Show the error message when someone tries.
7. **Public booking page:** pick service, staff, date, free time slots only, name, mobile, code, confirmed. The booking appears in Appointments at once. This is the live moment in a meeting.
8. Customers list with search, and Services, Staff lists with add forms. Staff has commission %.
9. Reports: revenue by payment method and staff performance with commission.
10. Settings: logo upload, booking link, timings and working days, buffer, min and max advance days, reminders toggle. Changing them must change the public booking page.

### SHOULD (if time allows)
- Products with stock, low-stock alert, and stock goes down when sold.
- Membership plans and package plans, assign to a customer, discount applies at billing.
- Calendar view of appointments by staff.
- Payment history page.

### LATER (say "next phase", do not build for the demo)
- Real WhatsApp sending and bulk campaigns (needs WhatsApp Business API, templates, opt-in).
- Real payment gateway, invoice template editor, access and URL management.
- Multi-branch, multi-salon admin panel with plans and revenue (our SaaS Phase 2).
- Barcode scanning, CSV export, print.

## 4. How to make it ours (not a copy)
- Use SalonPro design: colours ink #2a1630, accent #b3135b, fonts Bricolage Grotesque and DM Sans. Show the client's salon name and logo.
- Extra things the video did not show, which we add: automatic WhatsApp bill, no double booking, free-slot logic, salon-branded customer page, later an Admin panel for many salons.

## 5. Three-day plan
- **Day 1:** project setup (Next.js, Supabase, Vercel), tables and seed data, login, layout and sidebar, Dashboard, Services, Staff, Customers.
- **Day 2:** Live studio (waiting, sessions, complete, bill), payments and billing table, Appointments with no-overlap rule, public booking page, WhatsApp bill preview.
- **Day 3:** Reports (payment method, staff commission), Settings that affect the booking page, products and memberships if time, polish, test on phone and laptop, deploy, send the link. Keep one spare hour.

## 6. Rules for the demo
- Label it "Demo with sample data". No real customer data.
- Use a real deployed link (Vercel), a demo login shown on the login page, and a Reset demo button.
- Test the full flow twice before sending: waiting, session, bill, payment, then public booking, then the appointment shows up.
- Do not promise the full video feature list at the Phase 1 price. Before agreeing the price, list which of the above belongs to Phase 1 and which to Phase 2.