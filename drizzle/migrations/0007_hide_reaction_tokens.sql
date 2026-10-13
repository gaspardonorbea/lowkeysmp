REVOKE SELECT ON public.content_comments FROM anon, authenticated;
GRANT SELECT (id, announcement_id, trailer_id, user_id, display_name, body, created_at) ON public.content_comments TO anon, authenticated;

REVOKE SELECT ON public.content_likes FROM anon, authenticated;
GRANT SELECT (id, announcement_id, trailer_id, user_id, created_at) ON public.content_likes TO anon, authenticated;