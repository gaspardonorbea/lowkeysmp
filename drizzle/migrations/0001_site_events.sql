create table public.site_events (id uuid primary key default gen_random_uuid(), kind text not null, visitor_id text not null, created_at timestamptz not null default now());
grant insert on public.site_events to anon, authenticated;
grant select on public.site_events to authenticated;
grant all on public.site_events to service_role;
alter table public.site_events enable row level security;
create policy "anyone logs" on public.site_events for insert to anon, authenticated with check (kind in ('visit','sub_nieuws','sub_deaths') and length(visitor_id) between 8 and 64);
create policy "admin reads" on public.site_events for select to authenticated using (public.has_role(auth.uid(),'admin'));