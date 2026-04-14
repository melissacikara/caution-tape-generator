# Story 5.3: Private tab — My Scenarios bucket

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a logged-in creator,
I want to see the scenarios I created in my Private tab,
So that I can quickly return to my own boards (brainstorm #11 — three buckets, progressive disclosure).

## Acceptance Criteria

1. **Given** the Private tab and a logged-in user,
   **When** the user has created at least one scenario (`owner_id` matches their user id),
   **Then** a **My Scenarios** bucket renders with scenario cards for each owned scenario (**public and private**),
   **And** cards use the same grid and card pattern as the Public tab (`ScenarioLibrary` — 1 col mobile → 2 col at `sm+`, name + tape count provocative line).

2. **Given** a logged-in user,
   **When** they have created **no** scenarios,
   **Then** the **My Scenarios** bucket **does not render** (no section heading, no empty-state paragraph — progressive disclosure; empty buckets are hidden).

3. **Given** a My Scenarios card,
   **When** the user activates it,
   **Then** navigation goes to that scenario’s route (`/s/:slug` — `scenario.publicSlug`).

4. **Given** the My Scenarios query is loading,
   **When** the user is on the Private tab,
   **Then** show the same skeleton loading pattern used elsewhere (`ScenarioLibrary` with `isLoading: true` — `aria-busy="true"` grid), **without** the “My Scenarios” heading until data has loaded (heading only when the bucket is actually shown).

5. **Given** the My Scenarios fetch fails,
   **When** the error is surfaced,
   **Then** show an inline error message and a **Retry** button (same UX pattern as the Public tab / `ScenarioLibrary` error state).

6. **Given** regression safety,
   **When** tests and manual checks complete,
   **Then** Public tab behavior from story 5-2 is unchanged, and `npm test` in `web/` passes.

## Tasks / Subtasks

- [x] **Task 1: Edge Function `list-my-scenarios`** (AC: 1, 2, 3)
  - [x] Add `supabase/functions/list-my-scenarios/index.ts`
  - [x] `OPTIONS` first → `corsHeaders` from `_shared/cors.ts`
  - [x] `GET` only; other methods → `405` / `METHOD_NOT_ALLOWED`
  - [x] `const userId = await extractUserId(req)`; if `!userId` → `jsonError('UNAUTHORIZED', 'Login required', 401)` (same pattern as `delete-scenario`, `toggle-scenario-visibility`, `update-scenario`)
  - [x] Service client with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; query `scenarios`: `select('id, name, public_slug, owner_id, is_public, created_at, updated_at').eq('owner_id', userId).order('created_at', { ascending: false }).limit(50)`
  - [x] Tape counts: same approach as `list-public-scenarios` — second query on `tapes` for `scenario_id IN (...)`, build `Map` counts, map rows with `mapScenario` from `_shared/map.ts`
  - [x] Return `jsonOk({ scenarios: withCounts })` — **`ListScenariosResponse` shape** (array of `{ scenario, tapeCount }`)
  - [x] CDN imports only (`serve`, `createClient`) — no npm specifiers

- [x] **Task 2: Local Supabase config** (AC: 1)
  - [x] Add `[functions.list-my-scenarios]` with `verify_jwt = false` to `supabase/config.toml` (matches other functions — JWT verified in-function via `extractUserId`)

- [x] **Task 3: API client + query key** (AC: 1, 2, 4, 5)
  - [x] In `web/src/api/queryKeys.ts`, add: `myScenarios: (userId: string) => [...scenarioKeys.all, 'mine', userId] as const`  
        (must include `userId` so caches do not leak across accounts)
  - [x] In `web/src/api/client.ts`, add `listMyScenarios(): Promise<ListScenariosResponse>` — **GET** to `list-my-scenarios`, same header pattern as `listPublicScenarios` / `getScenarioBySlug` (manual `Authorization` + `apikey`, **not** `supabaseFetch`)

- [x] **Task 4: Wire Private tab — My Scenarios bucket in `LibraryPage`** (AC: 1–5)
  - [x] Second `useQuery` for owned scenarios:
    - `queryFn: listMyScenarios`
    - `queryKey: scenarioKeys.myScenarios(user.id)` (only when `user` is non-null)
    - `enabled: isSupabaseConfigured() && user !== null` (fetch when logged in even on Public tab so Private tab is warm — acceptable; alternatively restrict `enabled` to Private tab only if you want fewer calls — **either is fine**, document the choice in a one-line comment)
  - [x] **Progressive disclosure (critical):**
    - If `!isLoading && !error && scenarios.length === 0` → **render nothing** for this bucket (do **not** pass this case through `ScenarioLibrary`’s default empty message)
    - If `isLoading` → render `ScenarioLibrary` with `items={[]}`, `isLoading={true}` inside the private panel (no `h2` yet)
    - If `error` → `ScenarioLibrary` or matching error UI with `errorMessage` + `onRetry` (`void refetch()`)
    - If `scenarios.length > 0` → render a `<section>` with accessible heading **“My Scenarios”** (`font-display`, uppercase + tracking-wide to match Library heading), then `ScenarioLibrary` with `items`, `isLoading={false}`
  - [x] Card links: already `/s/${scenario.publicSlug}` inside `ScenarioLibrary` — no change needed
  - [x] Zero-tape copy: **creator-context default** is fine (`ScenarioLibrary` default provocative line / optional `zeroTapeCaption` only if you need parity with public feed — not required by AC)

- [x] **Task 5: Cache invalidation** (AC: 1, 6)
  - [x] Confirm existing mutations already call `invalidateQueries({ queryKey: scenarioKeys.all })` (e.g. `ScenarioPage`, `HomePage`) — that **must** invalidate `myScenarios` keys because they extend `scenarioKeys.all`
  - [x] If any create/delete/toggle path does **not** invalidate `scenarioKeys.all`, add it (do not add one-off invalidations unless you find a gap)

- [x] **Task 6: Tests — `LibraryPage.test.tsx`** (AC: 1, 2, 4, 5, 6)
  - [x] `LibraryPage` will call **`useQuery` twice** — replace the single `mockReturnValue` pattern with `mockImplementation((options) => { ... })` that branches on `options.queryKey` (e.g. `queryKey.includes('public-feed')` vs `queryKey.includes('mine')`)
  - [x] Extend `vi.mock('../api/client')` to include `listMyScenarios: vi.fn()`
  - [x] Add tests:
    - Logged-in user, Private tab, **mine** query loading → skeleton (`aria-busy`) in private panel
    - Logged-in user, Private tab, **mine** returns `[]` → **no** “My Scenarios” heading, **no** empty-state paragraph from `ScenarioLibrary`
    - Logged-in user, Private tab, **mine** returns one scenario → heading “My Scenarios” + link `href="/s/<slug>"`
    - **mine** query errors → error copy + Retry calls refetch for **that** query
  - [x] Keep all existing Public tab tests passing (public-feed branch of mock must still return the same shapes as today)

- [x] **Task 7: Regression** (AC: 6)
  - [x] Run `npm test` in `web/`

## Dev Notes

### What This Story Is and Is Not

**Is:** First **Private** bucket — **My Scenarios** only. Authenticated Edge Function listing scenarios where `owner_id` = caller. UI in `LibraryPage` private panel with progressive disclosure.

**Is not:** Invited bucket (5.4), Following bucket (5.5), follow/unfollow (Epic 7), changes to Public feed, homepage top-3, or RLS policy work.

### Critical: Progressive Disclosure vs `ScenarioLibrary` Default Empty State

`ScenarioLibrary` always shows `emptyMessage` when `items.length === 0` and not loading. **For My Scenarios, a successful empty list must not render that component at all** — otherwise you violate AC (“bucket does not render”). Only use `ScenarioLibrary` for this bucket when loading, error, or `items.length > 0`.

### Do Not Reuse `list-scenarios` for This Feature

`list-scenarios` takes an explicit `slugs[]` list (device-known scenarios). **My Scenarios** requires `WHERE owner_id = :userId`. A dedicated `list-my-scenarios` endpoint keeps contracts clear and avoids overloading slug-based list semantics.

### Do Not Use `list-public-scenarios`

That function filters `is_public = true`. Owned scenarios include **private** boards — query **must not** filter on `is_public`.

### Auth and Security

- Browser: only anon key + user JWT via existing client patterns; never service role in frontend.
- Edge: service role + `extractUserId` for authorization; anonymous callers get **401**.

### Alignment With Existing Patterns

- **Edge Function:** Copy structure from `supabase/functions/list-public-scenarios/index.ts`, add `extractUserId` + `401` + `.eq('owner_id', userId)`.
- **Client GET:** Copy `listPublicScenarios` in `web/src/api/client.ts`.
- **Styling:** Semantic tokens only (`project-context.md` — `bg-surface-raised`, `font-display`, `font-ui`, focus rings, `min-h-[44px]`).
- **Errors:** `ApiError` + `instanceof` check in JSX; discard promises with `void refetch()`.

### Project Structure Notes

- New Edge Function directory: **kebab-case** `list-my-scenarios`.
- Page stays in `web/src/pages/` (Phase 2 library work matches 5.1/5.2 — no new `features/library/` required unless you extract a small presentational chunk; prefer keeping `LibraryPage` readable over premature abstraction).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.3]
- [Source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Decision #11 (three buckets, progressive disclosure)]
- [Source: `_bmad-output/implementation-artifacts/5-2-public-scenarios-feed.md` — Edge GET pattern, `ScenarioLibrary`, `LibraryPage` query wiring, tests]
- [Source: `_bmad-output/implementation-artifacts/5-1-two-tab-library-structure-and-shell.md` — Private tab shell, auth gating]
- [Source: `supabase/functions/list-public-scenarios/index.ts` — template for list + tape counts]
- [Source: `supabase/functions/delete-scenario/index.ts` — `UNAUTHORIZED` / `401` pattern]
- [Source: `web/src/pages/LibraryPage.tsx` — private panel stub `{/* Stories 5.3–5.5 */}`]
- [Source: `web/src/api/queryKeys.ts`, `web/src/api/client.ts`]
- [Source: `_bmad-output/project-context.md` — stack, TanStack Query keys, anti-patterns]

## Previous Story Intelligence (5-2)

- **New read endpoints** use **GET** + manual fetch headers (not `supabaseFetch`) when there is no JSON body.
- **`ListScenariosResponse`** already fits owned scenarios — no new response DTO.
- **`ScenarioLibrary`** is the right grid/card component; extend usage via **conditional rendering**, not by forcing empty owned lists through its empty state.
- **Tests** already mock `useQuery` globally — **two queries** require `mockImplementation` keyed by `queryKey`.
- **Code review notes from 5-2:** `DATABASE_ERROR` / `ownerId` exposure / tape-count scaling are known deferred patterns — mirror `list-public-scenarios` unless product says otherwise; do not expand scope to “fix” deferred items in this story.

## Git Intelligence Summary

Recent commits on `phase2` are epic-sized bundles (e.g. Epic 2 ownership, Epic 3 about). For file-level patterns, prefer **`list-public-scenarios`** and **`LibraryPage`** / **`LibraryPage.test.tsx`** as the **canonical references** for this story.

## Latest Technical Information

- React 19.2.4, TanStack Query 5.62.8, React Router 7.1.1, Supabase JS from project — follow `project-context.md` for versions and import rules (no floating promises, `void` for async handlers).

## Project Context Reference

Read `_bmad-output/project-context.md` before implementation — especially: query key factory usage, `ApiError` handling, Tailwind v4 tokens, Edge Function CORS/`OPTIONS` first, POST-only mutations elsewhere (this story’s **read** endpoint is **GET**).

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented `list-my-scenarios` Edge Function (GET, `extractUserId` →401, owner-scoped list + tape counts, `ListScenariosResponse` shape).
- Added `scenarioKeys.myScenarios(userId)` and `listMyScenarios()` GET client (manual auth headers, same as public list).
- `LibraryPage`: second query warms when logged in; progressive disclosure hides empty owned bucket; loading uses `ScenarioLibrary` skeleton without heading; errors match public inline + Retry pattern.
- Verified `invalidateQueries({ queryKey: scenarioKeys.all })` in `HomePage` / `ScenarioPage` already invalidates `mine` keys (prefix `['scenarios']`).
- Extended `LibraryPage.test.tsx` with dual `useQuery` mock branches and Private-tab coverage; full `npm test` green (90 tests).

### File List

- `supabase/functions/list-my-scenarios/index.ts`
- `supabase/config.toml`
- `web/src/api/queryKeys.ts`
- `web/src/api/client.ts`
- `web/src/pages/LibraryPage.tsx`
- `web/src/pages/LibraryPage.test.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/project-context.md`

### Change Log

- 2026-04-13: Story context file created (`ready-for-dev`).
- 2026-04-13: Implementation complete — Edge function, client, Library Private bucket, tests; story → `review`; sprint `5-3` → `review`.

### Review Findings

- [x] [Review][Dismissed] Story 5-3 vs 5-4 in one surface area — **Resolved 2026-04-13:** Phase 2 intentionally batches related Library work on a shared `LibraryPage`. The story’s “Is not: Invited bucket (5.4)” describes the **vertical slice for story 5-3** (what that story file is responsible for articulating), not a prohibition on implementing adjacent buckets in the same branch when both are in active sprint review. No split/revert required.

- [x] [Review][Patch] Private tab blank during auth loading — **Fixed 2026-04-13:** While `useAuth().loading` is true, Private tab now renders `ScenarioLibrary` with `items={[]}` and `isLoading` (skeleton + `aria-busy`) instead of an empty panel (`LibraryPage.tsx`).

- [x] [Review][Patch] Emoji in logged-out Private copy — **Fixed 2026-04-13:** Removed warning emoji from “Your private collection lives here.” (`LibraryPage.tsx`).

- [x] [Review][Defer] Raw DB error messages on `list-my-scenarios` — `list-my-scenarios/index.ts` returns `DATABASE_ERROR` with `sErr.message` / `tErr.message` (`:37–38`, `:52–53`). Pre-existing project pattern; tracked in `deferred-work.md` under DB error leakage.
