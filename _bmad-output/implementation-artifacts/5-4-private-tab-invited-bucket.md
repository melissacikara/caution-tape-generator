# Story 5.4: Private tab — Invited bucket

Status: done

## Story

As a logged-in user,
I want to see private scenarios I was invited to (via link) in my Private tab,
So that I can return to collaborative boards I've joined (brainstorm #11 — three buckets, progressive disclosure).

## Acceptance Criteria

1. **Given** the Private tab and a logged-in user,
   **When** the user has accessed at least one private scenario via its link (i.e. opened it while authenticated and is not the owner),
   **Then** an **Invited** bucket renders with scenario cards for those private scenarios,
   **And** cards use the same grid and card pattern as the other buckets (1 col mobile → 2 col at `sm+`, name + tape count provocative line).

2. **Given** a logged-in user,
   **When** they have not accessed any private scenarios via link,
   **Then** the **Invited** bucket **does not render** (no section heading, no empty-state — progressive disclosure, empty buckets are hidden).

3. **Given** an Invited card,
   **When** the user activates it,
   **Then** navigation goes to that scenario's route (`/s/:slug` — `scenario.publicSlug`).

4. **Given** the Invited query is loading,
   **When** the user is on the Private tab,
   **Then** a skeleton loading state appears (same pattern as My Scenarios — `ScenarioLibrary` with `isLoading: true`, `aria-busy="true"` grid, **without** the "Invited" heading until data loads).

5. **Given** the Invited fetch fails,
   **When** the error is surfaced,
   **Then** show an inline error message and a **Retry** button (same UX pattern as My Scenarios / Public tab error state).

6. **Given** regression safety,
   **When** tests and manual checks complete,
   **Then** Public tab and My Scenarios bucket behavior (5-2, 5-3) remain unchanged, and `npm test` in `web/` passes.

## Tasks / Subtasks

- [x] **Task 1: DB migration — `scenario_invites` table** (AC: 1, 2)
  - [x] Create `supabase/migrations/<timestamp>_create_scenario_invites.sql`
  - [x] Table: `scenario_invites (user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, scenario_id))`
  - [x] Index: `CREATE INDEX IF NOT EXISTS idx_scenario_invites_user_id ON scenario_invites(user_id)`
  - [x] Enable RLS (Edge Functions use service role — bypasses RLS): `ALTER TABLE scenario_invites ENABLE ROW LEVEL SECURITY`

- [x] **Task 2: Modify `get-scenario-by-slug` to record invite** (AC: 1)
  - [x] Change `const _userId = await extractUserId(req)` → `const userId = await extractUserId(req)` (remove underscore — it was intentionally unused until this story)
  - [x] After the scenario is fetched (post-null check), add: if `userId && !scenario.is_public && scenario.owner_id !== userId` → `await supabase.from('scenario_invites').upsert({ user_id: userId, scenario_id: scenario.id }, { onConflict: 'user_id,scenario_id', ignoreDuplicates: true }).then(() => {})` — wrap in try/catch or `.then(() => {})` so a failed upsert never blocks the scenario response (best-effort tracking)
  - [x] **Do not** change the function's response shape — it still returns `{ scenario, tapes }` unchanged

- [x] **Task 3: Edge Function `list-invited-scenarios`** (AC: 1, 2, 3, 4, 5)
  - [x] Add `supabase/functions/list-invited-scenarios/index.ts`
  - [x] `OPTIONS` first → `corsHeaders` from `_shared/cors.ts`
  - [x] `GET` only; other methods → `405` / `METHOD_NOT_ALLOWED`
  - [x] `const userId = await extractUserId(req)`; if `!userId` → `jsonError('UNAUTHORIZED', 'Login required', 401)`
  - [x] Service client with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  - [x] Two-phase query (matches `list-my-scenarios` pattern):
    - Phase 1: `supabase.from('scenario_invites').select('scenario_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)` — get invited scenario IDs
    - If `inviteRows.length === 0` → return `jsonOk({ scenarios: [] })` early
    - Phase 2: `supabase.from('scenarios').select('id, name, public_slug, owner_id, is_public, created_at, updated_at').in('id', inviteIds).eq('is_public', false).neq('owner_id', userId)` — only private scenarios where user is NOT the owner (owner has them in My Scenarios)
  - [x] Tape counts: same Map approach as `list-my-scenarios` — query `tapes` for `scenario_id IN (...)`, build `Map`, map rows with `mapScenario`
  - [x] Return `jsonOk({ scenarios: withCounts })` — **`ListScenariosResponse` shape** (array of `{ scenario, tapeCount }`)
  - [x] CDN imports only (`serve`, `createClient`) — no npm specifiers

