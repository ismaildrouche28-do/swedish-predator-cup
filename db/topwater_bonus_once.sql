-- Topwater-Bonus: nur EINMAL pro Teilnehmer pro Wettkampf.
--
-- Umsetzung auf DB-Ebene (BEFORE-Trigger + AFTER-Reconciliation):
-- 1) calc_catch_points (BEFORE INSERT/UPDATE) vergibt den TW-Bonus nur, wenn
--    der Teilnehmer noch keinen anderen valid Topwater-Fang mit Bonus > 0 in
--    diesem Wettkampf hat.
-- 2) reconcile_tw_bonus stellt nach jeder Aenderung sicher, dass GENAU EIN
--    valid Topwater-Fang des Users den Bonus haelt — der chronologisch fruehste.
--    Wird nach dem Recompute der Scored-Slots aufgerufen. Damit ist die Regel
--    auch beim Loeschen/Aendern konsistent (Bonus wandert zum naechsten TW-Fang).
--
-- Die Slot-Logik (recompute_scored_flags) bleibt unveraendert.

create or replace function calc_catch_points()
returns trigger language plpgsql as $$
declare
  rules jsonb;
  species_rule jsonb;
  min_cm int;
  factor numeric;
  bonus int;
  existing_bonused int := 0;
begin
  select species_rules, topwater_bonus into rules, bonus
    from competition_settings
   where competition_id = new.competition_id;
  if bonus is null then bonus := 10; end if;

  species_rule := rules -> new.species::text;
  min_cm := (species_rule ->> 'min_cm')::int;
  factor := (species_rule ->> 'factor')::numeric;

  new.is_valid    := new.length_cm >= min_cm;
  new.base_points := case when new.is_valid then round(new.length_cm * factor)::int else 0 end;

  if new.is_valid and new.topwater then
    select count(*) into existing_bonused
      from catches c
     where c.competition_id = new.competition_id
       and c.user_id        = new.user_id
       and c.topwater       = true
       and c.is_valid       = true
       and c.bonus_points   > 0
       and c.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
    if existing_bonused = 0 then
      new.bonus_points := bonus;
    else
      new.bonus_points := 0;
    end if;
  else
    new.bonus_points := 0;
  end if;

  new.total_points := new.base_points + new.bonus_points;
  return new;
end $$;

create or replace function reconcile_tw_bonus(p_competition uuid, p_user uuid)
returns void language plpgsql as $$
declare
  bonus_val int;
  keeper_id uuid;
begin
  select topwater_bonus into bonus_val
    from competition_settings where competition_id = p_competition;
  if bonus_val is null then bonus_val := 10; end if;

  select id into keeper_id
    from catches
   where competition_id = p_competition
     and user_id        = p_user
     and is_valid       = true
     and topwater       = true
   order by caught_at asc, id asc
   limit 1;

  -- Alle valid TW-Faenge ausser dem Keeper: bonus 0
  update catches
     set bonus_points = 0,
         total_points = base_points
   where competition_id = p_competition
     and user_id        = p_user
     and topwater       = true
     and (keeper_id is null or id <> keeper_id)
     and (bonus_points <> 0 or total_points <> base_points);

  -- Nicht-TW oder invalid: kein Bonus (Datenhygiene)
  update catches
     set bonus_points = 0,
         total_points = base_points
   where competition_id = p_competition
     and user_id        = p_user
     and (topwater = false or is_valid = false)
     and bonus_points > 0;

  -- Keeper: bonus setzen (nur wenn abweichend, minimiert Trigger-Feuer)
  if keeper_id is not null then
    update catches
       set bonus_points = bonus_val,
           total_points = base_points + bonus_val
     where id = keeper_id
       and (bonus_points <> bonus_val or total_points <> base_points + bonus_val);
  end if;
end $$;

-- Nach jeder Katch-Aenderung: erst TW-Bonus rekonziliieren, dann Slots recomputen.
create or replace function trg_recompute_scored()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform reconcile_tw_bonus(old.competition_id, old.user_id);
    perform recompute_scored_flags(old.competition_id, old.user_id);
    return old;
  else
    perform reconcile_tw_bonus(new.competition_id, new.user_id);
    perform recompute_scored_flags(new.competition_id, new.user_id);
    return new;
  end if;
end $$;

-- Bestehende Daten korrigieren
do $$
declare c record;
begin
  for c in select distinct competition_id, user_id from catches loop
    perform reconcile_tw_bonus(c.competition_id, c.user_id);
    perform recompute_scored_flags(c.competition_id, c.user_id);
  end loop;
end $$;
