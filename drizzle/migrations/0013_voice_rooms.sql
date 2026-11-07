CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE TABLE public.voice_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 40),
  is_private boolean NOT NULL DEFAULT false,
  password_hash text,
  channel_key uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.voice_rooms TO service_role;
ALTER TABLE public.voice_rooms ENABLE ROW LEVEL SECURITY;

CREATE VIEW public.voice_rooms_public WITH (security_invoker = false) AS
  SELECT id, name, is_private, created_at FROM public.voice_rooms
  WHERE created_at > now() - interval '7 days';
GRANT SELECT ON public.voice_rooms_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_voice_room(_name text, _password text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r public.voice_rooms;
BEGIN
  IF (SELECT count(*) FROM public.voice_rooms WHERE created_at > now() - interval '1 minute') > 5 THEN
    RAISE EXCEPTION 'Te veel kamers, wacht even';
  END IF;
  INSERT INTO public.voice_rooms(name, is_private, password_hash)
  VALUES (trim(_name), coalesce(_password,'') <> '',
          CASE WHEN coalesce(_password,'') <> '' THEN crypt(_password, gen_salt('bf')) END)
  RETURNING * INTO r;
  RETURN json_build_object('id', r.id, 'channel_key', r.channel_key);
END $$;

CREATE OR REPLACE FUNCTION public.join_voice_room(_id uuid, _password text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT channel_key FROM public.voice_rooms
  WHERE id = _id AND (password_hash IS NULL OR password_hash = crypt(coalesce(_password,''), password_hash));
$$;
GRANT EXECUTE ON FUNCTION public.create_voice_room(text, text), public.join_voice_room(uuid, text) TO anon, authenticated;