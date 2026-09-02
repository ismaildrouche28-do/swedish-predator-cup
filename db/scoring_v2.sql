-- 1) Alle bestehenden Wettkämpfe auf max 4 pro Art updaten
update competition_settings set max_fish_per_species = 4 where max_fish_per_species < 4;

-- 2) Neue Slot-Regel: max 6 Fische, max 4 pro Art, KEINE Vielfalt-Bedingung
create or replace function recompute_scored_flags(p_competition uuid, p_user uuid)
returns void language plpgsql as $$
declare
  max_total int;
  max_species int;
  r record;
  perch_count int := 0;
  zander_count int := 0;
  pike_count int := 0;
  total_scored int := 0;
begin
  select max_fish_total, max_fish_per_species
    into max_total, max_species
    from competition_settings where competition_id = p_competition;

  update catches set is_scored = false
   where competition_id = p_competition and user_id = p_user;

  for r in
    select id, species from catches
     where competition_id = p_competition
       and user_id = p_user
       and is_valid = true
     order by total_points desc, caught_at asc
  loop
    if total_scored >= max_total then exit; end if;

    -- Max pro Art
    if (r.species = 'perch'  and perch_count  >= max_species) or
       (r.species = 'zander' and zander_count >= max_species) or
       (r.species = 'pike'   and pike_count   >= max_species) then
      continue;
    end if;

    update catches set is_scored = true where id = r.id;
    if r.species = 'perch'  then perch_count  := perch_count  + 1; end if;
    if r.species = 'zander' then zander_count := zander_count + 1; end if;
    if r.species = 'pike'   then pike_count   := pike_count   + 1; end if;
    total_scored := total_scored + 1;
  end loop;
end $$;

-- 3) Alle bestehenden Fänge neu bewerten (Trigger neu feuern via Update-Touch)
update catches set updated_at = now() where updated_at is not null;
-- Falls updated_at nicht existiert, direkter Recompute:
do $$
declare c record;
begin
  for c in select distinct competition_id, user_id from catches loop
    perform recompute_scored_flags(c.competition_id, c.user_id);
  end loop;
end $$;
