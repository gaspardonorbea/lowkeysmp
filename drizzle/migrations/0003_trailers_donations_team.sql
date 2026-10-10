ALTER TABLE public.players ADD COLUMN team text CHECK (team IN ('noord','zuid'));

CREATE TABLE public.trailers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  video_url text,
  youtube_id text,
  released_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trailers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.trailers TO authenticated;
GRANT ALL ON public.trailers TO service_role;
ALTER TABLE public.trailers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read" ON public.trailers FOR SELECT USING (true);
CREATE POLICY "admin write" ON public.trailers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ign text NOT NULL,
  irl_name text NOT NULL DEFAULT '',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read" ON public.donations FOR SELECT USING (true);
CREATE POLICY "admin write" ON public.donations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "trailers admin upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='trailers' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "trailers admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='trailers' AND public.has_role(auth.uid(),'admin'));