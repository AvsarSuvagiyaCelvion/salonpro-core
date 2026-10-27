-- Extension for range overlap exclusions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Salons
CREATE TABLE IF NOT EXISTS salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  brand_color TEXT NOT NULL DEFAULT '#b3135b',
  logo_url TEXT,
  open_time TIME NOT NULL DEFAULT '10:00:00',
  close_time TIME NOT NULL DEFAULT '19:00:00',
  working_days INT[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  slot_minutes INT NOT NULL DEFAULT 30,
  buffer_minutes INT NOT NULL DEFAULT 10,
  min_advance_hours INT NOT NULL DEFAULT 1,
  max_advance_days INT NOT NULL DEFAULT 14,
  send_reminders BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Staff
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role_title TEXT,
  service_commission_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  product_commission_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  show_online BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration_min INT NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  online_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Staff Services
CREATE TABLE IF NOT EXISTS staff_services (
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- 5. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  sku TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  note TEXT,
  birthday DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','arrived','done','cancelled')),
  source TEXT NOT NULL DEFAULT 'owner' CHECK (source IN ('online','owner')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add no-overlap constraint to appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlap'
  ) THEN
    ALTER TABLE appointments 
    ADD CONSTRAINT no_overlap 
    EXCLUDE USING gist (
      staff_id WITH =, 
      tstzrange(starts_at, ends_at) WITH &&
    ) WHERE (status IN ('scheduled','arrived'));
  END IF;
END $$;

-- 8. Waiting
CREATE TABLE IF NOT EXISTS waiting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Sessions (Beauty Sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Session Items
CREATE TABLE IF NOT EXISTS session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('service','product')),
  ref_id UUID NOT NULL,
  name TEXT NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  qty INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- 11. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none','percent','fixed')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('cash','card','upi','online')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  reference TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Membership Plans
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  services_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  products_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  validity_days INT NOT NULL DEFAULT 365,
  active BOOLEAN NOT NULL DEFAULT true
);

-- 14. Package Plans
CREATE TABLE IF NOT EXISTS package_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  validity_days INT NOT NULL DEFAULT 90,
  active BOOLEAN NOT NULL DEFAULT true
);

-- 15. Package Plan Items
CREATE TABLE IF NOT EXISTS package_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES package_plans(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('service','product')),
  ref_id UUID NOT NULL,
  qty INT NOT NULL DEFAULT 1
);

-- 16. Customer Plans
CREATE TABLE IF NOT EXISTS customer_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('membership','package')),
  plan_id UUID NOT NULL,
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_on DATE NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0
);
