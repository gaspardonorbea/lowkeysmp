CREATE TABLE IF NOT EXISTS public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site content public read" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site content admin write" ON public.site_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.death_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  died_at timestamptz NOT NULL DEFAULT now(),
  cause text,
  location text NOT NULL DEFAULT 'main' CHECK (location IN ('main', 'island')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.death_reports TO authenticated;
GRANT ALL ON public.death_reports TO service_role;
ALTER TABLE public.death_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "death reports admin" ON public.death_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.trailers ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'trailer';