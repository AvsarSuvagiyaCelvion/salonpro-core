-- Migration 022: Enforce Row Level Security (RLS) on all public tables
-- Ensures PostgREST / anonymous Supabase key cannot read/write directly

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

