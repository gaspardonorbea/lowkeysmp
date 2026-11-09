CREATE TABLE public.player_manual_kills (
 uuid text PRIMARY KEY,
 kills integer NOT NULL DEFAULT 0 CHECK (kills >= 0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.player_manual_kills TO authenticated;
GRANT ALL ON public.player_manual_kills TO service_role;
ALTER TABLE public.player_manual_kills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin reads manual kills" ON public.player_manual_kills FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.apply_manual_player_kills() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 NEW.kills := COALESCE((SELECT kills FROM public.player_manual_kills WHERE uuid = NEW.uuid), 0);
 RETURN NEW;
END;
$$;
CREATE TRIGGER player_stats_manual_kills BEFORE INSERT OR UPDATE ON public.player_stats FOR EACH ROW EXECUTE FUNCTION public.apply_manual_player_kills();
CREATE OR REPLACE FUNCTION public.set_player_kills(_uuid text, _kills integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Geen beheerrechten' USING ERRCODE = '42501'; END IF;
 IF _kills IS NULL OR _kills < 0 THEN RAISE EXCEPTION 'Kills moeten nul of hoger zijn'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.player_stats WHERE uuid = _uuid) THEN RAISE EXCEPTION 'Speler niet gevonden'; END IF;
 INSERT INTO public.player_manual_kills(uuid, kills) VALUES (_uuid, _kills) ON CONFLICT (uuid) DO UPDATE SET kills = EXCLUDED.kills, updated_at = now();
 UPDATE public.player_stats SET kills = _kills WHERE uuid = _uuid;
END;
$$;
REVOKE ALL ON FUNCTION public.set_player_kills(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_player_kills(text, integer) TO authenticated;
COMMENT ON TABLE public.player_stat_adjustments IS 'DEPRECATED: server kills are ignored; manual totals are stored in player_manual_kills';