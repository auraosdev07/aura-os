# Aura OS — Database Document

> Version: v0.1
> Status: Draft
> Sources: [MASTER_CONTEXT.md](./MASTER_CONTEXT.md) · [PRD.md](./PRD.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)
> Audience: Developers and AI coding agents

---

## 1. Database Overview

Aura OS uses **Supabase PostgreSQL** as its single database.

**Reasons:**
- Supabase is the approved infrastructure layer (MASTER_CONTEXT.md).
- PostgreSQL provides relational integrity required for the hierarchy and mission lifecycle.
- Supabase Auth integrates directly — the authenticated user's `auth.uid()` is available inside every RLS policy without a separate auth database.
- Supabase provides built-in Row Level Security (RLS), Storage, and Realtime — covering all MVP needs without additional services.
- The Supabase client SDK is already initialised in `lib/supabase/client.ts`.

All reads and writes go through service functions (`services/`). No component accesses the database directly.

---

## 2. Naming Conventions

| Concern | Convention | Example |
|---|---|---|
| **Tables** | `snake_case`, plural | `employees`, `missions`, `knowledge_entries` |
| **Columns** | `snake_case` | `full_name`, `mission_status`, `created_at` |
| **Primary keys** | `id` — `uuid`, default `gen_random_uuid()` | `id uuid primary key` |
| **Foreign keys** | `<referenced_table_singular>_id` | `manager_id`, `mission_id` |
| **Timestamps** | `created_at`, `updated_at` — `timestamptz`, not null | — |
| **Soft delete** | `deleted_at timestamptz` — null means active | Queries filter `where deleted_at is null` |
| **Enums** | `snake_case` type names, `UPPER_SNAKE_CASE` values | `mission_status`, `'IN_PROGRESS'` |
| **Boolean flags** | `is_<name>` | `is_active` |

**Soft delete applies to:** `employees`, `managers`, `missions`, `knowledge_entries`, `artifacts`.

---

## 3. Enums

All enums are created as PostgreSQL custom types.

### `mission_status`
Represents the enforced mission lifecycle.

```sql
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
```

- `ON_HOLD` — intermediate state, resumable.
- `CANCELLED` — terminal state, not resumable.

### `employee_status`
```sql
create type employee_status as enum (
  'ACTIVE',
  'IDLE',
  'ON_MISSION',
  'INACTIVE'
);
```

### `knowledge_layer`
Reflects the three approved knowledge layers.

```sql
create type knowledge_layer as enum (
  'COMPANY',
  'PROJECT',
  'EMPLOYEE'
);
```

### `assignment_target_type`
Indicates whether a mission was assigned to a Manager or directly to an Employee.

```sql
create type assignment_target_type as enum (
  'MANAGER',
  'EMPLOYEE'
);
```

---

## 4. Tables

### `profiles`
**Purpose:** Stores Owner metadata. Linked 1:1 to `auth.users`. Created automatically on Owner sign-up.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, references `auth.users(id)` | Matches Supabase Auth UID |
| `full_name` | `text` | not null | Owner display name |
| `email` | `text` | not null, unique | Owner email |
| `created_at` | `timestamptz` | not null, default `now()` | — |
| `updated_at` | `timestamptz` | not null, default `now()` | — |

**Indexes:** PK on `id`.
**Relationships:** 1:1 with `auth.users`.

---

### `managers`
**Purpose:** System entity. Coordinates AI employees. Not an auth user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | — |
| `name` | `text` | not null | Manager display name |
| `department` | `text` | not null | Department name (TODO: convert to enum if departments are formalised) |
| `owner_id` | `uuid` | not null, references `profiles(id)` | Owner who created this Manager |
| `created_at` | `timestamptz` | not null, default `now()` | — |
| `updated_at` | `timestamptz` | not null, default `now()` | — |
| `deleted_at` | `timestamptz` | nullable | Soft delete |

**Indexes:** `owner_id`.
**Relationships:** Belongs to `profiles`. Has many `employees`.

---

