# Aura OS — Product Requirements Document

> Version: v0.1
> Status: Draft
> Source of Truth: [MASTER_CONTEXT.md](./MASTER_CONTEXT.md)
> Audience: Developers and AI coding agents

---

## 1. Product Overview

**Aura OS** is an AI Workforce Operating System. It provides a structured environment where AI employees work together inside a virtual company, executing missions, managing knowledge, and producing artifacts under a defined company hierarchy.

Aura OS is **not** a chatbot. It is **not** a general-purpose AI assistant. It is an operating system for managing AI employees, missions, knowledge, and company workflows.

---

## 2. Vision

Build a production-ready platform where AI employees behave like real employees — persistent, role-based, mission-driven, and accountable — operating inside a virtual company structure managed by a human Owner.

---

## 3. Problem Statement

Current AI tools operate as stateless, session-based assistants with no persistent identity, no organizational structure, and no workflow accountability. There is no system today that:

- Treats AI agents as persistent employees with profiles, departments, and performance history.
- Organizes AI work around missions with a formal lifecycle (Idea → Planning → Approval → Execution → On Hold → Review → Completed → Cancelled).
- Provides a layered knowledge model (Company / Project / Employee) that AI can read and write.
- Gives a human Owner visibility and control over an entire AI workforce from a single dashboard.

---

## 4. Goals

- G1: Enable an Owner to create and manage a virtual company of AI employees.
- G2: Implement a mission lifecycle that enforces structured, auditable AI work.
- G3: Provide each AI employee with a persistent identity, desk, memory, and artifact store.
- G4: Implement a three-layer knowledge system (Company, Project, Employee).
- G5: Deliver a clean, premium dashboard UI that surfaces real data only — no fake charts or analytics.
- G6: Ship production-ready code with no demo/mock implementations in core workflows.

---

## 5. Non-Goals

- No human employees in the system (MVP).
- No general-purpose chat interface.
- No external integrations beyond the approved tech stack (MVP).
- No fake or placeholder analytics/charts.
- No features not defined in MASTER_CONTEXT.md.

---

## 6. Target Users

| User | Description |
|---|---|
| **Owner** | The human who created the company. Has full control over all employees, managers, missions, and knowledge. |

> Note: Managers and AI Employees are system-level entities, not human users logging into the platform.

---

## 7. Core Product Principles

1. AI behaves like employees — persistent, role-based, accountable.
2. Everything is mission-driven — no ad-hoc work outside a mission.
3. Modular architecture — systems are independent and composable.
4. Production-ready code only — no fake or demo implementations.
5. Scalability first — architecture must support growth from day one.
6. Clean UI — minimal, premium, modern, editorial. No visual clutter.
7. Documentation before major systems — MASTER_CONTEXT → PRD → Architecture → Database → Implementation.

---

## 8. MVP Scope

The MVP delivers:

- Owner authentication and company dashboard.
- AI Employee management: create, view, assign, and track employees.
- Manager layer: assign work, review, approve, coordinate employees.
- Mission system: full lifecycle from Idea to Completed.
- Employee Desk: per-employee workspace with Inbox, Current Mission, Tasks, Notes, Artifacts, and Timeline.
- Three-layer Knowledge system: Company, Project, Employee.
- Dashboard: Sidebar, Topbar, Search, Notifications, Theme Toggle, Content Area — using real data only.

**Company hierarchy in MVP:**

```
Owner → Managers → AI Employees
```

Only AI employees exist in the MVP. No human employee records.

---

## 9. User Roles

### Owner
- Top-level human user.
- Can assign missions to Managers or directly to AI Employees.
- Has full read/write access to all company data, knowledge, and missions.

### Manager (system entity)
- Primarily coordinates AI employees.
- Assigns work, reviews work, approves work.
- May also execute tasks when explicitly assigned.

### AI Employee (system entity)
- Executes tasks within a mission.
- Has a persistent profile: Department, Manager, Status, Current Mission, Memory, Artifacts, Performance.
- Is not a temporary session — persists across all activity.

---

## 10. Functional Requirements

