# Aura OS — Architecture Document

> Version: v0.1
> Status: Draft
> Sources: [MASTER_CONTEXT.md](./MASTER_CONTEXT.md) · [PRD.md](./PRD.md)
> Audience: Developers and AI coding agents

---

## 1. High-Level Architecture

Aura OS models a virtual company. The Owner is the only human actor. Everything below is a system-managed entity.

```
Owner
  │
  ├─ creates and assigns → Managers
  │                           │
  │                           └─ coordinates → AI Employees
  │                                               │
  │                                               └─ executes → Missions
  │                                                               │
  │                                                               ├─ contains → Tasks
  │                                                               └─ consumes / produces → Knowledge & Artifacts
  │
  └─ direct assign → AI Employees (bypass Manager)
```

**Key rules:**
- Owner is the single authenticated human user.
- Managers and AI Employees are database records, not auth accounts.
- Every unit of work is scoped to a Mission.
- Knowledge exists at three independent layers: Company, Project, Employee.

---

## 2. Application Architecture

### Presentation Layer
- Next.js App Router pages and route groups.
- React Server Components (RSC) for data-fetching pages.
- Client Components only where interactivity is required.
- Shadcn + Base UI component primitives.
- Tailwind CSS v4 for styling.

### Business Layer
- Feature modules under `features/` encapsulate domain logic.
- Service functions under `services/` handle all Supabase operations.
- No business logic inside React components.
- No direct Supabase calls from UI components.

### Data Layer
- Supabase (PostgreSQL) as the single database.
- Row Level Security (RLS) enforced at the database level.
- Supabase client initialized in `lib/supabase/client.ts`.
- All reads and writes go through service functions.

### Infrastructure Layer
- Supabase Auth for Owner authentication and session management.
- Environment variables for all secrets (never hardcoded).
- Next.js middleware for route protection.

---

## 3. Project Folder Structure

```
aura-os/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (unauthenticated)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Dashboard route group (authenticated)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard home
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── managers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── missions/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── knowledge/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── layout.tsx                # Root layout
│   └── globals.css
│
├── components/                   # Reusable UI components
│   ├── layout/                   # Sidebar, Topbar, shell wrappers
│   ├── ui/                       # Shadcn + Base UI primitives
│   ├── brand/                    # Logo, wordmark
│   ├── search/                   # Search components
│   └── activity/                 # Activity / notification components
│
├── features/                     # Domain feature modules
│   ├── employees/                # Employee list, desk, profile
│   ├── managers/                 # Manager list, detail
│   ├── missions/                 # Mission list, detail, lifecycle
│   ├── knowledge/                # Company / Project / Employee layers
│   └── dashboard/                # Dashboard overview
│
├── services/                     # Supabase data access functions
│   ├── employees.ts
│   ├── managers.ts
│   ├── missions.ts
│   ├── tasks.ts
│   ├── knowledge.ts
│   └── artifacts.ts
│
├── lib/                          # Shared utilities and clients
│   ├── supabase/
│   │   └── client.ts
│   └── utils.ts
│
├── hooks/                        # Custom React hooks
│   ├── useEmployee.ts
│   ├── useMission.ts
│   └── useKnowledge.ts
│
├── types/                        # TypeScript type definitions
│   ├── employee.ts
│   ├── manager.ts
│   ├── mission.ts
│   ├── task.ts
│   ├── knowledge.ts
│   └── artifact.ts
│
├── config/                       # Static configuration
│   └── navigation.ts
│
├── providers/                    # React context providers
│   └── AuthProvider.tsx
│
├── docs/                         # Project documentation
│   ├── MASTER_CONTEXT.md
│   ├── PRD.md
│   └── ARCHITECTURE.md
│
├── public/                       # Static assets
├── .env.local                    # Environment variables (never committed)
├── next.config.ts
├── tsconfig.json
└── package.json
```

> `services/` does not yet exist — create it before Sprint 3.

---

## 4. Routing Architecture

All routes use Next.js App Router with route groups.

| Route | Group | Description |
|---|---|---|
| `/` | — | Redirect to `/dashboard` if authenticated, else `/login` |
| `/login` | `(auth)` | Owner sign in |
| `/dashboard` | `(dashboard)` | Dashboard home |
| `/dashboard/employees` | `(dashboard)` | AI Employee list |
| `/dashboard/employees/[id]` | `(dashboard)` | AI Employee desk (detail view) |
| `/dashboard/managers` | `(dashboard)` | Manager list |
| `/dashboard/managers/[id]` | `(dashboard)` | Manager detail view |
| `/dashboard/missions` | `(dashboard)` | Mission list |
| `/dashboard/missions/[id]` | `(dashboard)` | Mission detail and lifecycle controls |
| `/dashboard/knowledge` | `(dashboard)` | Knowledge browser (all 3 layers) |
| `/dashboard/settings` | `(dashboard)` | Owner / company settings |

**Route protection:** Next.js middleware checks Supabase session on every `(dashboard)` route. Unauthenticated requests redirect to `/login`.

---

## 5. Component Architecture

### Presentational Components
- Located in `components/ui/`.
- Receive data via props. No data fetching. No side effects.
- Wrap Shadcn / Base UI primitives.
- Examples: `Button`, `Badge`, `Card`, `Avatar`, `StatusPill`.

### Feature Components
- Located in `features/<domain>/`.
- Contain domain-specific UI: `EmployeeCard`, `MissionTimeline`, `KnowledgePanel`.
- May fetch data via hooks or receive it from a parent page.
- Never duplicated across features.

