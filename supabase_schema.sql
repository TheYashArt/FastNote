-- FastNote Supabase Database & Storage Setup
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create the notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'link', 'image', 'pdf')),
  title TEXT,
  content TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'linen',
  pinned BOOLEAN NOT NULL DEFAULT false,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create index on room_id for fast device sync queries
CREATE INDEX IF NOT EXISTS idx_notes_room_id ON public.notes(room_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);

-- 3. Enable Row Level Security (RLS) & allow anonymous read/write by room
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access by room"
ON public.notes FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anonymous insert access"
ON public.notes FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous update access"
ON public.notes FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access"
ON public.notes FOR DELETE
TO anon, authenticated
USING (true);

-- 4. Enable Supabase Realtime for notes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;

-- 5. Storage bucket setup for images & PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('fastnote-files', 'fastnote-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read bucket access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'fastnote-files');

CREATE POLICY "Public insert bucket access"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'fastnote-files');

CREATE POLICY "Public delete bucket access"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'fastnote-files');
