ALTER TABLE public.death_reports ADD COLUMN IF NOT EXISTS event_id text;
CREATE INDEX IF NOT EXISTS death_reports_event_id_idx ON public.death_reports (event_id);