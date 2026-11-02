ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_death_location_check;
ALTER TABLE public.players ADD CONSTRAINT players_death_location_check CHECK (death_location IS NULL OR death_location IN ('main','island','season'));
CREATE OR REPLACE FUNCTION public.clear_player_stats() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not allowed'; END IF;
  DELETE FROM public.player_stats WHERE uuid IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.clear_player_stats() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.clear_player_stats() TO authenticated;