CREATE TABLE public.player_stats (
  uuid text PRIMARY KEY,
  name text NOT NULL,
  playtime_seconds bigint NOT NULL DEFAULT 0,
  kills int NOT NULL DEFAULT 0,
  totem_pops int NOT NULL DEFAULT 0,
  jumps int NOT NULL DEFAULT 0,
  km_walked numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.player_stats TO anon, authenticated;
GRANT ALL ON public.player_stats TO service_role;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player stats public read" ON public.player_stats FOR SELECT TO anon, authenticated USING (true);
GRANT ALL ON public.death_reports TO service_role;