### Layout Components
- Located in `components/layout/`.
- Examples: `Sidebar`, `Topbar`, `DashboardShell`, `PageHeader`.
- Used once per layout; not repeated per page.

### Shared UI
- Located in `components/`.
- Domain-agnostic: `SearchBar`, `NotificationBell`, `ThemeToggle`, `BrandLogo`.
- Importable by any feature or layout.

**Rule:** No component is created more than once. If a component is needed in two places, it lives in `components/` and is imported.

---

## 6. State Management

| State Type | Where it lives | Tool |
|---|---|---|
| UI state (open/close, active tab) | Component local state | `useState` |
| Form state | Component or feature level | `useState` / `useReducer` |
| Server data (employees, missions) | Custom hooks that call service functions | `useEffect` + `useState` or React's `use()` |
| Auth session | Context, available app-wide | Supabase Auth + `AuthProvider` |
| Theme | Local storage + CSS variable | `useState` + `useEffect` |

**Rules:**
- No Redux. No Zustand. No external state library in MVP.
- Server data is fetched in page-level Server Components where possible.
- Client components fetch via hooks only when reactivity is required.
- Auth state is provided via `providers/AuthProvider.tsx` and read with a `useAuth` hook.

---

## 7. Authentication Flow

```
Owner visits /dashboard
       │
       ▼
Middleware checks Supabase session
       │
  ┌────┴────────────────────┐
  │ Session valid            │ Session missing / expired
  ▼                          ▼
Render dashboard        Redirect to /login
                               │
                               ▼
                      Owner enters credentials
                               │
                               ▼
                    Supabase Auth (email + password)
                               │
                    ┌──────────┴──────────┐
                    │ Success              │ Failure
                    ▼                      ▼
              Session created         Show error message
                    │
                    ▼
            Redirect to /dashboard
```

- **Sign up:** Owner-only, handled via Supabase Auth.
- **Session:** Stored in Supabase cookie, validated server-side via middleware.
- **Logout:** Calls `supabase.auth.signOut()`, clears session, redirects to `/login`.
- **Protected routes:** All `(dashboard)` routes require a valid session.

---

## 8. Data Flow

```
User action in UI
       │
       ▼
Feature component or page calls a hook
       │
       ▼
Hook calls service function (e.g., services/missions.ts)
       │
       ▼
Service function calls Supabase client
       │
       ▼
Supabase executes query against PostgreSQL (RLS applied)
       │
       ▼
Response returned to service function
       │
       ▼
Hook updates local state
       │
       ▼
UI re-renders with new data
```

**Rules:**
- UI → Hook → Service → Supabase. Never skip layers.
- No raw Supabase calls inside components.
- Service functions handle all error catching and return typed results.

---

## 9. Error Handling

Every data-loading UI must handle all four states:

| State | Behaviour |
|---|---|
| **Loading** | Show skeleton or spinner. Never show empty UI while fetching. |
| **Empty** | Show an empty state message. Never show a blank screen. |
| **Error** | Show an error message with detail. Never fail silently. |
| **Retry** | Provide a retry action where applicable (reload / re-fetch). |

- Errors from service functions are caught and returned as typed error objects.
- Components do not `try/catch` directly — they receive error state from hooks.
- Use Next.js `error.tsx` boundaries for unhandled page-level errors.

---

## 10. Security

| Concern | Implementation |
|---|---|
| **Authentication** | Supabase Auth. Session validated on every request via middleware. |
| **Authorization** | Owner is the only human user. All data belongs to a single company context (MVP). |
| **Row Level Security** | RLS enabled on all Supabase tables. Policies restrict reads/writes to the authenticated owner's company. |
| **Secrets** | All Supabase keys and environment config in `.env.local`. Never committed to version control. |
| **Environment variables** | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client. Service role key (if used) server-side only. |
| **Route protection** | Next.js middleware runs before every `(dashboard)` route render. |

---

## 11. Coding Standards

### File Naming
- Pages: `page.tsx`, `layout.tsx` (Next.js convention).
- Components: `PascalCase.tsx` — e.g., `EmployeeCard.tsx`.
- Hooks: `camelCase.ts` prefixed with `use` — e.g., `useMission.ts`.
- Services: `camelCase.ts` — e.g., `missions.ts`.
- Types: `camelCase.ts` — e.g., `mission.ts`.

### Naming Conventions
- React components: `PascalCase`.
- Functions, variables, hooks: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.
- Types and interfaces: `PascalCase` with descriptive names — e.g., `Mission`, `Employee`, `KnowledgeEntry`.

### Component Conventions
- One component per file.
- Props typed with an explicit interface defined in the same file or imported from `types/`.
- No inline styles. All styling via Tailwind CSS v4 classes.
- No hardcoded strings in components — use config or constants.

### Import Rules
- Absolute imports only. No relative `../../` imports.
- Alias `@/` maps to project root (configured in `tsconfig.json`).
- Import order: external libraries → internal `@/lib` → internal `@/features` → internal `@/components` → types.

### Folder Conventions
- One feature domain per folder under `features/`.
- No cross-feature imports. Features do not import from each other.
- Shared logic goes to `lib/`, `hooks/`, or `components/`.

---

## 12. Future Extension Points

The following are placeholders only. No implementation is defined here.

- **CEO role** — hierarchy node between Owner and Managers (postponed).
- **Multi-company / multi-tenant** — isolated company workspaces per user.
- **Human employees** — adding human workers alongside AI employees.
- **External integrations** — connectors to third-party tools.
- **AI model configuration** — per-employee model selection.
- **Mobile application** — dedicated mobile client.
- **Billing and subscription** — plan management layer.

---

*End of Document*
