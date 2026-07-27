-- supabase/migrations/20260727000004_init_rls.sql
-- Aura OS — Migration 4: Row Level Security
--
-- Enables RLS on all tables and creates policies exactly as defined in
-- DATABASE.md §6.
--
-- MVP model: Owner is the only authenticated human user.
-- All policies anchor on auth.uid() matched against owner_id.
--
-- Run order: 4 (requires tables from migration 2)

-- ---------------------------------------------------------------------------
-- profiles
-- DATABASE.md §6: SELECT/INSERT/UPDATE = auth.uid() = id | DELETE = Denied
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles: owner can select own row"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: owner can insert own row"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: owner can update own row"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- DELETE is denied: no delete policy created.

-- ---------------------------------------------------------------------------
-- managers
-- DATABASE.md §6: SELECT/INSERT/UPDATE = auth.uid() = owner_id | DELETE = Denied
-- ---------------------------------------------------------------------------
alter table managers enable row level security;

create policy "managers: owner can select"
  on managers for select
  using (auth.uid() = owner_id);

create policy "managers: owner can insert"
  on managers for insert
  with check (auth.uid() = owner_id);

create policy "managers: owner can update"
  on managers for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- DELETE is denied: use deleted_at for soft delete.

-- ---------------------------------------------------------------------------
-- employees
-- DATABASE.md §6: SELECT/INSERT/UPDATE = auth.uid() = owner_id | DELETE = Denied
-- ---------------------------------------------------------------------------
alter table employees enable row level security;

create policy "employees: owner can select"
  on employees for select
  using (auth.uid() = owner_id);

create policy "employees: owner can insert"
  on employees for insert
  with check (auth.uid() = owner_id);

create policy "employees: owner can update"
  on employees for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- DELETE is denied: use deleted_at for soft delete.

-- ---------------------------------------------------------------------------
-- missions
-- DATABASE.md §6: SELECT/INSERT/UPDATE = auth.uid() = owner_id | DELETE = Denied
-- ---------------------------------------------------------------------------
alter table missions enable row level security;

create policy "missions: owner can select"
  on missions for select
  using (auth.uid() = owner_id);

create policy "missions: owner can insert"
  on missions for insert
  with check (auth.uid() = owner_id);

create policy "missions: owner can update"
  on missions for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- DELETE is denied: use deleted_at for soft delete.

-- ---------------------------------------------------------------------------
-- mission_assignments
-- DATABASE.md §6: SELECT/INSERT/UPDATE/DELETE via missions.owner_id
-- Access is granted only if the authenticated user owns the linked mission.
-- ---------------------------------------------------------------------------
alter table mission_assignments enable row level security;

create policy "mission_assignments: owner can select via mission"
  on mission_assignments for select
  using (
    exists (
      select 1 from missions m
      where m.id = mission_assignments.mission_id
        and m.owner_id = auth.uid()
    )
  );

create policy "mission_assignments: owner can insert via mission"
  on mission_assignments for insert
  with check (
    exists (
      select 1 from missions m
      where m.id = mission_assignments.mission_id
        and m.owner_id = auth.uid()
    )
  );

create policy "mission_assignments: owner can update via mission"
  on mission_assignments for update
  using (
    exists (
      select 1 from missions m
      where m.id = mission_assignments.mission_id
        and m.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from missions m
      where m.id = mission_assignments.mission_id
        and m.owner_id = auth.uid()
    )
  );

create policy "mission_assignments: owner can delete via mission"
  on mission_assignments for delete
  using (
    exists (
      select 1 from missions m
      where m.id = mission_assignments.mission_id
        and m.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- knowledge_entries
-- DATABASE.md §6: SELECT/INSERT/UPDATE = auth.uid() = owner_id | DELETE = Denied
-- ---------------------------------------------------------------------------
alter table knowledge_entries enable row level security;

create policy "knowledge_entries: owner can select"
  on knowledge_entries for select
  using (auth.uid() = owner_id);

create policy "knowledge_entries: owner can insert"
  on knowledge_entries for insert
  with check (auth.uid() = owner_id);

create policy "knowledge_entries: owner can update"
  on knowledge_entries for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- DELETE is denied: use deleted_at for soft delete.

-- ---------------------------------------------------------------------------
-- artifacts
-- DATABASE.md §6: SELECT/INSERT/UPDATE = auth.uid() = owner_id | DELETE = Denied
-- ---------------------------------------------------------------------------
alter table artifacts enable row level security;

create policy "artifacts: owner can select"
  on artifacts for select
  using (auth.uid() = owner_id);

create policy "artifacts: owner can insert"
  on artifacts for insert
  with check (auth.uid() = owner_id);

create policy "artifacts: owner can update"
  on artifacts for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- DELETE is denied: use deleted_at for soft delete.

-- ---------------------------------------------------------------------------
-- notifications
-- DATABASE.md §6: SELECT = auth.uid() = owner_id
--                 INSERT = System insert only (no user policy)
--                 UPDATE = auth.uid() = owner_id (mark as read)
--                 DELETE = auth.uid() = owner_id
-- ---------------------------------------------------------------------------
alter table notifications enable row level security;

create policy "notifications: owner can select"
  on notifications for select
  using (auth.uid() = owner_id);

-- INSERT: system-only. No user-facing insert policy is created.
-- Backend/service functions will use the service_role key to insert.

create policy "notifications: owner can update (mark as read)"
  on notifications for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "notifications: owner can delete"
  on notifications for delete
  using (auth.uid() = owner_id);
