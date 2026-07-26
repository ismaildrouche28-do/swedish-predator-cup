-- ============================================================
-- SWEDISH PREDATOR CUP — Datenbank-Schema
-- Postgres / Supabase
-- ============================================================
-- Einspielen in Supabase SQL Editor (einmalig).
-- Realtime: nach Einspielung im Supabase-Dashboard für
--   catches, penalties, competitions → aktivieren.
-- ============================================================

-- Benutzer (Teilnehmer)
create table if not exists users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  name         text not null,
  nickname     text,
  avatar_url   text,
  is_active    boolean not null default true,
  onboarding_done boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Wettkämpfe
create type competition_status as enum ('prep', 'running', 'paused', 'finished');

create table if not exists competitions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  location     text,
  start_at     timestamptz,
  end_at       timestamptz,
  timeout_start timestamptz,
  timeout_end   timestamptz,
  status       competition_status not null default 'prep',
  created_by   uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Wettkampf-Einstellungen
create table if not exists competition_settings (
  competition_id uuid primary key references competitions(id) on delete cascade,
  species_rules  jsonb not null default '{
    "perch":  {"min_cm": 25, "factor": 2.0, "label_de": "Barsch"},
    "zander": {"min_cm": 50, "factor": 1.3, "label_de": "Zander"},
    "pike":   {"min_cm": 60, "factor": 1.0, "label_de": "Hecht"}
  }'::jsonb,
  topwater_bonus       int  not null default 10,
  abriss_penalty       int  not null default 20,
  handling_ban_minutes int  not null default 10,
  max_fish_total       int  not null default 6,
  max_fish_per_species int  not null default 4,
  updated_at           timestamptz not null default now()
);

-- Boote
create table if not exists boats (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  label          text not null,
  sort_order     int  not null default 0
);

create table if not exists boat_members (
  boat_id uuid not null references boats(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  primary key (boat_id, user_id)
);

-- Calls
create type call_type as enum ('morning', 'mid', 'late');

create table if not exists calls (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  boat_id        uuid not null references boats(id) on delete cascade,
  user_id        uuid not null references users(id) on delete cascade,
  call_type      call_type not null,
  start_at       timestamptz not null,
  end_at         timestamptz not null,
  created_at     timestamptz not null default now()
);
create index if not exists calls_comp_idx on calls(competition_id, start_at);

-- Fänge
create type fish_species as enum ('perch', 'zander', 'pike');

create table if not exists catches (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  user_id        uuid not null references users(id) on delete cascade,
  species        fish_species not null,
  length_cm      int  not null check (length_cm > 0 and length_cm < 300),
  topwater       boolean not null default false,
  caught_at      timestamptz not null default now(),
  base_points    int  not null default 0,
  bonus_points   int  not null default 0,
  total_points   int  not null default 0,
  is_valid       boolean not null default true,
  is_scored      boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists catches_comp_user_idx on catches(competition_id, user_id);
create index if not exists catches_comp_time_idx on catches(competition_id, caught_at desc);

-- Strafen
create type penalty_type as enum ('abriss', 'handling');

create table if not exists penalties (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  user_id        uuid not null references users(id) on delete cascade,
  penalty_type   penalty_type not null,
  occurred_at    timestamptz not null default now(),
  points         int  not null default 0,
  ban_until      timestamptz,
  note           text,
  created_at     timestamptz not null default now()
);

-- Live-Ranking als View
create or replace view live_ranking as
select
  c.id           as competition_id,
  u.id           as user_id,
  u.name         as display_name,
  u.nickname,
  u.avatar_url,
  coalesce(sum(case when ca.is_scored then ca.total_points end), 0)::int as points,
  coalesce(sum(case when ca.is_scored then 1 end), 0)::int              as scored_count,
  coalesce((select sum(p.points) from penalties p
            where p.competition_id = c.id and p.user_id = u.id), 0)::int as penalty_points,
  (select ca2.caught_at
     from catches ca2
    where ca2.competition_id = c.id and ca2.user_id = u.id
    order by ca2.caught_at desc limit 1)                                 as last_catch_at
from competitions c
cross join users u
left join catches ca on ca.competition_id = c.id and ca.user_id = u.id
where u.is_active
group by c.id, u.id;

-- ROW LEVEL SECURITY
alter table users               enable row level security;
alter table competitions        enable row level security;
alter table competition_settings enable row level security;
alter table boats               enable row level security;
alter table boat_members        enable row level security;
alter table calls               enable row level security;
alter table catches             enable row level security;
alter table penalties           enable row level security;

create policy "authenticated_read_users"        on users               for select to authenticated using (true);
create policy "authenticated_read_competitions" on competitions        for select to authenticated using (true);
create policy "authenticated_read_settings"     on competition_settings for select to authenticated using (true);
create policy "authenticated_read_boats"        on boats               for select to authenticated using (true);
create policy "authenticated_read_boat_members" on boat_members        for select to authenticated using (true);
create policy "authenticated_read_calls"        on calls               for select to authenticated using (true);
create policy "authenticated_read_catches"      on catches             for select to authenticated using (true);
create policy "authenticated_read_penalties"    on penalties           for select to authenticated using (true);

create policy "user_update_self" on users
  for update to authenticated using (auth.uid() = id);

create policy "user_insert_own_catches" on catches
  for insert to authenticated with check (auth.uid() = user_id);
create policy "user_update_own_catches" on catches
  for update to authenticated using (auth.uid() = user_id);
create policy "user_delete_own_catches" on catches
  for delete to authenticated using (auth.uid() = user_id);

create policy "user_insert_own_penalties" on penalties
  for insert to authenticated with check (auth.uid() = user_id);

create policy "authenticated_insert_competitions" on competitions
  for insert to authenticated with check (true);
create policy "authenticated_update_competitions_prep" on competitions
  for update to authenticated using (status = 'prep' or auth.uid() = created_by);

create policy "authenticated_write_settings" on competition_settings
  for all to authenticated
  using (exists (select 1 from competitions c where c.id = competition_id and c.status = 'prep'))
  with check (exists (select 1 from competitions c where c.id = competition_id and c.status = 'prep'));

create policy "authenticated_write_boats" on boats
  for all to authenticated
  using (exists (select 1 from competitions c where c.id = competition_id and c.status = 'prep'))
  with check (exists (select 1 from competitions c where c.id = competition_id and c.status = 'prep'));

create policy "authenticated_write_boat_members" on boat_members
  for all to authenticated
  using (exists (select 1 from boats b join competitions c on c.id = b.competition_id
                 where b.id = boat_id and c.status = 'prep'))
  with check (exists (select 1 from boats b join competitions c on c.id = b.competition_id
                      where b.id = boat_id and c.status = 'prep'));

create policy "authenticated_write_calls" on calls
  for all to authenticated
  using (exists (select 1 from competitions c where c.id = competition_id and c.status = 'prep'))
  with check (exists (select 1 from competitions c where c.id = competition_id and c.status = 'prep'));