### `employees`
**Purpose:** Persistent AI Employee records. Each employee has a profile, department, manager, status, and desk data.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | — |
| `name` | `text` | not null | Employee display name |
| `role` | `text` | not null | Employee role / job title |
| `department` | `text` | not null | Department name |
| `avatar` | `text` | nullable | URL or storage path to employee avatar image |
| `description` | `text` | nullable | Short bio or description of the employee |
| `manager_id` | `uuid` | nullable, references `managers(id)` | Assigned manager (nullable if directly under Owner) |
| `owner_id` | `uuid` | not null, references `profiles(id)` | Owner who created this Employee |
| `status` | `employee_status` | not null, default `'IDLE'` | Current status |
| `notes` | `text` | nullable | Employee desk notes |
| `performance` | `jsonb` | nullable | Performance data (TODO: formalise schema) |
| `created_at` | `timestamptz` | not null, default `now()` | — |
| `updated_at` | `timestamptz` | not null, default `now()` | — |
| `deleted_at` | `timestamptz` | nullable | Soft delete |

**Indexes:** `owner_id`, `manager_id`, `status`.
**Relationships:** Belongs to `profiles` and optionally `managers`. Has many `mission_assignments`.

---

### `missions`
**Purpose:** Core work unit. Every task is scoped to a mission.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | — |
| `title` | `text` | not null | Mission title |
| `description` | `text` | nullable | Mission description |
| `status` | `mission_status` | not null, default `'IDEA'` | Current lifecycle stage |
| `priority` | `text` | nullable | Mission priority level (e.g. LOW, MEDIUM, HIGH — TODO: convert to enum) |
| `assigned_to` | `uuid` | nullable, references `employees(id)` or `managers(id)` | Direct assignee shortcut (denormalised from `mission_assignments` for quick lookup) |
| `created_by` | `uuid` | not null, references `profiles(id)` | Owner who created the mission |
| `owner_id` | `uuid` | not null, references `profiles(id)` | Owner context for RLS |
| `due_date` | `timestamptz` | nullable | Target completion date |
| `created_at` | `timestamptz` | not null, default `now()` | — |
| `updated_at` | `timestamptz` | not null, default `now()` | — |
| `deleted_at` | `timestamptz` | nullable | Soft delete |

**Indexes:** `owner_id`, `status`, `created_by`, `assigned_to`.
**Relationships:** Has many `mission_assignments`, `knowledge_entries`, `artifacts`.

---

### `mission_assignments`
**Purpose:** Links a mission to a Manager or directly to an Employee. Records who assigned it and when.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | — |
| `mission_id` | `uuid` | not null, references `missions(id)` | The assigned mission |
| `target_type` | `assignment_target_type` | not null | `MANAGER` or `EMPLOYEE` |
| `manager_id` | `uuid` | nullable, references `managers(id)` | Set when `target_type = 'MANAGER'` |
| `employee_id` | `uuid` | nullable, references `employees(id)` | Set when `target_type = 'EMPLOYEE'` |
| `assigned_by_owner` | `boolean` | not null, default `false` | True if Owner assigned directly |
| `created_at` | `timestamptz` | not null, default `now()` | — |
| `updated_at` | `timestamptz` | not null, default `now()` | — |

**Constraint:** Exactly one of `manager_id` or `employee_id` must be set. Enforce via check constraint.
**Indexes:** `mission_id`, `manager_id`, `employee_id`.
**Relationships:** Belongs to `missions`. References `managers` or `employees`.

---

### `knowledge_entries`
**Purpose:** Stores knowledge documents across three layers: Company, Project, Employee.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | — |
| `title` | `text` | not null | Entry title |
| `content` | `text` | not null | Entry body/content |
| `layer` | `knowledge_layer` | not null | `COMPANY`, `PROJECT`, or `EMPLOYEE` |
| `mission_id` | `uuid` | nullable, references `missions(id)` | Set for PROJECT layer entries |
| `employee_id` | `uuid` | nullable, references `employees(id)` | Set for EMPLOYEE layer entries |
| `owner_id` | `uuid` | not null, references `profiles(id)` | Owner context |
| `created_at` | `timestamptz` | not null, default `now()` | — |
| `updated_at` | `timestamptz` | not null, default `now()` | — |
| `deleted_at` | `timestamptz` | nullable | Soft delete |

