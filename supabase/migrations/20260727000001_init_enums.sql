-- supabase/migrations/20260727000001_init_enums.sql
-- Aura OS — Migration 1: Enum Types
--
-- Creates all custom PostgreSQL enum types required by the application.
-- Defined in DATABASE.md §3.
--
-- Run order: 1 (must run before tables)

-- ---------------------------------------------------------------------------
-- mission_status
-- Represents the enforced mission lifecycle stages.
-- DATABASE.md §3 — ON_HOLD and CANCELLED are valid intermediate/terminal states.
-- ---------------------------------------------------------------------------
create type mission_status as enum (
  'IDEA',
  'PLANNING',
  'APPROVAL',
  'EXECUTION',
  'ON_HOLD',
  'REVIEW',
  'COMPLETED',
  'CANCELLED'
);

-- ---------------------------------------------------------------------------
-- employee_status
-- Represents an AI Employee's current operational state.
-- DATABASE.md §3
-- ---------------------------------------------------------------------------
create type employee_status as enum (
  'ACTIVE',
  'IDLE',
  'ON_MISSION',
  'INACTIVE'
);

-- ---------------------------------------------------------------------------
-- knowledge_layer
-- Reflects the three approved knowledge layers from MASTER_CONTEXT.md.
-- DATABASE.md §3
-- ---------------------------------------------------------------------------
create type knowledge_layer as enum (
  'COMPANY',
  'PROJECT',
  'EMPLOYEE'
);

-- ---------------------------------------------------------------------------
-- assignment_target_type
-- Indicates whether a mission was assigned to a Manager or directly to an
-- Employee. DATABASE.md §3
-- ---------------------------------------------------------------------------
create type assignment_target_type as enum (
  'MANAGER',
  'EMPLOYEE'
);
