---
project_name: caution-bmad
user_name: Melissa
date: 2026-04-11
sections_completed:
  - technology_stack
  - current_development_context
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
status: complete
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in this project. Focused on unobvious details agents commonly miss._

---

## ⚠️ You Are Here

**Phase 2 is active. You are on the `phase2` branch.**

- Do NOT commit to `master` — that is the shipped Phase 1 baseline
- Do NOT re-implement any story marked `done` in `sprint-status.yaml`
- Phase 1 planning docs (`prd.md`, `architecture.md`, `ux-design-specification.md`) are **historical** — they describe what shipped, not what to build now

**What to work on next:** **Human review / pre-ship pass** on `phase2` (UX copy, edge cases, checklist). Epics in `sprint-status.yaml` are **done**; optional: Epic 7 retro, reconcile `epics.md` with `brainstorming-session-2026-04-10-phase2.md`, then merge or release when satisfied. Quiet badge has **no push notifications** — validate manually with two accounts (see agent reply “Testing the quiet badge”).

> After completing any story, update this "What to work on next" line before closing the session.

---

## Current Development Context

### Active Branch & Phase

- Branch: `phase2` — all new work goes here
- `master` = Phase 1 shipped baseline; `ui-experiment` = experimental only

### Sources of Truth (Phase 2)

| Document | Purpose |
|---|---|
| `_bmad-output/planning-artifacts/epics.md` | Epic and story definitions |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Live story status tracker |
| `_bmad-output/implementation-artifacts/deferred-work.md` | Known tech debt — check before raising any issue in a code review |
| `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` | **Authoritative Phase 2 scope** — all features to be built are defined here |

> ⚠️ **`epics.md` was created before the Phase 2 brainstorming session and may not contain all Phase 2 scope.** The brainstorming doc is the authoritative feature list. Before starting any planning, story-creation, or sprint work, verify that `epics.md` accounts for every feature in the brainstorm. If a feature exists in the brainstorm but not in `epics.md`, that is a planning gap — not optional scope — and must be resolved before proceeding.

### Sprint Status (as of 2026-04-15)

- **Epic 1** (Identity & Login): **done** — stories 1-1 through 1-4
- **Epic 2** (Ownership & Privacy): **done** — stories 2-1 through 2-5
- **Epic 3** (About Page & Front Door): **done** — stories 3-1 through 3-3
- **Epic 6** (Tape Creation Improvements): **done** — stories 6-1 through 6-4
- **Epic 4** (Polish & Responsive): **done** — all stories 4-1 through 4-5 complete
- **Epic 5** (Library Redesign): **done** — stories 5-1 through 5-5 (depends on Epics 1 + 2 ✅)
- **Epic 7** (Notifications & Following): **done** — stories 7-1 through 7-4 (depends on Epics 1 + 5 ✅)

### How to Pick the Next Story

1. Open `sprint-status.yaml`
2. Find the lowest-numbered story with status `backlog`
3. Verify its parent epic's dependencies are satisfied (check epics.md)
4. That story is next — do not skip ahead

### Done Story Files Are Historical

Story files in `_bmad-output/implementation-artifacts/` for completed stories are archives. Read them only for pattern reference. Never re-implement them.

---

## Technology Stack & Versions

### Frontend (`web/`)

- React 19.2.4
- Vite 8.0.3 + @vitejs/plugin-react 6.0.1
- TypeScript 5.9.3
- Tailwind CSS 4.2.2 + @tailwindcss/vite 4.2.2 (v4 — no `tailwind.config.js`)
- React Router 7.1.1
- TanStack Query (@tanstack/react-query) 5.62.8
- Zod 3.24.1
- @supabase/supabase-js — installed but **missing from `package.json`** (run `npm install @supabase/supabase-js` in `web/` to fix; tracked in deferred-work.md)

### Backend (`supabase/`)

- Supabase Edge Functions (Deno runtime)
- Supabase PostgreSQL
- Supabase Auth (magic link / email OTP)
- CDN imports: `deno.land/std@0.168.0`, `esm.sh/@supabase/supabase-js@2.45.0`, `esm.sh/zod@3.23.8`

### Testing

- Vitest ^4.1.4 + @testing-library/react ^16.3.2 + @testing-library/jest-dom ^6.9.1 + jsdom ^29.0.2

---

## Language-Specific Rules

### TypeScript

- Strict mode on — no implicit `any`; all params and return types must be typed
- Discard promises with `void`: `void queryClient.invalidateQueries(...)` — never leave floating promises
- Use `unknown` for parsed JSON; narrow before use (see `parseJson<T>` in `api/client.ts`)
- ESM throughout — `"type": "module"` in package.json; no `require()`

