-- Migration 023: Resilient storage objects fallback table
CREATE TABLE IF NOT EXISTS storage_objects (
  storage_path TEXT PRIMARY KEY,
  mime_type TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storage_objects_path ON storage_objects(storage_path);

-- Enable Row Level Security (RLS)
ALTER TABLE storage_objects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'storage_objects' AND policyname = 'Allow public read access on storage_objects'
  ) THEN
    CREATE POLICY "Allow public read access on storage_objects"
    ON storage_objects FOR SELECT
    USING (true);
  END IF;
END $$;

