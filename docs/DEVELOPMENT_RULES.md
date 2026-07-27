# Aura OS — Development Rules

> **Status:** Active
> **Purpose:** Permanent engineering contract for the project.
> **Audience:** Developers and AI coding agents.

This document serves as the absolute engineering contract for Aura OS. All contributors (human and AI) must adhere strictly to these rules.

---

## 1. Project Principles

- **Single source of truth:** The documentation in `docs/` (`MASTER_CONTEXT.md`, `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`) is the single source of truth. Do not invent new features or diverge from approved architecture.
- **Feature-first architecture:** Organize code by domain feature (e.g., `features/employees/`) rather than technical concern, except for shared UI/utilities.
- **No duplicate logic:** If a component or function is needed in two places, move it to a shared location (`components/`, `lib/`, or `hooks/`).
- **Keep MVP simple:** Do not pre-optimize or build features beyond the defined MVP scope (e.g., multi-tenant, billing, human employees).

---

## 2. Folder Rules

- **Allowed folders:** The project strictly uses `app/`, `components/`, `features/`, `services/`, `lib/`, `hooks/`, `types/`, `config/`, `docs/`, `providers/`, and `public/`.
- **When a new folder may be created:** Only when creating a new domain feature inside `features/` or if explicitly defined in the architecture.
- **One component per file:** Every React component must have its own file.
- **No miscellaneous folders:** Do not create `misc/`, `helpers/`, `shared/` or other vague directories. Use `lib/` or `components/` appropriately.

---

## 3. Component Rules

- **Server vs Client Components:** Default to React Server Components (RSC) for data fetching. Add `"use client"` only when interactivity (hooks, event listeners) is required.
- **Presentation components:** Located in `components/ui/`. Pure UI, no data fetching, no side effects. Wrap Shadcn/Base UI primitives.
- **Feature components:** Located in `features/<domain>/`. Domain-specific UI (e.g., `EmployeeCard`). Do not duplicate across features.
- **Layout components:** Located in `components/layout/`. Shells, sidebars, and topbars used once per layout layer.
- **Reusable UI components:** Located in `components/`. Domain-agnostic (e.g., `SearchBar`, `ThemeToggle`).

---

## 4. Data Rules

- **Components never call Supabase directly:** UI and feature components must never import or call the Supabase client.
- **Only services access the database:** All Supabase operations live in `services/`.
- **Services use `lib/db` wrappers:** Services must call the pure query/mutation wrappers in `lib/db/queries.ts` and `lib/db/mutations.ts`.
- **No duplicated queries:** If a data fetch is needed in multiple places, ensure the query wrapper in `lib/db` is reused.

---

## 5. State Management Rules

- **Local state:** Use `useState` and `useReducer` for UI state (dropdowns, tabs, forms).
- **Context:** Use React Context sparingly, primarily for app-wide state like Auth (`AuthProvider`) or Theme (`ThemeProvider`).
- **Server state:** Use custom hooks wrapping service functions, or React's `use()` in Server Components.
- **No Redux unless explicitly approved:** Do not introduce Redux, Zustand, or other external state libraries during the MVP phase.

---

## 6. Database Rules

- **Never edit production schema directly:** All schema changes must go through migration files in version control. No Supabase Dashboard schema edits.
- **Always use migrations:** Place numbered SQL migration files in `supabase/migrations/`.
- **Soft delete policy:** Never hard-delete records for `managers`, `employees`, `missions`, `knowledge_entries`, or `artifacts`. Always update `deleted_at`. Queries must filter out soft-deleted rows (`is("deleted_at", null)`).
- **RLS policy requirements:** Row Level Security must be enabled on all tables. Policies must anchor on `auth.uid() = owner_id` (or equivalent relation) to restrict data to the authenticated owner.

---

## 7. Coding Standards

- **Naming conventions:**
  - React components: `PascalCase`.
  - Functions, variables, hooks: `camelCase`.
  - Constants/Enums: `UPPER_SNAKE_CASE`.
  - Types/Interfaces: `PascalCase`.
- **Import order:** External libraries → Internal aliases (`@/lib`, `@/services`, etc.) → Internal UI (`@/components`, `@/features`) → Types.
- **No relative `../../` imports:** Always use absolute imports.
- **Use `@` alias:** Maps to the project root for clean import paths.
- **File naming:**
  - Pages/Layouts: `page.tsx`, `layout.tsx`.
  - Components: `PascalCase.tsx` (e.g., `MissionTimeline.tsx`).
  - Hooks/Services/Types: `camelCase.ts`.

---

## 8. Error Handling Standards

Every data-loading UI must intentionally handle four states:

- **Loading:** Display skeleton loaders or spinners. Never show an empty or broken UI while fetching data.
- **Empty:** Display a clear, helpful empty state message when no data exists.
- **Error:** Display a descriptive error message. Never fail silently or log to console without user feedback.
- **Retry:** Provide a retry action (button/link) when a fetch fails.
- **Toast notifications:** Use toast notifications for success/failure feedback on user mutations (e.g., "Employee created successfully", "Failed to update mission").

---

## 9. Git Workflow

- **Feature branches:** Always branch off `main` using descriptive names (`feature/mission-crud`, `fix/login-hydration`).
- **Commit message format:** Use imperative, clear messages (e.g., `feat: implement employee list`, `fix: resolve auth hydration mismatch`).
- **PR checklist:** Ensure code builds, types check, lints pass, and adheres to these Development Rules before merging.

---

## 10. AI Development Rules

When operating as an AI coding agent on this codebase:

- **Read existing code before editing:** Always inspect context and existing implementations before writing new code.
- **Modify the minimum number of files:** Do not refactor unrelated code. Keep changes tightly scoped to the request.
- **Never rewrite working code without reason:** Do not arbitrarily change functional implementations.
- **Explain implementation plan before coding:** Outline files to create/modify and the general approach before executing.
- **Run TypeScript check before completion:** Always run `npm run tsc --noEmit` (or equivalent) to verify types.
- **Run build before completion:** Always run `npm run build` to ensure the production build succeeds.
- **Preserve project architecture:** Stick strictly to the defined layers (Presentation → Feature → Service → DB Wrapper → Supabase).

---

## 11. Definition of Done

Every feature, task, or AI coding sprint is considered complete **only if**:

1. **Build passes:** `npm run build` succeeds with zero errors.
2. **TypeScript passes:** `tsc --noEmit` succeeds with zero errors.
3. **No lint errors:** `npm run lint` succeeds with zero errors.
4. **No hydration issues:** Application renders perfectly on the client matching the server HTML.
5. **No console errors:** No React warnings, missing keys, or runtime errors in the browser console.
6. **Documentation updated if architecture changes:** If a new authorized system or pattern is introduced, `ARCHITECTURE.md` and related docs must be updated.

---

*End of Document*
