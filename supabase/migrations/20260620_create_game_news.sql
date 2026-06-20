-- 2026-06-20: create game_news table
-- Holds verified recent news and updates for each supported game.

CREATE TABLE IF NOT EXISTS public.game_news (
    id         BIGSERIAL PRIMARY KEY,
    game_id    TEXT      NOT NULL UNIQUE,
    title      TEXT      NOT NULL,
    date       TEXT      NOT NULL,
    url        TEXT      NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.game_news ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon + authenticated)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_news' 
        AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access" 
            ON public.game_news FOR SELECT 
            USING (true);
    END IF;
END
$$;

-- Allow public insert/update access for the validation scripts using the public anon client
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_news' 
        AND policyname = 'Allow public insert access'
    ) THEN
        CREATE POLICY "Allow public insert access" 
            ON public.game_news FOR INSERT 
            WITH CHECK (true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_news' 
        AND policyname = 'Allow public update access'
    ) THEN
        CREATE POLICY "Allow public update access" 
            ON public.game_news FOR UPDATE 
            USING (true)
            WITH CHECK (true);
    END IF;
END
$$;

-- GRANTs: anon + authenticated need read/write access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_news TO authenticated;
GRANT ALL ON public.game_news TO service_role;

GRANT USAGE, SELECT ON SEQUENCE public.game_news_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.game_news_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.game_news_id_seq TO service_role;