### Imports

- Named imports only; no default exports from feature modules (pages and layout components are the exception)
- Tape feature barrel: import from `'../tape'` — re-exports via `tape/index.ts`
- Edge Functions: use CDN URLs (`https://esm.sh/`, `https://deno.land/std@...`), never npm specifiers

### Error Handling

- Client: always use `ApiError` from `api/client.ts`; always check `instanceof ApiError` before `.message`
- Edge Functions: always use `jsonError(code, message, status)` from `_shared/errors.ts`
- Never swallow errors silently; surface inline per UX spec (no toasts for MVP)
- Async in event handlers: `void asyncFn()` — never make event handler props `async`

---

## Framework-Specific Rules

### React

- `TapeRenderer` is `memo`-wrapped — keep it pure; no side effects, no hooks inside the inner component
- Focus management on panel open: `requestAnimationFrame(() => ref.current?.focus())` (see ScenarioPage)
- `useId()` for label/input associations — never hardcode IDs in components
- `startTransition` for non-urgent state switches (e.g. view toggling in HomePage)

### TanStack Query

- Query key factory: `scenarioKeys` in `api/queryKeys.ts` — always use it, never inline key strings
- All mutations must call `invalidateQueries` on both `scenarioKeys.bySlug(slug)` AND `scenarioKeys.all` in `onSettled`
- Optimistic update pattern: cancel queries → snapshot previous → update cache → return `{ previous }` → rollback in `onError`
- Optimistic tapes have `id: 'optimistic-${idempotencyKey}'` — check `isPersistedTape()` before showing edit/delete UI

### React Router

- All routes defined in `web/src/router.tsx` only
- Scenario route: `/s/:slug` — param name is `slug` everywhere, never `id`
- Home navigation via `location.state`: `{ home: true }` or `{ library: true }`; always clear with `navigate(path, { replace: true, state: {} })`

### Auth & Login Gate

- `useAuth()` provides `{ user, session, loading, signOut }`
- `useLoginGate()` manages modal open/close state — use it; do not manage login modal state manually
- Login gate pattern before any mutation: `if (user === null) { openLoginGate(); return }`
- Provider order in `main.tsx`: `QueryProvider` wraps `AuthProvider` — do not reorder

### Supabase (Browser)

- `supabaseClient` from `lib/supabase.ts` — one singleton; never instantiate another
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are safe for the browser bundle
- `supabaseFetch()` in `api/client.ts` injects the auth token automatically — use it for all Edge Function calls
- Always call `isSupabaseConfigured()` guard before rendering any data-fetching UI

### Supabase Edge Functions

- Edge Functions must use `SUPABASE_SERVICE_ROLE_KEY` from `Deno.env.get(...)` — never the anon key
- Always handle `OPTIONS` method first (CORS preflight) before any logic
- Zod parse at every entry; use `formatZodError` from `_shared/zod.ts` for error messages
- All mutations (`update-tape`, `delete-tape`, etc.) use HTTP `POST` — not `PATCH`/`PUT`/`DELETE`

---

## Testing Rules

- Test files co-located next to source: `ComponentName.test.tsx` beside `ComponentName.tsx`
- Run: `npm test` in `web/` → `vitest run` (single pass, no watch mode)
- Use `@testing-library/react` + `@testing-library/user-event`; never Enzyme or react-test-renderer
- `test-setup.ts` stubs Supabase env vars — it is registered via `setupFiles` in `vite.config.ts`; do NOT import it manually in individual test files
- Vitest config lives in `vite.config.ts` — there is no separate `vitest.config.ts`; do not create one
- Test `TapeRenderer` for accessibility (aria labels, roles) and behavior, not pixel/style output
- Mock pattern: `vi.mock('../path')` at module level; `vi.fn()` for callbacks; `vi.clearAllMocks()` in `beforeEach`

---

## Code Quality & Style

### Naming

- React components: `PascalCase` file and export (`TapeRenderer.tsx`)
- Hooks: `use` prefix + camelCase (`useLoginGate`, `useAuth`)
- Utilities: camelCase files (`copyToClipboard.ts`, `knownScenarios.ts`)
- Edge Function directories: kebab-case (`create-scenario/index.ts`)
- DB tables: plural snake_case (`scenarios`, `tapes`); columns: snake_case (`tape_text`, `public_slug`)
- JSON at HTTP boundary: camelCase (`tapeText`, `publicSlug`); mapping lives in `_shared/map.ts`

