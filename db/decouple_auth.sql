-- Existierende FK auf auth.users entfernen (damit Profile ohne Auth-User erstellt werden können)
alter table users drop constraint if exists users_id_fkey;

-- Default value damit gen_random_uuid greift bei neuen inserts ohne id
alter table users alter column id set default gen_random_uuid();

-- Email darf jetzt null sein (Profile brauchen keine Mail mehr)
alter table users alter column email drop not null;

-- Alle bestehenden User als onboarded markieren (damit sie in der Auswahl erscheinen)
update users set onboarding_done = true where onboarding_done is not true;
