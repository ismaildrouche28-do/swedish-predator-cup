-- ============================================================
-- Automatische Punkteberechnung + Slot-Regel für Fänge
-- Nach schema.sql einspielen.
-- ============================================================

create or replace function calc_catch_points()
returns trigger language plpgsql as $$
declare
  rules jsonb;
  species_rule jsonb;
  min_cm int;
  factor numeric;
  bonus int;
begin
  select species_rules, topwater_bonus into rules, bonus
    from competition_settings
   where competition_id = new.competition_id;

  species_rule := rules -> new.species::text;
  min_cm := (species_rule ->> 'min_cm')::int;
  factor := (species_rule ->> 'factor')::numeric;

  new.is_valid     := new.length_cm >= min_cm;
  new.base_points  := case when new.is_valid then round(new.length_cm * factor)::int else 0 end;
  new.bonus_points := case when new.is_valid and new.topwater then bonus else 0 end;
  new.total_points := new.base_points + new.bonus_points;
  return new;
end $$;

drop trigger if exists trg_calc_catch_points on catches;
create trigger trg_calc_catch_points
  before insert or update of length_cm, topwater, species on catches
  for each row execute function calc_catch_points();

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
  species_variety int;
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

    if (r.species = 'perch'  and perch_count  >= max_species) or
       (r.species = 'zander' and zander_count >= max_species) or
       (r.species = 'pike'   and pike_count   >= max_species) then
      continue;
    end if;

    species_variety := (case when perch_count>0 then 1 else 0 end)
                     + (case when zander_count>0 then 1 else 0 end)
                     + (case when pike_count>0 then 1 else 0 end);
    if total_scored >= 4 and species_variety < 3 then
      if (r.species = 'perch'  and perch_count  > 0) or
         (r.species = 'zander' and zander_count > 0) or
         (r.species = 'pike'   and pike_count   > 0) then
        continue;
      end if;
    end if;

    update catches set is_scored = true where id = r.id;
    if r.species = 'perch'  then perch_count  := perch_count  + 1; end if;
    if r.species = 'zander' then zander_count := zander_count + 1; end if;
    if r.species = 'pike'   then pike_count   := pike_count   + 1; end if;
    total_scored := total_scored + 1;
  end loop;
end $$;

create or replace function trg_recompute_scored()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform recompute_scored_flags(old.competition_id, old.user_id);
    return old;
  else
    perform recompute_scored_flags(new.competition_id, new.user_id);
    return new;
  end if;
end $$;

drop trigger if exists trg_scored_flags on catches;
create trigger trg_scored_flags
  after insert or update or delete on catches
  for each row execute function trg_recompute_scored();
