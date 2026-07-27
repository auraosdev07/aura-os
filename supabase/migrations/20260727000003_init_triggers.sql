-- supabase/migrations/20260727000003_init_triggers.sql
-- Aura OS — Migration 3: Triggers
--
-- Creates the shared set_updated_at() trigger function and attaches it
-- to all tables that have an updated_at column.
-- DATABASE.md §9 Audit Fields.
--
-- Run order: 3 (requires tables from migration 2)

-- ---------------------------------------------------------------------------
-- set_updated_at()
-- Shared trigger function: sets updated_at = now() on every row update.
-- DATABASE.md §9 — applied to all tables with an updated_at column.
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Apply trigger to: profiles
-- ---------------------------------------------------------------------------
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Apply trigger to: managers
-- ---------------------------------------------------------------------------
create trigger trg_managers_updated_at
  before update on managers
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Apply trigger to: employees
-- ---------------------------------------------------------------------------
create trigger trg_employees_updated_at
  before update on employees
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Apply trigger to: missions
-- ---------------------------------------------------------------------------
create trigger trg_missions_updated_at
  before update on missions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Apply trigger to: mission_assignments
-- ---------------------------------------------------------------------------
create trigger trg_mission_assignments_updated_at
  before update on mission_assignments
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Apply trigger to: knowledge_entries
-- ---------------------------------------------------------------------------
create trigger trg_knowledge_entries_updated_at
  before update on knowledge_entries
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Apply trigger to: artifacts
-- ---------------------------------------------------------------------------
create trigger trg_artifacts_updated_at
  before update on artifacts
  for each row execute function set_updated_at();

-- notifications does not have an updated_at column — no trigger needed.
