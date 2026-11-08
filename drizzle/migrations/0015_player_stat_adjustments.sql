CREATE TABLE public.player_stat_adjustments (
  uuid text PRIMARY KEY,
  kills_offset integer NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.player_stat_adjustments TO service_role;
ALTER TABLE public.player_stat_adjustments ENABLE ROW LEVEL SECURITY;
INSERT INTO public.player_stat_adjustments (uuid, kills_offset, note)
VALUES ('7e6f2cf0-921b-4cd6-97e1-f5d232d2bf34', 11, 'DonutGaspa: 11 test-kills tellen niet mee');
UPDATE public.player_stats SET kills = 0 WHERE uuid = '7e6f2cf0-921b-4cd6-97e1-f5d232d2bf34';