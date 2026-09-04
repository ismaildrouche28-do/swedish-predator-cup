-- Pause-Fenster (Timeout) an Wettkampf hängen
alter table competitions
  add column if not exists pause_start timestamptz,
  add column if not exists pause_end   timestamptz;

-- Optional: Kommentar
comment on column competitions.pause_start is 'Geplanter Start der Wettkampfpause (Timeout).';
comment on column competitions.pause_end   is 'Geplantes Ende der Wettkampfpause; kann verlängert werden.';