### Tailwind v4 Styling

- Design tokens defined in `web/src/index.css` under `@theme` — never hardcode hex values in JSX
- Semantic color classes: `bg-background`, `bg-surface`, `bg-surface-raised`, `bg-accent`, `text-foreground`, `text-muted`, `text-accent-text`, `border-border`
- Font classes: `font-display` (Bebas Neue — use with `uppercase tracking-wide`), `font-ui` (DM Mono)
- Minimum tap target: `min-h-[44px]` on all interactive elements
- Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent` on every interactive element
- No `tailwind.config.js` — v4 uses CSS-native `@theme` config only

### File Structure (Actual, Not Architecture Spec)

The architecture doc shows an aspirational `features/` layout. The Phase 1 codebase uses a flat structure:

- `web/src/pages/` — route-level page components
- `web/src/tape/` — tape feature (flat, not under `features/`)
- `web/src/components/` — shared presentational components
- `web/src/api/` — `client.ts`, `types.ts`, `queryKeys.ts`
- `web/src/lib/` — utilities
- `web/src/providers/` — React context providers
- `web/src/layout/` — `AppLayout`

**For new Epic 2+ feature code:** use `web/src/features/<feature-name>/` per the architecture spec — the flat layout is Phase 1 legacy; new epics should follow the spec.

---

## Critical Don't-Miss Rules

### Security (never violate)

- **NEVER** put `SUPABASE_SERVICE_ROLE_KEY` in any `VITE_*` env var or any frontend file
- Service role key lives only in `supabase/functions/**` via `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`
- Anon key (`VITE_SUPABASE_ANON_KEY`) is safe for the browser — never use it as an elevated key in Edge Functions
- `extractUserId()` in `_shared/auth.ts` returns `null` for anonymous callers — it never throws; mutation endpoints (update-tape, delete-tape, update-scenario, delete-scenario) enforce 401/403 as of story 2-1

### Idempotency

- `add-tape` requires an `idempotencyKey` — always pass `crypto.randomUUID()`; generate once per "add session", reset on success (see `addTapeIdempotencyKey` state in `ScenarioPage`)

### Known Tech Debt — Do Not Re-Raise in Code Reviews

Check `_bmad-output/implementation-artifacts/deferred-work.md` before flagging any issue. Known tracked items include:

- `@supabase/supabase-js` not declared in `package.json`
- `owner_id`/`author_id` exposed in public API responses (Epic 2 decision pending)
- Ownership columns are unenforced metadata until Epic 2 RLS
- `normalizeHex` accepts non-hex strings without validation
- `localStorage` ops have no try/catch in `knownScenarios.ts`
- `updated_at` on scenarios set via wall clock (no DB trigger)
- DB error messages leak raw Postgres details in `DATABASE_ERROR` responses
- CORS wildcard (`*`) on all Edge Function mutation endpoints

### Planning Artifact Rules (never violate)

- **Never overwrite or delete content in planning artifacts** (`epics.md`, `sprint-status.yaml`, `project-context.md`) unless the user explicitly asks to change or remove something specific — these files are append-only by default
- **Never resolve a conflict between planning artifacts unilaterally** — if two sources disagree (e.g. sprint-status has stories not in `epics.md`, or vice versa), stop, describe the exact inconsistency, and ask the user which is correct before touching anything

### No-Go Patterns

- Do NOT add `App.tsx` — entry is `main.tsx` → `router.tsx` → `AppLayout` → pages
- Do NOT create `tailwind.config.js` — v4 uses `@theme` in CSS only
- Do NOT create `vitest.config.ts` — vitest is configured inside `vite.config.ts`
- Do NOT use `PATCH`, `PUT`, or `DELETE` HTTP methods for Edge Function mutations — all use `POST`
- Do NOT introduce global state stores — server state = TanStack Query; UI state = local `useState`/`useReducer`
- Do NOT bypass `supabaseFetch()` for Edge Function calls (it handles auth token injection)

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Check `sprint-status.yaml` before picking up a story to confirm it's next and unblocked
- When you complete a story, update the "What to work on next" line at the top of this file
- When in doubt, prefer the more restrictive option
- Do not re-raise issues already tracked in `deferred-work.md`

**For Humans:**

- Keep this file lean — remove rules that become obvious over time
- Update "What to work on next" after every story ships
- Update the Technology Stack section when dependencies change
- Review deferred-work.md periodically and promote items to stories when ready

_Last updated: 2026-04-15 (Epic 7 complete: follow/unfollow, opportunistic follow prompt, sprint docs updated)_
