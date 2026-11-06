-- Migration 016: Salon photos gallery
CREATE TABLE IF NOT EXISTS salon_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_photos_salon_id ON salon_photos(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_photos_sort_order ON salon_photos(salon_id, sort_order ASC);

-- Enable Row Level Security (RLS) consistent with migration 013
ALTER TABLE salon_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'salon_photos' AND policyname = 'Allow public read access on salon_photos'
  ) THEN
    CREATE POLICY "Allow public read access on salon_photos"
    ON salon_photos FOR SELECT
    USING (true);
  END IF;
END $$;

