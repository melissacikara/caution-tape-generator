# Story 5.5: Private tab — Following bucket

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created -->

## Story

As a logged-in user,
I want to see public scenarios I've chosen to follow in my Private tab,
So that I can return to community scenarios I care about (brainstorm #6, #11 — follow = bookmark; three buckets, progressive disclosure).

## Acceptance Criteria

1. **Given** the Private tab and a logged-in user,
   **When** the user is following at least one **public** scenario (i.e. a `scenario_follows` row exists for that user + scenario, and the scenario still qualifies — see Dev Notes),
   **Then** a **Following** bucket renders with scenario cards for those scenarios,
   **And** cards use the same grid and card pattern as the other buckets (1 col mobile → 2 col at `sm+`, name + tape count provocative line via `ScenarioLibrary`).

2. **Given** a logged-in user,
   **When** they are following no qualifying public scenarios (no rows, or all filtered out by visibility rules),
   **Then** the **Following** bucket **does not render** (no section heading, no empty-state — progressive disclosure, empty buckets are hidden).

3. **Given** a Following card,
   **When** the user activates it,
   **Then** navigation goes to that scenario's route (`/s/:slug` — `scenario.publicSlug`).

4. **Given** the Following query is loading,
   **When** the user is on the Private tab,
   **Then** the **Following** bucket uses the **same shell as My Scenarios / Invited**: a `<section>` with the **Following** heading and a skeleton loading state (`ScenarioLibrary` with `isLoading: true`, `aria-busy="true"` grid) beneath it.

5. **Given** the Following fetch fails,
   **When** the error is surfaced,
   **Then** show an inline error message and a **Retry** button (same UX pattern as My Scenarios / Invited / Public tab).

6. **Given** persistence and Epic alignment,
   **When** implementation is complete,
   **Then** followed scenarios are stored server-side in a new table (not localStorage),
   **And** **Follow / Unfollow UI and mutations are explicitly out of scope** — they belong to **Epic 7, Story 7.3**; this story only adds the **read path** (list + UI bucket) so 7.3 can write to the same table.

7. **Given** regression safety,
   **When** tests and manual checks complete,
   **Then** Public tab, My Scenarios, and Invited bucket behavior remain unchanged, and `npm test` in `web/` passes.

## Tasks / Subtasks

- [x] **Task 1: DB migration — `scenario_follows` table** (AC: 1, 2, 6)
  - [x] Create `supabase/migrations/<timestamp>_create_scenario_follows.sql` with a timestamp **after** the latest migration (`20260414000000_create_scenario_invites.sql`).
  - [x] Table: `scenario_follows (user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, scenario_id))`
  - [x] Index: `CREATE INDEX IF NOT EXISTS idx_scenario_follows_user_id ON scenario_follows(user_id)`
  - [x] Enable RLS: `ALTER TABLE scenario_follows ENABLE ROW LEVEL SECURITY` (Edge Functions use service role — bypasses RLS; same pattern as `scenario_invites`)

- [x] **Task 2: Edge Function `list-followed-scenarios`** (AC: 1–5)
  - [x] Add `supabase/functions/list-followed-scenarios/index.ts`
  - [x] `OPTIONS` first → `corsHeaders` from `_shared/cors.ts`
  - [x] `GET` only; other methods → `405` / `METHOD_NOT_ALLOWED`
  - [x] `const userId = await extractUserId(req)`; if `!userId` → `jsonError('UNAUTHORIZED', 'Login required', 401)`
  - [x] Service client with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  - [x] Two-phase query (mirror `list-invited-scenarios`):
    - Phase 1: `supabase.from('scenario_follows').select('scenario_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)`
    - If no rows → return `jsonOk({ scenarios: [] })` early
    - Phase 2: `supabase.from('scenarios').select('id, name, public_slug, owner_id, is_public, created_at, updated_at').in('id', followIds).eq('is_public', true).neq('owner_id', userId).order('created_at', { ascending: false })`
      - **`is_public = true`:** if a followed board was later made private, it must **not** appear in Following (user should not see private content via a follow row).
      - **`owner_id != userId`:** belt-and-suspenders; Epic 7.3 will not offer Follow on own scenarios, but this keeps My Scenarios vs Following disjoint if bad data exists.
    - [x] Tape counts: same `Map` approach as `list-invited-scenarios` — query `tapes` for `scenario_id IN (...)`, attach counts, `mapScenario` each row
    - [x] Return `jsonOk({ scenarios: withCounts })` — **`ListScenariosResponse`** shape (`{ scenario, tapeCount }[]`)

- [x] **Task 3: Local Supabase config** (AC: 1)
  - [x] Add `[functions.list-followed-scenarios]` with `verify_jwt = false` to `supabase/config.toml` (match every other function entry)

- [x] **Task 4: API client + query key** (AC: 1, 2, 4, 5)
  - [x] In `web/src/api/queryKeys.ts`, add: `followingScenarios: (userId: string) => [...scenarioKeys.all, 'following', userId] as const` — **must** include `userId` so caches do not leak across accounts (same rule as `invitedScenarios` / `myScenarios`)
  - [x] In `web/src/api/client.ts`, add `listFollowedScenarios(): Promise<ListScenariosResponse>` — `GET` to `list-followed-scenarios`, **same manual `Authorization` + `apikey` headers** as `listMyScenarios` / `listInvitedScenarios` (not `supabaseFetch` — GET, no body)

- [x] **Task 5: Wire Private tab — Following bucket in `LibraryPage`** (AC: 1–5)
  - [x] Fourth `useQuery` for followed scenarios (e.g. `followingData`, `followingLoading`, `followingError`, `refetchFollowing`):
    - `queryFn: listFollowedScenarios`
    - `queryKey: scenarioKeys.followingScenarios(user?.id ?? '__none__')`
    - `enabled: isSupabaseConfigured() && user !== null` (warm alongside other private queries)
  - [x] **Progressive disclosure + loading shell (match Invited / My Scenarios — Option A, 2026-04-15):**
    - If `followingLoading` → `<section aria-labelledby="following-heading">` + **Following** `<h2>` + `<ScenarioLibrary items={[]} isLoading />`
    - If `followingError` → same section + `<h2>` + `<ScenarioLibrary ... errorMessage={...} onRetry={() => void refetchFollowing()} />`
    - If `!followingLoading && !followingError && (followingData?.scenarios ?? []).length === 0` → **render nothing** (no empty-state copy)
    - If length > 0 → same section + `<h2>` + `<ScenarioLibrary items={followingData!.scenarios} isLoading={false} />`
  - [x] Place the Following bucket **after** the Invited bucket (replace the `{/* Story 5.5: Following bucket */}` stub in `LibraryPage.tsx`)
  - [x] **Do not** pass `emptyMessage` or `zeroTapeCaption` for the Following bucket when showing cards — progressive disclosure means no empty list UI; optional `zeroTapeCaption` only if product copy matches other buckets with zero tapes (Invited omits both — **match Invited**)

- [x] **Task 6: Tests — `LibraryPage.test.tsx`** (AC: 1, 2, 4, 5, 7)
  - [x] `LibraryPage` uses **four** `useQuery` hooks — extend `mockImplementation` to branch on keys: `public-feed`, `mine`, `invited`, **`following`**
  - [x] Extend `vi.mock('../api/client')` with `listFollowedScenarios: vi.fn()`
  - [x] Extend shared query stubs with a `following` stub object (mirror `invited` structure)
  - [x] Add tests:
    - Logged-in, Private tab, **following** query loading → **Following** heading + skeleton (`aria-busy`), same as Invited
    - Logged-in, **following** returns `[]` → no heading, no empty-state copy
    - Logged-in, **following** returns one scenario → heading "Following" + link `href="/s/<slug>"`
    - **following** errors → inline error + Retry calls `refetchFollowing`
  - [x] Keep all existing tests green (Public, My Scenarios, Invited branches unchanged)

- [x] **Task 7: Regression** (AC: 7)
  - [x] Run `npm test` in `web/`

## Dev Notes

### Scope boundary vs Epic 7

- **This story (5.5):** `scenario_follows` table, `list-followed-scenarios`, client + query key, **Following** bucket UI, tests.
- **Epic 7.3 (Follow / Unfollow):** buttons on scenario view, Edge Function(s) or shared mutation to **insert/delete** `scenario_follows` rows, badge behavior, invalidation. **Do not implement 7.3 in this story.**
- **Manual QA before 7.3:** insert test rows into `scenario_follows` via Supabase SQL/dashboard to verify the bucket; or rely on unit tests with mocked `listFollowedScenarios`.

### Why the read path ships before writes

Epics.md lists **Epic 7** as depending on **Epic 5** because the Following **bucket** must exist first. Shipping the list endpoint + UI completes the library contract; 7.3 then connects user actions to the same table.

### Progressive disclosure (non-negotiable)

Same rule as 5-3 and 5-4: a successful **empty** followed list must render **no** bucket — never `ScenarioLibrary` with `items=[]` and `isLoading=false` for Following (that would show the default empty copy).

### Filter semantics (Phase 2 query)

| Condition | Rationale |
|-----------|-----------|
| `is_public = true` | Following is only for **public** boards; private boards belong in Invited / link model, not follow |
| `owner_id != userId` | Own boards appear under **My Scenarios**; Following is for others’ public scenarios |

Stale follow rows (scenario deleted) disappear via `ON DELETE CASCADE` on `scenario_id`.

### Ordering

Same MVP tradeoff as 5-4: Phase 2 uses `scenarios.created_at DESC` for simplicity; `scenario_follows.created_at` order may not be preserved through `.in('id', ids)`. Acceptable for MVP — document in a one-line comment in the Edge Function if you touch ordering.

### Cache invalidation

Existing mutations that call `invalidateQueries({ queryKey: scenarioKeys.all })` should already cover `followingScenarios` keys (prefix `['scenarios']`). Verify when implementing; **Epic 7.3** must invalidate after follow/unfollow — `scenarioKeys.all` is sufficient if the pattern holds.

### Auth pattern

- Browser: `GET` + manual `Authorization` + `apikey` — **not** `supabaseFetch`
- Edge: service role + `extractUserId` → `401` if unauthenticated

### Four-query mock pattern (tests)

```ts
vi.mocked(useQuery).mockImplementation((options: UseQueryOptions<any>) => {
  const key = options.queryKey as string[]
  if (key.includes('public-feed')) return publicQueryMock
  if (key.includes('mine')) return mineQueryMock
  if (key.includes('invited')) return invitedQueryMock
  if (key.includes('following')) return followingQueryMock
  return { data: undefined, isLoading: false, error: null, refetch: vi.fn() } as any
})
```

### Project structure notes

- New Edge Function directory: **kebab-case** `list-followed-scenarios`
- `LibraryPage` remains in `web/src/pages/` (consistent with 5-3 / 5-4)
- Table name **`scenario_follows`** is the stable contract for **Epic 7.3** — do not rename without updating the epic plan

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5 Story 5.5, Epic 7 dependency text]
- [Source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — #6 Follow = bookmark + badge, #11 three buckets]
- [Source: `_bmad-output/implementation-artifacts/5-4-private-tab-invited-bucket.md` — Invited bucket pattern, progressive disclosure, GET client, three-query tests]
- [Source: `supabase/functions/list-invited-scenarios/index.ts` — canonical two-phase list + tape counts]
- [Source: `web/src/pages/LibraryPage.tsx` — insertion point after Invited]
- [Source: `web/src/api/queryKeys.ts`, `web/src/api/client.ts`]
- [Source: `_bmad-output/project-context.md` — stack, Edge rules, TanStack Query keys, no floating promises]

## Previous story intelligence (5-4)

- Extend **mockImplementation** with a **fourth** branch — do **not** revert to `mockReturnValue`.
- **Progressive disclosure:** empty successful list = **zero** UI for that bucket.
- **GET list endpoints** use manual fetch headers, not `supabaseFetch`.
- **`ListScenariosResponse`** — reuse; no new DTO.
- **Section a11y:** `aria-labelledby` on `<section>` + stable `id` on `<h2>` (`following-heading`).
- **`scenarioKeys.all` invalidation** — confirm new key is covered; avoid redundant invalidations.

## Git intelligence summary

Recent commits are epic-scoped (`feat(epic-*)`). For file-level patterns, treat `list-invited-scenarios` and `LibraryPage` / `LibraryPage.test.tsx` from story 5-4 as the **primary templates** for this story.

## Latest technical information

- React 19.2.4, TanStack Query 5.62.8, Supabase JS2.45.0 (Edge CDN), Deno `std@0.168.0` — per `project-context.md`
- No library upgrades required for this story

## Project context reference

Read `_bmad-output/project-context.md` before implementation — especially: Edge `OPTIONS` first, Zod only where new POST bodies are added (this story adds **GET** list only + SQL migration), Tailwind v4 semantic tokens and `font-display` + `uppercase tracking-wide` for bucket headings, `void` for refetch handlers, `ApiError` for client errors.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Added `scenario_follows` migration, `list-followed-scenarios` Edge Function (two-phase list + tape counts, `is_public` + not-owner filters), `verify_jwt = false` in config.
- Wired `scenarioKeys.followingScenarios`, `listFollowedScenarios` GET client, fourth `useQuery` on `LibraryPage` after Invited with progressive disclosure, error copy + Retry.
- Extended `LibraryPage.test.tsx` four-way query mock and added Following bucket tests. Full `npm test` in `web/`: 99 passed.

### File List

- `supabase/migrations/20260415000000_create_scenario_follows.sql`
- `supabase/functions/list-followed-scenarios/index.ts`
- `supabase/config.toml`
- `web/src/api/queryKeys.ts`
- `web/src/api/client.ts`
- `web/src/pages/LibraryPage.tsx`
- `web/src/pages/LibraryPage.test.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-13: Story context file created (`ready-for-dev`).
- 2026-04-13: Implementation complete — DB, Edge Function, client, Library Following bucket, tests; status → `review`.
- 2026-04-15: Code review — AC2 progressive disclosure fixed; **Option A** chosen for loading UX (Following shell matches Invited / My Scenarios); AC4 + Task 5 + tests aligned; status → `done`.

### Review Findings

**Code review closed (BMAD workflow, 2026-04-15).** Summary: 0 open `decision`, 0 open `patch`, 1 `defer`, 8 dismissed as noise or duplicate.

#### Layer notes (abbreviated)

- **Blind Hunter:** Flagged AC2 empty-bucket leak (fixed); AC4/Task wording tightened post-review; tests that baked in wrong empty behavior (fixed); `client.ts` mega-diff obscuring 5.5-focused review; raw `DATABASE_ERROR` messages; no integration coverage for the new Edge Function; 50-row cap and ordering tradeoffs as MVP limits; RLS footgun if future policies are sloppy.
- **Edge Case Hunter:** Loading UX resolved per Option A (section + `h2` + skeleton).
- **Acceptance Auditor:** ACs1–7 satisfied with implementation + tests after AC2 fix and spec alignment (A).

#### Triage checklist

- [x] [Review][Patch] Following bucket must not render when the followed list is empty after a successful fetch (AC2, progressive disclosure) — fixed in `web/src/pages/LibraryPage.tsx`; `LibraryPage.test.tsx` updated.
- [x] [Review][Decision] **Following loading UX — Option A (Melissa, 2026-04-15):** Keep parity with Invited / My Scenarios — `<section>` + **Following** `<h2>` + skeleton while loading. AC4 and Task 5 updated to match.
- [x] [Review][Defer] `list-followed-scenarios` returns raw DB text in `DATABASE_ERROR` — deferred, pre-existing pattern (`deferred-work.md`).