**Indexes:** `layer`, `owner_id`, `mission_id`, `employee_id`.
**Relationships:** Optionally belongs to `missions` (PROJECT) or `employees` (EMPLOYEE).

---

### `artifacts`
**Purpose:** Files and outputs produced during mission execution. Linked to Supabase Storage.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | — |
| `name` | `text` | not null | Artifact display name |
| `storage_path` | `text` | not null | Path in Supabase Storage bucket |
| `mime_type` | `text` | nullable | File MIME type |
| `mission_id` | `uuid` | nullable, references `missions(id)` | Associated mission |
| `employee_id` | `uuid` | nullable, references `employees(id)` | Producing employee |
| `owner_id` | `uuid` | not null, references `profiles(id)` | Owner context |
| `created_at` | `timestamptz` | not null, default `now()` | — |
| `updated_at` | `timestamptz` | not null, default `now()` | — |
| `deleted_at` | `timestamptz` | nullable | Soft delete |

**Indexes:** `owner_id`, `mission_id`, `employee_id`.
**Relationships:** Optionally belongs to `missions` and `employees`.

---

### `notifications`
**Purpose:** System-generated events surfaced in the dashboard notification panel (FR-21).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | — |
| `owner_id` | `uuid` | not null, references `profiles(id)` | Recipient |
| `title` | `text` | not null | Short notification title |
| `body` | `text` | nullable | Detail text |
| `is_read` | `boolean` | not null, default `false` | Read state |
| `created_at` | `timestamptz` | not null, default `now()` | — |

**Indexes:** `owner_id`, `is_read`.
**Relationships:** Belongs to `profiles`.
**Note:** No soft delete — notifications are deleted or archived, not soft-deleted.

---

## 5. Relationships

| Relationship | Type | Description |
|---|---|---|
| `profiles` → `managers` | one-to-many | One Owner has many Managers |
| `profiles` → `employees` | one-to-many | One Owner has many Employees |
| `profiles` → `missions` | one-to-many | One Owner has many Missions |
| `managers` → `employees` | one-to-many | One Manager coordinates many Employees |
| `missions` → `mission_assignments` | one-to-many | One Mission can have multiple assignment records |
| `managers` → `mission_assignments` | one-to-many | One Manager can be assigned many missions |
| `employees` → `mission_assignments` | one-to-many | One Employee can be assigned many missions |
| `missions` → `knowledge_entries` | one-to-many | One Mission can have many Project-layer knowledge entries |
| `employees` → `knowledge_entries` | one-to-many | One Employee has private knowledge entries |
| `missions` → `artifacts` | one-to-many | One Mission can produce many artifacts |
| `employees` → `artifacts` | one-to-many | One Employee can produce many artifacts |
| `profiles` → `notifications` | one-to-many | One Owner receives many notifications |

---

## 6. Row Level Security (RLS)

RLS is enabled on all tables. In MVP, the Owner is the only authenticated human user. All policies use `auth.uid()` matched against `owner_id`.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | `auth.uid() = id` | `auth.uid() = id` | `auth.uid() = id` | Denied |
| `managers` | `auth.uid() = owner_id` | `auth.uid() = owner_id` | `auth.uid() = owner_id` | Denied (soft delete) |
| `employees` | `auth.uid() = owner_id` | `auth.uid() = owner_id` | `auth.uid() = owner_id` | Denied (soft delete) |
| `missions` | `auth.uid() = owner_id` | `auth.uid() = owner_id` | `auth.uid() = owner_id` | Denied (soft delete) |
| `mission_assignments` | Via `missions.owner_id` | `auth.uid()` owns the mission | `auth.uid()` owns the mission | `auth.uid()` owns the mission |
| `knowledge_entries` | `auth.uid() = owner_id` | `auth.uid() = owner_id` | `auth.uid() = owner_id` | Denied (soft delete) |
| `artifacts` | `auth.uid() = owner_id` | `auth.uid() = owner_id` | `auth.uid() = owner_id` | Denied (soft delete) |
| `notifications` | `auth.uid() = owner_id` | System insert only | `auth.uid() = owner_id` | `auth.uid() = owner_id` |