- [x] **Task 4: Local Supabase config** (AC: 1)
  - [x] Add `[functions.list-invited-scenarios]` with `verify_jwt = false` to `supabase/config.toml` (matches all other function entries)

- [x] **Task 5: API client + query key** (AC: 1, 2, 4, 5)
  - [x] In `web/src/api/queryKeys.ts`, add: `invitedScenarios: (userId: string) => [...scenarioKeys.all, 'invited', userId] as const` — **must** include `userId` so caches do not leak across accounts
  - [x] In `web/src/api/client.ts`, add `listInvitedScenarios(): Promise<ListScenariosResponse>` — GET to `list-invited-scenarios`, **same manual auth headers pattern** as `listMyScenarios` (not `supabaseFetch` — GET with no body)

- [x] **Task 6: Wire Private tab — Invited bucket in `LibraryPage`** (AC: 1–5)
  - [x] Third `useQuery` for invited scenarios (destructure as `invitedData`, `invitedLoading`, `invitedError`, `refetchInvited`):
    - `queryFn: listInvitedScenarios`
    - `queryKey: scenarioKeys.invitedScenarios(user?.id ?? '__none__')`
    - `enabled: isSupabaseConfigured() && user !== null` (same pattern as `myScenarios`)
  - [x] Add import: `listInvitedScenarios` to the `../api/client` import; `scenarioKeys` already imported
  - [x] **Progressive disclosure (critical — same logic as My Scenarios bucket):**
    - If `invitedLoading` → `<ScenarioLibrary items={[]} isLoading />` (no `h2`)
    - If `invitedError` → `<ScenarioLibrary items={[]} isLoading={false} errorMessage={...} onRetry={() => void refetchInvited()} />`
    - If `!invitedLoading && !invitedError && (invitedData?.scenarios ?? []).length === 0` → **render nothing** (no bucket at all)
    - If `(invitedData?.scenarios ?? []).length > 0` → render `<section aria-labelledby="invited-heading">` with `<h2 id="invited-heading" className="font-display text-xl uppercase tracking-wide text-foreground">Invited</h2>` + `<ScenarioLibrary items={invitedData!.scenarios} isLoading={false} />`
  - [x] Place the Invited bucket **after** the My Scenarios bucket inside the `flex flex-col gap-8` container (above the `{/* Story 5.5 */}` comment)
  - [x] **Do not** pass `emptyMessage` or `zeroTapeCaption` to the Invited bucket's `ScenarioLibrary` — progressive disclosure means the component is never shown for empty invited lists

