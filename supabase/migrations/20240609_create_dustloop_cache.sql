-- 2024-06-09: create dustloop_cache table
-- Holds cached Dustloop JSON for each game.
-- Run this script in Supabase SQL editor or via supabase db push.

CREATE TABLE IF NOT EXISTS public.dustloop_cache (
    id         BIGSERIAL PRIMARY KEY,
    game_id    TEXT      NOT NULL UNIQUE,
    data       JSONB     NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast retrieval of the most recent refresh timestamp
CREATE INDEX IF NOT EXISTS idx_dustloop_cache_updated_at
    ON public.dustloop_cache (updated_at DESC);

-- Enable Row-Level Security
ALTER TABLE public.dustloop_cache ENABLE ROW LEVEL SECURITY;

-- Allow public reads (anon + authenticated)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dustloop_cache' 
        AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access" 
            ON public.dustloop_cache FOR SELECT 
            USING (true);
    END IF;
END
$$;

-- GRANTs: service_role needs full table + sequence access for the edge function
GRANT ALL ON public.dustloop_cache TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.dustloop_cache_id_seq TO service_role;

-- GRANTs: anon + authenticated need read-only access for the frontend
GRANT SELECT ON public.dustloop_cache TO anon;
GRANT SELECT ON public.dustloop_cache TO authenticated;
