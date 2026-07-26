-- Admin-Flag zur users-Tabelle
alter table users add column if not exists is_admin boolean not null default false;

-- ismaildrouche28@gmail.com als Admin markieren (idempotent)
update users set is_admin = true where email = 'ismaildrouche28@gmail.com';

-- Trigger: bei neuen Users mit dieser Mail direkt Admin setzen
create or replace function set_admin_on_signup()
returns trigger language plpgsql security definer as $$
begin
  if new.email in ('ismaildrouche28@gmail.com') then
    new.is_admin := true;
  end if;
  return new;
end $$;

drop trigger if exists trg_set_admin on users;
create trigger trg_set_admin
  before insert on users
  for each row execute function set_admin_on_signup();