**Rules:**
- Hard deletes are not permitted on soft-deleted tables. Set `deleted_at` instead.
- All queries in service functions must include `where deleted_at is null` to exclude soft-deleted rows.
- RLS policies are defined in migration files, not application code.

---

## 7. Storage

Supabase Storage is used for artifact file uploads.

| Bucket | Purpose | Access |
|---|---|---|
| `artifacts` | Stores files produced during mission execution (documents, outputs, exports) | Private. Owner-authenticated reads and writes only. RLS via Supabase Storage policies. |

**Storage policy:** Only the authenticated Owner may upload to or download from the `artifacts` bucket. Files are stored at path `{owner_id}/{mission_id}/{filename}`.

---

## 8. Indexing Strategy

| Table | Index Columns | Reason |
|---|---|---|
| `managers` | `owner_id` | Filter all managers by owner |
| `employees` | `owner_id` | Filter all employees by owner |
| `employees` | `manager_id` | Look up employees by manager |
| `employees` | `status` | Filter by active/idle/on-mission |
| `missions` | `owner_id` | Filter all missions by owner |
| `missions` | `status` | Filter by lifecycle stage |
| `mission_assignments` | `mission_id` | Look up assignments per mission |
| `mission_assignments` | `manager_id` | Look up missions assigned to a manager |
| `mission_assignments` | `employee_id` | Look up missions assigned to an employee |
| `knowledge_entries` | `owner_id` | Filter all knowledge by owner |
| `knowledge_entries` | `layer` | Filter by knowledge layer |
| `knowledge_entries` | `mission_id` | Look up project-layer entries per mission |
| `knowledge_entries` | `employee_id` | Look up employee-layer entries |
| `artifacts` | `owner_id` | Filter all artifacts by owner |
| `artifacts` | `mission_id` | Look up artifacts per mission |
| `notifications` | `owner_id`, `is_read` | Filter unread notifications per owner |

All primary keys are indexed by default. Composite indexes added only if query patterns require them.

---

## 9. Audit Fields

All tables (except `notifications`) include the following standard audit fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `created_at` | `timestamptz` | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | `now()` | Last update timestamp. Updated via trigger. |
| `deleted_at` | `timestamptz` | `null` | Soft delete timestamp. Null = active. (Excluded from `notifications`.) |

**`updated_at` trigger:** A shared PostgreSQL trigger function `set_updated_at()` is applied to all tables with an `updated_at` column. It sets `updated_at = now()` on every row update.

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

`created_by` and `updated_by` columns are **TODO** — include if audit trail per-action is required beyond `owner_id`. In MVP, `owner_id` is sufficient since only one human user exists.

---

## 10. Migration Strategy

- All schema changes are managed via **Supabase migrations** (`supabase/migrations/`).
- Each migration is a numbered SQL file: `YYYYMMDDHHMMSS_description.sql`.
- Migrations are run with the Supabase CLI: `supabase db push` (local) or applied via the Supabase dashboard (production).
- **No schema changes are made directly in the Supabase dashboard** — all changes go through migration files committed to version control.
- Migration files are append-only. Destructive changes (drop column, rename column) require a new migration, not editing an existing one.
- Seed data (if needed for development) goes in `supabase/seed.sql`, separate from migrations.
- RLS policies and enum types are defined inside migration files, not application code.

**Migration file location:**
```
aura-os/
└── supabase/
    ├── migrations/
    │   └── YYYYMMDDHHMMSS_init.sql
    └── seed.sql
```

> The `supabase/` directory does not yet exist. Create it before Sprint 2.

---

## 11. Future Extension Points

The following are placeholders only. No implementation is defined here.

- **CEO table** — hierarchy node between Owner and Managers (postponed).
- **Tasks table** — sub-items within a Mission. Mentioned in PRD (FR-10) but schema not yet defined. TODO.
- **Human employees** — separate table or flag to distinguish human vs. AI employees.
- **Multi-tenancy** — `company_id` added to all tables to scope data per company.
- **AI model config** — per-employee model selection and configuration fields.
- **Performance schema** — formalise the `employees.performance` jsonb column into a structured table.
- **Departments enum** — formalise `department` text columns into a typed enum or lookup table.

---

*End of Document*
