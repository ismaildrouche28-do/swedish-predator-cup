-- ═══════════════════════════════════════════════════════════
-- Alle Policies neu setzen — einmalig in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- USERS
drop policy if exists "authenticated_read_users" on users;
drop policy if exists "user_update_self" on users;
drop policy if exists "user_insert_self" on users;

create policy "authenticated_read_users" on users
  for select to authenticated using (true);

create policy "user_insert_self" on users
  for insert to authenticated with check (auth.uid() = id);

create policy "user_update_self" on users
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- COMPETITIONS
drop policy if exists "authenticated_read_competitions" on competitions;
drop policy if exists "authenticated_insert_competitions" on competitions;
drop policy if exists "authenticated_update_competitions_prep" on competitions;
drop policy if exists "authenticated_update_competitions" on competitions;

create policy "authenticated_read_competitions" on competitions
  for select to authenticated using (true);

create policy "authenticated_insert_competitions" on competitions
  for insert to authenticated with check (true);

create policy "authenticated_update_competitions" on competitions
  for update to authenticated
  using (auth.uid() = created_by or status = 'prep')
  with check (auth.uid() = created_by or status = 'prep');

-- CATCHES
drop policy if exists "authenticated_read_catches" on catches;
drop policy if exists "user_insert_own_catches" on catches;
drop policy if exists "user_update_own_catches" on catches;
drop policy if exists "user_delete_own_catches" on catches;

create policy "authenticated_read_catches" on catches
  for select to authenticated using (true);
create policy "user_insert_own_catches" on catches
  for insert to authenticated with check (auth.uid() = user_id);
create policy "user_update_own_catches" on catches
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_delete_own_catches" on catches
  for delete to authenticated using (auth.uid() = user_id);

-- PENALTIES
drop policy if exists "authenticated_read_penalties" on penalties;
drop policy if exists "user_insert_own_penalties" on penalties;

create policy "authenticated_read_penalties" on penalties
  for select to authenticated using (true);
create policy "user_insert_own_penalties" on penalties
  for insert to authenticated with check (auth.uid() = user_id);
