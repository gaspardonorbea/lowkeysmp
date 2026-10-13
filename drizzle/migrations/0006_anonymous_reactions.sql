ALTER TABLE public.content_comments ADD COLUMN IF NOT EXISTS visitor_id uuid;
ALTER TABLE public.content_comments ADD COLUMN IF NOT EXISTS delete_token uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.content_comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.content_likes ADD COLUMN IF NOT EXISTS visitor_id uuid;
ALTER TABLE public.content_likes ALTER COLUMN user_id DROP NOT NULL;

GRANT INSERT ON public.content_comments TO anon;
GRANT INSERT ON public.content_likes TO anon;

CREATE OR REPLACE FUNCTION public.limit_comment_frequency()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  who text := coalesce(NEW.user_id::text, NEW.visitor_id::text, 'anon');
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(who, 0));
  IF EXISTS (
    SELECT 1 FROM public.content_comments
    WHERE coalesce(user_id::text, visitor_id::text, 'anon') = who
      AND created_at > now() - interval '10 seconds'
  ) THEN
    RAISE EXCEPTION 'Wacht even voor je opnieuw reageert.';
  END IF;
  NEW.created_at := now();
  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS "Own comments" ON public.content_comments;
CREATE POLICY "anyone comments" ON public.content_comments FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Own likes" ON public.content_likes;
CREATE POLICY "anyone likes" ON public.content_likes FOR INSERT TO anon, authenticated WITH CHECK (true);