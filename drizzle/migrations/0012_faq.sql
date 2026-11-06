CREATE TABLE public.faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL CHECK (length(question) BETWEEN 3 AND 500),
  answer text,
  asker_name text CHECK (asker_name IS NULL OR length(asker_name) <= 40),
  published boolean NOT NULL DEFAULT false,
  sort integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.faq TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq TO authenticated;
GRANT ALL ON public.faq TO service_role;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq public read" ON public.faq FOR SELECT TO anon, authenticated USING (published AND answer IS NOT NULL);
CREATE POLICY "faq ask" ON public.faq FOR INSERT TO anon, authenticated WITH CHECK (published = false AND answer IS NULL);
CREATE POLICY "faq admin" ON public.faq FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
INSERT INTO public.faq (question, answer, published, sort) VALUES
('Wat is LowkeySMP?', 'Een hardcore survival-event voor vrienden. Twee teams, Noord (rood) en Zuid (blauw), op één groot eiland gescheiden door een ijsmuur. Na je grace-periode betekent elke dood uitschakeling. De laatste die overblijft wint.', true, 1),
('Wanneer loopt het seizoen?', 'Van 7 tot 21 november 2026. De server opent op 7 november om 14:00. Alle mijlpalen vind je op de Events-pagina.', true, 2),
('Wat is de grace-periode?', 'Vanaf je eerste keer joinen heb je 60 minuten speeltijd waarin je gewoon respawnt als je doodgaat. Daarna kun je niet meer respawnen.', true, 3),
('Wat gebeurt er als ik doodga?', 'Je bent uitgeschakeld: je items vallen, je mag 60 seconden toekijken en daarna ga je naar de lobby. Vanaf 11 november krijg je een tweede kans op het Verliezerseiland.', true, 4),
('Wat is het Verliezerseiland?', 'Een aparte wereld voor uitgeschakelde spelers. Ga je daar dood, dan ben je definitief uit. Op 18 november is de finale van het Verliezerseiland, en wie wint kan herleefd worden.', true, 5),
('Wanneer smelt de ijsmuur?', 'Op 13 november om 18:00 verdwijnt de ijsmuur. Vanaf dan kunnen Noord en Zuid elkaar bereiken en wordt de chat globaal.', true, 6),
('Wanneer openen de Nether en de End?', 'De Nether opent op 14 november om 14:00, de End op 15 november om 18:00.', true, 7),
('Hoeveel totems mag ik hebben?', 'Maximaal 2 Totems of Undying per speler. Totems mogen niet in shulker boxes.', true, 8),
('Hoe zit het met de mace?', 'Er bestaat maar één mace op de hele server. Het team dat hem eerst craft krijgt hem; gaat hij kapot, dan is hij voorgoed weg. Na een smash-aanval heeft hij 10 minuten cooldown.', true, 9),
('Kan ik met het andere team chatten?', 'Nee, tot de ijsmuur smelt zie je alleen de chat van je eigen team en kun je geen privéberichten sturen naar het andere team.', true, 10),
('Hoe werkt de Hoofdfinale?', 'Op 21 november om 19:00 gaan alle overlevenden naar een aparte finalewereld met een krimpende wereldgrens. De laatste speler die overblijft wint. Wie al uit is kan meekijken met /spectate.', true, 11);