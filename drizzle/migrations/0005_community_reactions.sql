CREATE TABLE public.content_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
 trailer_id uuid REFERENCES public.trailers(id) ON DELETE CASCADE,
 user_id uuid NOT NULL DEFAULT auth.uid(),
 display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 32),
 body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 1000),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (num_nonnulls(announcement_id, trailer_id) = 1)
);
GRANT SELECT ON public.content_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.content_comments TO authenticated;
GRANT ALL ON public.content_comments TO service_role;
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public comments" ON public.content_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Own comments" ON public.content_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own or moderate comments" ON public.content_comments FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX comments_announcement ON public.content_comments (announcement_id, created_at);
CREATE INDEX comments_trailer ON public.content_comments (trailer_id, created_at);
CREATE TABLE public.content_likes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
 trailer_id uuid REFERENCES public.trailers(id) ON DELETE CASCADE,
 user_id uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (num_nonnulls(announcement_id, trailer_id) = 1),
 UNIQUE (announcement_id, user_id),
 UNIQUE (trailer_id, user_id)
);
GRANT SELECT ON public.content_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.content_likes TO authenticated;
GRANT ALL ON public.content_likes TO service_role;
ALTER TABLE public.content_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public likes" ON public.content_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Own likes" ON public.content_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Unlike own" ON public.content_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE FUNCTION public.limit_comment_frequency() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));
 IF EXISTS (SELECT 1 FROM public.content_comments WHERE user_id = NEW.user_id AND created_at > now() - interval '10 seconds') THEN
  RAISE EXCEPTION 'Wacht even voor je opnieuw reageert.';
 END IF;
 NEW.created_at := now();
 RETURN NEW;
END;
$$;
CREATE TRIGGER limit_comment_frequency BEFORE INSERT ON public.content_comments FOR EACH ROW EXECUTE FUNCTION public.limit_comment_frequency();