### 10.1 Authentication
- FR-01: Owner can sign up and sign in via Supabase Auth.
- FR-02: Authenticated session is required to access all dashboard routes.

### 10.2 Company & Hierarchy
- FR-03: System maintains a fixed hierarchy: Owner → Managers → AI Employees.
- FR-04: Each entity in the hierarchy has a defined role and scope of authority.

### 10.3 AI Employee Management
- FR-05: Owner can create an AI Employee with: Profile, Department, Manager, Status.
- FR-06: Each employee has a persistent Desk containing: Inbox, Current Mission, Current Tasks, Notes, Artifacts, Timeline.
- FR-07: Employee status is tracked and visible on the dashboard.
- FR-08: Employee performance is recorded and accessible.

### 10.4 Mission System
- FR-09: Missions follow a strict lifecycle: Idea → Planning → Approval → Execution → Review → Completed.
  - Valid intermediate state: **On Hold** (mission paused, resumable).
  - Valid terminal state: **Cancelled** (mission terminated, not resumable).
- FR-10: A mission may contain multiple tasks.
- FR-11: Owner can assign a mission to a Manager or directly to an AI Employee.
- FR-12: Managers can assign missions to AI Employees under them.
- FR-13: Mission state transitions are enforced (no skipping stages).

### 10.5 Knowledge System
- FR-14: Company Knowledge layer holds shared company-wide information.
- FR-15: Project Knowledge layer holds project-specific documentation.
- FR-16: Employee Knowledge layer holds private per-employee memory.
- FR-17: Each knowledge layer is readable and writable by the appropriate roles.

### 10.6 Dashboard
- FR-18: Dashboard includes: Sidebar, Topbar, Search, Notifications, Theme Toggle, Content Area.
- FR-19: Dashboard displays real data only. No fake charts or analytics.
- FR-20: Theme Toggle supports light and dark mode.
- FR-21: Notifications surface relevant system events.

---

## 11. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | **Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Supabase, Shadcn, Base UI. |
| NFR-02 | **Routing**: Next.js App Router with route groups. |
| NFR-03 | **Architecture**: Business logic separated from UI components. No duplicate components. |
| NFR-04 | **Code Quality**: Production-ready only. No demo, stub, or placeholder implementations in core flows. |
| NFR-05 | **UI**: Minimal, premium, modern, editorial. Clean spacing. Glass effects only where contextually appropriate. |
| NFR-06 | **Scalability**: Architecture must support increased employee count and mission volume without redesign. |
| NFR-07 | **Reusability**: All components must be reusable. No one-off, single-use UI elements. |
| NFR-08 | **Security**: All routes protected by authenticated session. Supabase Row Level Security (RLS) where applicable. |

---

## 12. Success Metrics

- Owner authentication works (sign up, sign in, protected routes).
- AI Employee CRUD works (create, read, update, delete).
- Mission CRUD works (create, read, update, delete).
- Mission assignment works (Owner → Manager, Owner → Employee, Manager → Employee).
- Mission lifecycle state transitions are enforced.
- Dashboard uses live database data (no mocked or static data).
- Knowledge layers work correctly (Company, Project, Employee — independently readable/writable).

---

## 13. Release Plan

| Sprint | Focus |
|---|---|
| **Sprint 1** | Foundation — project setup, routing, base layout, Supabase connection |
| **Sprint 2** | Authentication — sign up, sign in, session management, protected routes |
| **Sprint 3** | Mission System — mission CRUD, lifecycle enforcement, assignment flows |
| **Sprint 4** | Knowledge System — Company, Project, and Employee knowledge layers |
| **Sprint 5** | Employee Desk — Inbox, Current Mission, Tasks, Notes, Artifacts, Timeline |
| **Sprint 6** | Dashboard Polish — live data, Notifications, Theme Toggle, Search |

---

## 14. Out of Scope

- Human employees as system records (MVP).
- Multi-tenant / multi-company support (MVP).
- External integrations or API connectors (MVP).
- Mobile application.
- Billing or subscription management.
- AI model configuration or model selection UI.
- Any feature not defined in [MASTER_CONTEXT.md](./MASTER_CONTEXT.md).

---

*End of Document*
