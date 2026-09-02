-- Slot-basiertes Wertungssystem
--
-- 6 Slots pro Teilnehmer:
--   * 3 feste Art-Slots — je einer für Hecht, Zander, Barsch (bester Fang der Art)
--   * 3 freie Slots — beliebige Art, gefüllt vom besten Rest, respektiert max 4/Art
--
-- Full Card (6 gewertete Fische) ist nur möglich, wenn alle drei Arten vertreten sind.
-- Zeitliche Reihenfolge spielt für Slot-Zuordnung keine Rolle — es zählt nur die Qualität.

create or replace function recompute_scored_flags(p_competition uuid, p_user uuid)
returns void language plpgsql as $$
declare
  max_total int;
  max_species int;
  fixed_slots int := 3;
  free_slots int;
  r record;
  perch_count int := 0;
  zander_count int := 0;
  pike_count int := 0;
  free_used int := 0;
begin
  select max_fish_total, max_fish_per_species
    into max_total, max_species
    from competition_settings where competition_id = p_competition;

  if max_total is null then max_total := 6; end if;
  if max_species is null then max_species := 4; end if;
  free_slots := max_total - fixed_slots;

  update catches set is_scored = false
   where competition_id = p_competition and user_id = p_user;

  -- 1) Feste Art-Slots: pro Art den besten Fang
  for r in
    with ranked as (
      select id, species,
             row_number() over (partition by species order by total_points desc, caught_at asc) as rn
      from catches
      where competition_id = p_competition
        and user_id = p_user
        and is_valid = true
    )
    select id, species from ranked where rn = 1
  loop
    update catches set is_scored = true where id = r.id;
    if r.species = 'perch'  then perch_count  := perch_count  + 1; end if;
    if r.species = 'zander' then zander_count := zander_count + 1; end if;
    if r.species = 'pike'   then pike_count   := pike_count   + 1; end if;
  end loop;

  -- 2) Freie Slots: bester Rest, per-Art-Cap beachten
  for r in
    select id, species from catches
     where competition_id = p_competition
       and user_id = p_user
       and is_valid = true
       and is_scored = false
     order by total_points desc, caught_at asc
  loop
    if free_used >= free_slots then exit; end if;
    if (r.species = 'perch'  and perch_count  >= max_species) or
       (r.species = 'zander' and zander_count >= max_species) or
       (r.species = 'pike'   and pike_count   >= max_species) then
      continue;
    end if;

    update catches set is_scored = true where id = r.id;
    if r.species = 'perch'  then perch_count  := perch_count  + 1; end if;
    if r.species = 'zander' then zander_count := zander_count + 1; end if;
    if r.species = 'pike'   then pike_count   := pike_count   + 1; end if;
    free_used := free_used + 1;
  end loop;
end $$;

-- Alle bestehenden Fänge neu bewerten
do $$
declare c record;
begin
  for c in select distinct competition_id, user_id from catches loop
    perform recompute_scored_flags(c.competition_id, c.user_id);
  end loop;
end $$;
