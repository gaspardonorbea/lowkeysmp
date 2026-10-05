create type public.app_role as enum ('admin');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create or replace function public.claim_admin() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.user_roles where role='admin') then
    return public.has_role(auth.uid(),'admin');
  end if;
  insert into public.user_roles(user_id, role) values (auth.uid(),'admin');
  return true;
end $$;
grant execute on function public.claim_admin() to authenticated;

create table public.announcements (id uuid primary key default gen_random_uuid(), title text not null, body text not null default '', pinned boolean not null default false, created_at timestamptz not null default now());
create table public.players (id uuid primary key default gen_random_uuid(), name text not null, role text not null default 'Speler', is_dead boolean not null default false, died_at timestamptz, death_cause text, created_at timestamptz not null default now());
create table public.opening_hours (id uuid primary key default gen_random_uuid(), day text not null, hours text not null, sort int not null default 0);

grant select on public.announcements, public.players, public.opening_hours to anon, authenticated;
grant insert, update, delete on public.announcements, public.players, public.opening_hours to authenticated;
grant all on public.announcements, public.players, public.opening_hours to service_role;
alter table public.announcements enable row level security;
alter table public.players enable row level security;
alter table public.opening_hours enable row level security;
create policy "read" on public.announcements for select using (true);
create policy "read" on public.players for select using (true);
create policy "read" on public.opening_hours for select using (true);
create policy "admin write" on public.announcements for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.players for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.opening_hours for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.opening_hours(day,hours,sort) values ('Maandag – Vrijdag','16:00 – 22:00',1),('Zaterdag','12:00 – 00:00',2),('Zondag','12:00 – 22:00',3);
insert into public.announcements(title,body,pinned) values ('Welkom op LowkeySMP!','De server is officieel open. Lees de regels, wees chill en vooral: lowkey peak.',true);
insert into public.players(name,role) values ('Steve','Owner'),('Alex','Speler');
insert into public.players(name,role,is_dead,died_at,death_cause) values ('Herobrine','Speler',true,now(),'Gevallen in lava');