- [x] **Task 7: Tests — `LibraryPage.test.tsx`** (AC: 1, 2, 4, 5, 6)
  - [x] `LibraryPage` now calls `useQuery` **three times** — update `mockImplementation` to branch on all three keys: `public-feed`, `mine`, `invited`
  - [x] Extend `vi.mock('../api/client')` to include `listInvitedScenarios: vi.fn()`
  - [x] Add tests:
    - Logged-in user, Private tab, **invited** query loading → skeleton (`aria-busy`) in private panel, no "Invited" heading
    - Logged-in user, Private tab, **invited** returns `[]` → **no** "Invited" heading, **no** empty-state
    - Logged-in user, Private tab, **invited** returns one scenario → heading "Invited" + link `href="/s/<slug>"`
    - **invited** query errors → error copy + Retry calls `refetchInvited` for that query only
  - [x] Keep all existing Public tab and My Scenarios tests passing (public-feed and mine branches of mock must still return the same shapes as today — see 5-3's `mockImplementation` pattern)

- [x] **Task 8: Regression** (AC: 6)
  - [x] Run `npm test` in `web/`

## Dev Notes

### What This Story Is and Is Not

**Is:** Second Private bucket — **Invited** only. Adds `scenario_invites` table, modifies `get-scenario-by-slug` to record invite on private-scenario access by a non-owner logged-in user, new `list-invited-scenarios` Edge Function, and the Invited bucket UI in `LibraryPage`.

**Is not:** My Scenarios (5-3 — done), Following bucket (5.5), follow/unfollow (Epic 7), changes to Public feed, changes to homepage, or badge/notification work.

### How "Invited" Is Tracked

The **link IS the invitation** (brainstorm #2 — unlisted model). When a logged-in user opens a private scenario they don't own via its public slug, `get-scenario-by-slug` records `(user_id, scenario_id)` into `scenario_invites`. The upsert uses `ignoreDuplicates: true` so repeat visits are cheap no-ops.

This is **server-side tracking** (cross-device, persistent) — not localStorage. The `knownScenarios` localStorage is the Phase 1 device-only anonymous tracking and is separate from this feature.

### Critical: Progressive Disclosure Applies to Invited Bucket Too

Exact same rule as My Scenarios (5-3): a successful empty `invited` list must **not** show `ScenarioLibrary` at all — it renders nothing. Only use `ScenarioLibrary` for this bucket when loading, error, or `items.length > 0`. The `ScenarioLibrary` component renders `emptyMessage` when `items.length === 0` and not loading — **do not let that happen for Invited**.

### Filter Logic in `list-invited-scenarios`

**Must filter `is_public = false` AND `owner_id != userId`:**
- If a scenario was private when accessed but has since gone public → exclude it (it appears in the Public feed, not Invited)
- If user is the owner → exclude it (it appears in My Scenarios, not Invited)
- Only private scenarios the user is genuinely a guest on belong in Invited

The two-query approach (get IDs → get scenarios filtered) matches `list-my-scenarios`. Do not try a Supabase relational join — keep it consistent.

### Modifying `get-scenario-by-slug` Safely

The existing function already calls `extractUserId` and stores it as `_userId` (intentionally unused). This story activates it. The upsert is **best-effort** — wrap with `.then(() => {})` to swallow errors:

```ts
if (userId && !scenario.is_public && scenario.owner_id !== userId) {
  await supabase
    .from('scenario_invites')
    .upsert(
      { user_id: userId, scenario_id: scenario.id },
      { onConflict: 'user_id,scenario_id', ignoreDuplicates: true },
    )
    .then(() => {})
}
```

The `await` ensures the upsert completes before the response is returned (Deno edge function execution model — don't fire-and-forget without await or the upsert may be cut off). The `.then(() => {})` discards both the result and any error.

### Three-Query Mock Pattern for Tests

5-3 established a two-query `mockImplementation` branching on `queryKey`. Now extend to three:

```ts
vi.mocked(useQuery).mockImplementation((options: UseQueryOptions<any>) => {
  const key = options.queryKey as string[]
  if (key.includes('public-feed')) return publicQueryMock
  if (key.includes('mine')) return mineQueryMock
  if (key.includes('invited')) return invitedQueryMock
  return { data: undefined, isLoading: false, error: null, refetch: vi.fn() } as any
})
```

### Auth Pattern

- Browser: GET to `list-invited-scenarios` with manual `Authorization` + `apikey` headers (same as `listMyScenarios` / `listPublicScenarios`) — **not** `supabaseFetch` because there is no request body
- Edge: service role + `extractUserId` → `401` if unauthenticated

### Cache Invalidation

The existing `invalidateQueries({ queryKey: scenarioKeys.all })` pattern already covers `invitedScenarios` keys because they extend `['scenarios']` (same prefix). Verify no gap exists — same check as Task 5 in 5-3.

### Ordering

The Invited bucket is ordered by `scenario_invites.created_at DESC` (most recently joined first). This is set in Phase 1 (scenario_invites query `order('created_at', { ascending: false })`). The scenario rows themselves may be ordered differently — the order from invite rows is authoritative.

However, since the two-phase approach re-queries `scenarios` with `.in('id', ids)`, the DB may not preserve insertion order. To preserve `scenario_invites` order, you can either:
- Build a Map by scenario ID from the scenarios query, then re-sort using `inviteIds` order
- Or accept DB natural order for MVP (acceptable — users won't notice in early usage)

**Recommendation:** Match what `list-my-scenarios` does — use `scenarios.created_at DESC` for simplicity. Document in a comment. This is consistent with My Scenarios ordering and avoids a bespoke sort.

### Project Structure Notes

- New Edge Function directory: **kebab-case** `list-invited-scenarios`
- Modified Edge Function: `get-scenario-by-slug/index.ts` (existing)
- New migration file: timestamp-based filename following existing convention (`supabase/migrations/YYYYMMDDHHMMSS_create_scenario_invites.sql`) — use a timestamp after the latest existing migration (`20260413000000_create_tape_reports.sql`)
- `LibraryPage` stays in `web/src/pages/` — no new `features/` directory needed (consistent with 5-3 decision)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.4]
- [Source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Decision #2 (unlisted model, link = invitation), #11 (three buckets, progressive disclosure)]
- [Source: `_bmad-output/implementation-artifacts/5-3-private-tab-my-scenarios-bucket.md` — My Scenarios bucket pattern, `LibraryPage` progressive disclosure, dual `useQuery` mock pattern]
- [Source: `supabase/functions/list-my-scenarios/index.ts` — canonical template for new list endpoint]
- [Source: `supabase/functions/get-scenario-by-slug/index.ts` — file to modify for invite recording (`_userId` → `userId`)]
- [Source: `web/src/pages/LibraryPage.tsx` — current implementation; `{/* Stories 5.4–5.5 */}` stub is the insertion point]
- [Source: `web/src/api/queryKeys.ts`, `web/src/api/client.ts`]
- [Source: `supabase/config.toml` — function config pattern]
- [Source: `_bmad-output/project-context.md` — stack, no-go patterns, Tailwind v4 tokens, Edge Function rules]

## Previous Story Intelligence (5-3)

- **Two-query mock** pattern is established: `mockImplementation` branching on `queryKey`. Extend to three branches — do NOT revert to `mockReturnValue`.
- **Progressive disclosure** is non-negotiable: a successful empty list = no bucket rendered. The `ScenarioLibrary` default empty state must never fire for this bucket.
- **GET endpoint with manual headers** (not `supabaseFetch`) is the correct pattern for read-only list endpoints.
- **`ListScenariosResponse`** shape is already defined and fits — no new DTO needed.
- **Heading accessibility**: use `aria-labelledby` on `<section>` + `id` on `<h2>`, matching the My Scenarios pattern (`my-scenarios-heading` → use `invited-heading` for this bucket).
- **Tests ran 90** after 5-3. After this story, count will increase; ensure `npm test` is green before marking done.
- **`scenarioKeys.all` invalidation** covers new keys automatically — verify but don't add redundant invalidations.

## Git Intelligence Summary

Epic-sized commits are the pattern (`feat(epic-2)`, `feat(epic-3)`). For file-level implementation patterns, use `list-my-scenarios/index.ts` as the canonical template and `LibraryPage.tsx` / `LibraryPage.test.tsx` as the frontend reference.

## Latest Technical Information

- React 19.2.4, TanStack Query 5.62.8, React Router 7.1.1 — follow `project-context.md`
- Supabase Edge Functions: Deno runtime, CDN imports only, `serve` from `deno.land/std@0.168.0`, `createClient` from `esm.sh/@supabase/supabase-js@2.45.0`
- `upsert` with `{ ignoreDuplicates: true }` on Supabase JS v2 skips the update entirely if the row exists — correct behavior for idempotent visit tracking
- Vitest `vi.mocked(useQuery)` with `mockImplementation` — established in 5-3, extend don't replace

## Project Context Reference

Read `_bmad-output/project-context.md` before implementation — especially: no floating promises (`void`), `ApiError` handling, Tailwind v4 tokens (`font-display` + `uppercase tracking-wide` for bucket headings), Edge Function CORS / `OPTIONS` first, GET endpoints use manual headers not `supabaseFetch`, `scenarioKeys` factory for all query keys.

## Dev Agent Record

### Agent Model Used

Sonnet 4.6 (Cursor)

### Debug Log References

### Completion Notes List

- Created `supabase/migrations/20260414000000_create_scenario_invites.sql` — `scenario_invites` table with composite PK `(user_id, scenario_id)`, user_id index, RLS enabled.
- Modified `get-scenario-by-slug/index.ts` — activated `userId` (was `_userId`), added best-effort invite upsert (`ignoreDuplicates: true`, `.then(() => {})`) for non-owner logged-in users on private scenarios.
- Created `supabase/functions/list-invited-scenarios/index.ts` — GET, `extractUserId` → 401, two-phase query (invite IDs → scenario rows filtered `is_public=false AND owner_id!=userId`), tape count Map, `ListScenariosResponse` shape.
- Added `[functions.list-invited-scenarios]` to `supabase/config.toml`.
- Added `scenarioKeys.invitedScenarios(userId)` to `web/src/api/queryKeys.ts`.
- Added `listInvitedScenarios()` GET client to `web/src/api/client.ts` (manual auth headers, same pattern as `listMyScenarios`).
- `LibraryPage`: third `useQuery` for invited scenarios; Invited bucket with progressive disclosure (empty → nothing, loading → skeleton without heading, error → inline + Retry, data → section with `aria-labelledby="invited-heading"` + `ScenarioLibrary`); Invited placed after My Scenarios.
- Verified `invalidateQueries({ queryKey: scenarioKeys.all })` in existing mutations covers `invitedScenarios` keys automatically.
- Extended `LibraryPage.test.tsx`: three-branch `mockImplementation`, `listInvitedScenarios` mock, 4 new Invited bucket tests (loading skeleton, empty hidden, data renders, error + Retry isolation); all 94 tests pass.

### File List

- `supabase/migrations/20260414000000_create_scenario_invites.sql`
- `supabase/functions/get-scenario-by-slug/index.ts`
- `supabase/functions/list-invited-scenarios/index.ts`
- `supabase/config.toml`
- `web/src/api/queryKeys.ts`
- `web/src/api/client.ts`
- `web/src/pages/LibraryPage.tsx`
- `web/src/pages/LibraryPage.test.tsx`
- `_bmad-output/implementation-artifacts/5-4-private-tab-invited-bucket.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-13: Story context file created (`ready-for-dev`).
- 2026-04-14: Implementation complete — DB migration, invite tracking in get-scenario-by-slug, list-invited-scenarios Edge Function, client + query key, LibraryPage Invited bucket, tests (94 passing); story → `review`; sprint `5-4` → `review`.
- 2026-04-13: Code review (full spec) — AC 1–6 verified against implementation; `npm test` green (94). One defer (raw `DATABASE_ERROR` messages). Story → `done`; sprint `5-4` → `done`.

### Review Findings

- [x] [Review][Defer] Raw DB error text on `list-invited-scenarios` — Returns `DATABASE_ERROR` with `iErr.message` / `sErr.message` / `tErr.message` (`index.ts`). Same pre-existing pattern as other Edge Functions; address with generic server messages work in `deferred-work.md`.

- [x] [Review][Dismissed] Invited query cache vs new invite row — Opening a private board records an invite on the server; the Invited list refreshes when `LibraryPage` remounts or when the query is invalidated (e.g. `scenarioKeys.all` after mutations, auth changes, window focus). Acceptable for MVP; no extra invalidation required on scenario GET alone.

- [x] [Review][Dismissed] `scenario_invites` rows after scenario goes public — Invite rows can remain while `list-invited-scenarios` correctly filters `is_public = false`. Harmless for UX; optional cleanup job is out of story scope.
