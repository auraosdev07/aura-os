-- supabase/migrations/20260727000002_init_tables.sql
-- Aura OS — Migration 2: Tables
--
-- Creates all 8 MVP tables with columns, primary keys, foreign keys,
-- constraints, and indexes as defined in DATABASE.md §4 and §8.
--
-- Run order: 2 (requires enums from migration 1)

-- ---------------------------------------------------------------------------
-- profiles
-- 1:1 with auth.users. Stores Owner metadata.
-- PK = auth.uid() — no separate UUID generated.
-- DATABASE.md §4 → profiles
-- ---------------------------------------------------------------------------
create table profiles (
  id          uuid        not null primary key references auth.users(id) on delete cascade,
  full_name   text        not null,
  email       text        not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- No additional indexes needed: PK on id is sufficient.
-- Relationship: 1:1 with auth.users.

-- ---------------------------------------------------------------------------
-- managers
-- System entity. Not an auth user. Belongs to an Owner.
-- DATABASE.md §4 → managers
-- ---------------------------------------------------------------------------
create table managers (
  id          uuid        not null primary key default gen_random_uuid(),
  name        text        not null,
  department  text        not null,
  owner_id    uuid        not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index idx_managers_owner_id on managers(owner_id);

-- ---------------------------------------------------------------------------
-- employees
-- Persistent AI Employee records.
-- DATABASE.md §4 → employees
-- ---------------------------------------------------------------------------
create table employees (
  id          uuid              not null primary key default gen_random_uuid(),
  name        text              not null,
  role        text              not null,
  department  text              not null,
  avatar      text,
  description text,
  manager_id  uuid              references managers(id) on delete set null,
  owner_id    uuid              not null references profiles(id) on delete cascade,
  status      employee_status   not null default 'IDLE',
  notes       text,
  performance jsonb,
  created_at  timestamptz       not null default now(),
  updated_at  timestamptz       not null default now(),
  deleted_at  timestamptz
);

create index idx_employees_owner_id   on employees(owner_id);
create index idx_employees_manager_id on employees(manager_id);
create index idx_employees_status     on employees(status);

-- ---------------------------------------------------------------------------
-- missions
-- Core work unit. Every task is scoped to a mission.
-- DATABASE.md §4 → missions
--
-- NOTE: assigned_to references either employees(id) or managers(id).
-- PostgreSQL cannot enforce a FK to two tables simultaneously.
-- assigned_to is therefore a denormalised shortcut (no FK constraint).
-- The authoritative assignment record lives in mission_assignments.
-- This is documented behaviour per DATABASE.md §4.
-- ---------------------------------------------------------------------------
create table missions (
  id          uuid            not null primary key default gen_random_uuid(),
  title       text            not null,
  description text,
  status      mission_status  not null default 'IDEA',
  priority    text,
  assigned_to uuid,           -- denormalised shortcut, no FK — see note above
  created_by  uuid            not null references profiles(id),
  owner_id    uuid            not null references profiles(id) on delete cascade,
  due_date    timestamptz,
  created_at  timestamptz     not null default now(),
  updated_at  timestamptz     not null default now(),
  deleted_at  timestamptz
);

create index idx_missions_owner_id    on missions(owner_id);
create index idx_missions_status      on missions(status);
create index idx_missions_created_by  on missions(created_by);
create index idx_missions_assigned_to on missions(assigned_to);

-- ---------------------------------------------------------------------------
-- mission_assignments
-- Links a mission to a Manager or directly to an Employee.
-- DATABASE.md §4 → mission_assignments
--
-- Constraint: exactly one of manager_id or employee_id must be non-null.
-- ---------------------------------------------------------------------------
create table mission_assignments (
  id               uuid                    not null primary key default gen_random_uuid(),
  mission_id       uuid                    not null references missions(id) on delete cascade,
  target_type      assignment_target_type  not null,
  manager_id       uuid                    references managers(id) on delete cascade,
  employee_id      uuid                    references employees(id) on delete cascade,
  assigned_by_owner boolean               not null default false,
  created_at       timestamptz             not null default now(),
  updated_at       timestamptz             not null default now(),

  -- Exactly one of manager_id or employee_id must be set.
  constraint chk_assignment_target check (
    (manager_id is not null and employee_id is null)
    or
    (manager_id is null and employee_id is not null)
  )
);

create index idx_mission_assignments_mission_id  on mission_assignments(mission_id);
create index idx_mission_assignments_manager_id  on mission_assignments(manager_id);
create index idx_mission_assignments_employee_id on mission_assignments(employee_id);

-- ---------------------------------------------------------------------------
-- knowledge_entries
-- Stores knowledge documents across three layers.
-- DATABASE.md §4 → knowledge_entries
-- ---------------------------------------------------------------------------
create table knowledge_entries (
  id          uuid            not null primary key default gen_random_uuid(),
  title       text            not null,
  content     text            not null,
  layer       knowledge_layer not null,
  mission_id  uuid            references missions(id) on delete set null,
  employee_id uuid            references employees(id) on delete set null,
  owner_id    uuid            not null references profiles(id) on delete cascade,
  created_at  timestamptz     not null default now(),
  updated_at  timestamptz     not null default now(),
  deleted_at  timestamptz
);

create index idx_knowledge_entries_owner_id    on knowledge_entries(owner_id);
create index idx_knowledge_entries_layer       on knowledge_entries(layer);
create index idx_knowledge_entries_mission_id  on knowledge_entries(mission_id);
create index idx_knowledge_entries_employee_id on knowledge_entries(employee_id);

-- ---------------------------------------------------------------------------
-- artifacts
-- Files and outputs produced during mission execution.
-- Linked to Supabase Storage bucket 'artifacts'.
-- DATABASE.md §4 → artifacts
-- ---------------------------------------------------------------------------
create table artifacts (
  id           uuid        not null primary key default gen_random_uuid(),
  name         text        not null,
  storage_path text        not null,
  mime_type    text,
  mission_id   uuid        references missions(id) on delete set null,
  employee_id  uuid        references employees(id) on delete set null,
  owner_id     uuid        not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index idx_artifacts_owner_id    on artifacts(owner_id);
create index idx_artifacts_mission_id  on artifacts(mission_id);
create index idx_artifacts_employee_id on artifacts(employee_id);

-- ---------------------------------------------------------------------------
-- notifications
-- System-generated events surfaced in the dashboard.
-- No soft delete — notifications are deleted or archived.
-- DATABASE.md §4 → notifications
-- ---------------------------------------------------------------------------
create table notifications (
  id         uuid        not null primary key default gen_random_uuid(),
  owner_id   uuid        not null references profiles(id) on delete cascade,
  title      text        not null,
  body       text,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

-- Composite index for the common query pattern: unread notifications per owner.
create index idx_notifications_owner_is_read on notifications(owner_id, is_read);
