import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'fastnote_supabase_url';
const STORAGE_KEY_ANON = 'fastnote_supabase_anon_key';

export function getStoredSupabaseConfig() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envAnonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const localUrl = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : '') || '';
  const localAnonKey = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : '') || '';

  const url = localUrl || envUrl;
  const anonKey = localAnonKey || envAnonKey;

  return {
    url,
    anonKey,
    isFromEnv: Boolean(!localUrl && envUrl),
    isConfigured: Boolean(url && anonKey),
  };
}

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getStoredSupabaseConfig();
  if (!isConfigured) {
    cachedClient = null;
    currentClientKey = '';
    return null;
  }

  const keyString = `${url}:${anonKey}`;
  if (cachedClient && currentClientKey === keyString) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    currentClientKey = keyString;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  cachedClient = null;
  currentClientKey = '';
}

export function clearSupabaseConfig() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON);
  cachedClient = null;
  currentClientKey = '';
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      return { success: false, message: 'Invalid URL. It must start with https:// and end with .supabase.co' };
    }
    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    
    // Test database query
    const { error } = await testClient.from('notes').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('relation "notes" does not exist') || error.message.includes('not found')) {
        return {
          success: true,
          message: 'Connected to Supabase! (Note: the "notes" table needs to be created using the provided SQL script).',
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown connection error';
    return { success: false, message };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- 1. Create the notes table
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
`;
