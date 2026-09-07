-- Manueller Wettkampf-Timer:
--   actual_start_at        — Zeitpunkt, an dem der Admin manuell „Wettkampf starten" gedrückt hat
--   paused_at              — Zeitpunkt der aktuellen (offenen) Pause; null wenn nicht pausiert
--   accumulated_pause_ms   — Summe aller bereits abgeschlossenen Pausen in Millisekunden
alter table competitions
  add column if not exists actual_start_at      timestamptz,
  add column if not exists paused_at            timestamptz,
  add column if not exists accumulated_pause_ms bigint not null default 0;

comment on column competitions.actual_start_at      is 'Wann Admin manuell Start gedrückt hat. Null vor Start.';
comment on column competitions.paused_at            is 'Wann die aktuelle Pause begonnen hat. Null wenn nicht pausiert.';
comment on column competitions.accumulated_pause_ms is 'Summe abgeschlossener Pausen in ms — Timer subtrahiert diese Zeit.';
