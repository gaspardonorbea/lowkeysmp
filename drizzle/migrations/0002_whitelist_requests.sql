CREATE TABLE public.whitelist_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mc_name text NOT NULL CHECK (mc_name ~ '^[A-Za-z0-9_]{3,16}$'),
  irl_name text NOT NULL CHECK (length(irl_name) BETWEEN 1 AND 60),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.whitelist_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whitelist_requests TO authenticated;
GRANT ALL ON public.whitelist_requests TO service_role;
ALTER TABLE public.whitelist_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone requests" ON public.whitelist_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
CREATE POLICY "admin manages" ON public.whitelist_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));