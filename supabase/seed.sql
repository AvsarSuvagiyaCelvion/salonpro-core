-- Clean existing data for idempotency
TRUNCATE TABLE customer_plans, package_plan_items, package_plans, membership_plans, payments, invoices, session_items, sessions, waiting, appointments, staff_services, products, services, staff, customers, salons CASCADE;

-- 1. Seed Salon "Glow Studio"
INSERT INTO salons (
  id, name, slug, brand_color, logo_url, open_time, close_time, working_days, slot_minutes, buffer_minutes, min_advance_hours, max_advance_days, send_reminders, address, phone, booking_enabled
) VALUES (
  'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d',
  'Glow Studio',
  'glow-studio',
  '#b3135b',
  '/logo.png',
  '10:00:00',
  '19:00:00',
  '{1,2,3,4,5,6}',
  30,
  10,
  1,
  14,
  true,
  '101, Titanium Square, Thaltej, Ahmedabad',
  '+91 98250 12345',
  true
);

-- 2. Seed Staff (3 members)
INSERT INTO staff (id, salon_id, name, role_title, service_commission_pct, product_commission_pct, active, show_online) VALUES
('11111111-1111-1111-1111-111111111111', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Priya Sharma', 'Senior Stylist', 10.00, 5.00, true, true),
('22222222-2222-2222-2222-222222222222', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Rahul Verma', 'Hair Colorist & Specialist', 12.00, 5.00, true, true),
('33333333-3333-3333-3333-333333333333', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Ananya Patel', 'Skin & Esthetician', 8.00, 5.00, true, true);

-- 3. Seed Services (8 services)
INSERT INTO services (id, salon_id, name, category, description, duration_min, price, online_enabled) VALUES
('a0000001-0000-0000-0000-000000000001', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Haircut & Styling', 'Hair', 'Precision haircut including shampoo, conditioning and blow dry finish', 45, 650.00, true),
('a0000001-0000-0000-0000-000000000002', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Hair Spa & Deep Conditioning', 'Hair', 'Intensive nourishing spa treatment for dry and damaged hair', 60, 1200.00, true),
('a0000001-0000-0000-0000-000000000003', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Balayage Hair Color', 'Color', 'Hand-painted sun-kissed natural hair highlights', 120, 3500.00, true),
('a0000001-0000-0000-0000-000000000004', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Keratin Smooth Treatment', 'Hair', 'Frizz-free smoothing treatment lasting up to 4 months', 150, 4500.00, true),
('a0000001-0000-0000-0000-000000000005', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'HydraFacial Glow', 'Skin', 'Deep pore cleansing, exfoliation, hydration and antioxidant infusion', 60, 2200.00, true),
('a0000001-0000-0000-0000-000000000006', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Deluxe Manicure & Pedicure', 'Nails', 'Complete nail care, scrub, massage and gel polish finish', 50, 1100.00, true),
('a0000001-0000-0000-0000-000000000007', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Bridal Glam Makeup', 'Makeup', 'HD bridal makeup with lashes, hair styling and draping', 90, 5500.00, true),
('a0000001-0000-0000-0000-000000000008', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Beard Styling & Trim', 'Grooming', 'Hot towel beard shaping, trimming and oil treatment', 25, 400.00, true);

-- Staff Services mapping
INSERT INTO staff_services (staff_id, service_id) VALUES
('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001'),
('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002'),
('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000008'),
('22222222-2222-2222-2222-222222222222', 'a0000001-0000-0000-0000-000000000001'),
('22222222-2222-2222-2222-222222222222', 'a0000001-0000-0000-0000-000000000003'),
('22222222-2222-2222-2222-222222222222', 'a0000001-0000-0000-0000-000000000004'),
('33333333-3333-3333-3333-333333333333', 'a0000001-0000-0000-0000-000000000005'),
('33333333-3333-3333-3333-333333333333', 'a0000001-0000-0000-0000-000000000006'),
('33333333-3333-3333-3333-333333333333', 'a0000001-0000-0000-0000-000000000007');

-- 4. Seed Products (3 products, one low stock)
INSERT INTO products (id, salon_id, name, brand, sku, price, cost_price, stock, min_stock, active) VALUES
('b0000001-0000-0000-0000-000000000001', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Moroccan Argan Hair Serum 100ml', 'Moroccanoil', 'SKU-ARG-001', 850.00, 450.00, 2, 5, true),
('b0000001-0000-0000-0000-000000000002', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Organic Volumizing Shampoo 250ml', 'L’Oréal Pro', 'SKU-SHP-002', 650.00, 320.00, 15, 5, true),
('b0000001-0000-0000-0000-000000000003', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Radiance Gold Facial Scrub 150g', 'O3+ Professional', 'SKU-SCB-003', 750.00, 380.00, 8, 3, true);

-- 5. Seed Customers (12 customers)
INSERT INTO customers (id, salon_id, name, mobile, email, note, birthday) VALUES
('c0000001-0000-0000-0000-000000000001', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Aarav Mehta', '9825012345', 'aarav.m@example.com', 'Prefers Priya for haircuts', '1992-05-14'),
('c0000001-0000-0000-0000-000000000002', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Diya Joshi', '9898023456', 'diya.j@example.com', 'Sensitive skin, uses mild products', '1995-11-20'),
('c0000001-0000-0000-0000-000000000003', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Rohan Shah', '9724034567', 'rohan.s@example.com', 'Regular customer every 2 weeks', '1988-03-08'),
('c0000001-0000-0000-0000-000000000004', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Sneha Patel', '9879045678', 'sneha.p@example.com', 'Likes balayage touch-ups', '1997-09-12'),
('c0000001-0000-0000-0000-000000000005', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Vikram Desai', '9909056789', 'vikram.d@example.com', 'Always on time', '1985-07-25'),
('c0000001-0000-0000-0000-000000000006', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Pooja Trivedi', '9426067890', 'pooja.t@example.com', 'VIP Customer', '1993-01-30'),
('c0000001-0000-0000-0000-000000000007', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Karan Dave', '9824078901', 'karan.d@example.com', 'Beard & haircut combo', '1990-12-05'),
('c0000001-0000-0000-0000-000000000008', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Meera Rao', '9899089012', 'meera.r@example.com', 'Prefers morning appointments', '1996-04-18'),
('c0000001-0000-0000-0000-000000000009', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Harsh Vora', '9712090123', 'harsh.v@example.com', 'Keratin treatment client', '1991-08-22'),
('c0000001-0000-0000-0000-000000000010', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Riya Bhatt', '9825101234', 'riya.b@example.com', 'Facial & manicure regular', '1998-02-14'),
('c0000001-0000-0000-0000-000000000011', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Nikhil Parekh', '9898112345', 'nikhil.p@example.com', 'Walk-in preferred', '1987-10-10'),
('c0000001-0000-0000-0000-000000000012', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Kavita Modi', '9724123456', 'kavita.m@example.com', 'Bridal package enquiry', '1994-06-29');

-- 6. Seed Membership & Package Plans
INSERT INTO membership_plans (id, salon_id, name, services_discount_pct, products_discount_pct, price, validity_days, active) VALUES
('d0000001-0000-0000-0000-000000000001', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Gold VIP Membership', 15.00, 10.00, 1999.00, 365, true);

INSERT INTO package_plans (id, salon_id, name, price, validity_days, active) VALUES
('e0000001-0000-0000-0000-000000000001', 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'Bridal Radiance Glow', 5999.00, 90, true);

INSERT INTO package_plan_items (package_id, kind, ref_id, qty) VALUES
('e0000001-0000-0000-0000-000000000001', 'service', 'a0000001-0000-0000-0000-000000000005', 2), -- 2 HydraFacial
('e0000001-0000-0000-0000-000000000001', 'service', 'a0000001-0000-0000-0000-000000000006', 2), -- 2 Mani-Pedi
('e0000001-0000-0000-0000-000000000001', 'product', 'b0000001-0000-0000-0000-000000000003', 1);  -- 1 Radiance Scrub

-- Assign membership to 1 customer (Pooja Trivedi)
INSERT INTO customer_plans (customer_id, kind, plan_id, starts_on, expires_on, amount_paid) VALUES
('c0000001-0000-0000-0000-000000000006', 'membership', 'd0000001-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days', 1999.00);

-- 7. Seed Appointments (Today and Tomorrow)
INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source, note) VALUES
('e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'c0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', CURRENT_DATE + TIME '11:00:00', CURRENT_DATE + TIME '11:45:00', 'scheduled', 'owner', 'Wants layered haircut'),
('e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'c0000001-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'a0000001-0000-0000-0000-000000000003', CURRENT_DATE + TIME '14:00:00', CURRENT_DATE + TIME '16:00:00', 'scheduled', 'online', 'Caramel highlights consultation'),
('e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d', 'c0000001-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'a0000001-0000-0000-0000-000000000005', (CURRENT_DATE + INTERVAL '1 day') + TIME '12:00:00', (CURRENT_DATE + INTERVAL '1 day') + TIME '13:00:00', 'scheduled', 'online', 'Pre-wedding facial');

-- 8. Seed 25 Past Invoices & Payments over the last 7 days
DO $$
DECLARE
  v_salon_id UUID := 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d';
  v_customers UUID[] := ARRAY[
    'c0000001-0000-0000-0000-000000000001'::UUID,
    'c0000001-0000-0000-0000-000000000002'::UUID,
    'c0000001-0000-0000-0000-000000000003'::UUID,
    'c0000001-0000-0000-0000-000000000004'::UUID,
    'c0000001-0000-0000-0000-000000000005'::UUID,
    'c0000001-0000-0000-0000-000000000006'::UUID,
    'c0000001-0000-0000-0000-000000000007'::UUID,
    'c0000001-0000-0000-0000-000000000008'::UUID,
    'c0000001-0000-0000-0000-000000000009'::UUID,
    'c0000001-0000-0000-0000-000000000010'::UUID,
    'c0000001-0000-0000-0000-000000000011'::UUID,
    'c0000001-0000-0000-0000-000000000012'::UUID
  ];
  v_amounts NUMERIC[] := ARRAY[650.00, 1200.00, 3500.00, 4500.00, 2200.00, 1100.00, 1850.00, 1050.00, 850.00, 2850.00, 400.00, 1500.00];
  v_methods TEXT[] := ARRAY['upi', 'cash', 'card', 'upi', 'card', 'cash'];
  v_cust_id UUID;
  v_inv_id UUID;
  v_sess_id UUID;
  v_amount NUMERIC;
  v_method TEXT;
  v_date TIMESTAMPTZ;
  v_i INT;
  v_days_ago INT;
BEGIN
  FOR v_i IN 1..25 LOOP
    v_days_ago := (v_i % 7);
    v_date := now() - (v_days_ago || ' days')::INTERVAL - ((v_i * 37 % 360) || ' minutes')::INTERVAL;
    v_cust_id := v_customers[((v_i - 1) % 12) + 1];
    v_amount := v_amounts[((v_i - 1) % 12) + 1];
    v_method := v_methods[((v_i - 1) % 6) + 1];

    -- Create completed session
    INSERT INTO sessions (salon_id, customer_id, status, started_at)
    VALUES (v_salon_id, v_cust_id, 'completed', v_date - INTERVAL '1 hour')
    RETURNING id INTO v_sess_id;

    -- Add session service item
    INSERT INTO session_items (session_id, kind, ref_id, name, staff_id, qty, unit_price)
    VALUES (
      v_sess_id, 
      'service', 
      'a0000001-0000-0000-0000-000000000001', 
      'Salon Service', 
      '11111111-1111-1111-1111-111111111111', 
      1, 
      v_amount
    );

    -- Create invoice
    INSERT INTO invoices (
      salon_id, session_id, number, customer_id, subtotal, discount_type, discount_value, discount_amount, total, created_at
    ) VALUES (
      v_salon_id,
      v_sess_id,
      'INV-2026-' || LPAD(v_i::TEXT, 4, '0'),
      v_cust_id,
      v_amount,
      'none',
      0,
      0,
      v_amount,
      v_date
    ) RETURNING id INTO v_inv_id;

    -- Create payment
    INSERT INTO payments (
      invoice_id, method, amount, reference, note, created_at
    ) VALUES (
      v_inv_id,
      v_method,
      v_amount,
      CASE WHEN v_method = 'upi' THEN 'UPI/' || (987654000 + v_i) WHEN v_method = 'card' THEN 'TXN-CARD-' || (1000 + v_i) ELSE 'CASH-PAID' END,
      'Settled in full',
      v_date
    );
  END LOOP;
END $$;
