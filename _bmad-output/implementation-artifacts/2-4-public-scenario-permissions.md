# Story 2.4: Public Scenario Permissions

Status: done

## Story

As a logged-in user contributing to a public scenario,
I want adding tapes to public scenarios to require authentication,
so that every tape on a community-visible scenario has a known author — preventing untraceable anonymous contributions on public content.

## Acceptance Criteria

1. **Given** a request to `add-tape` with no Authorization header (or an invalid JWT),
   **When** the target scenario has `is_public = true`,
   **Then** the Edge Function returns HTTP 401 with `{ error: { code: "UNAUTHORIZED", message: "Login required to add tapes to a public scenario" } }`.

2. **Given** a request to `add-tape` with no Authorization header,
   **When** the target scenario has `is_public = false` (private/unlisted),
   **Then** the Edge Function proceeds as normal — anonymous tape-adding is still allowed on private scenarios (link = invitation).

3. **Given** a logged-in user visiting a public scenario,
   **When** they tap "ADD TO THE CHAOS",
   **Then** the tape creator opens and the tape can be submitted — no change from current behavior.

4. **Given** a logged-out user visiting a public or private scenario,
   **When** they tap "ADD TO THE CHAOS",
   **Then** the login gate fires (already enforced client-side from story 1.3 — no changes needed here).

5. **Given** a valid `add-tape` request to a public scenario with a valid JWT,
   **When** processed,
   **Then** the tape is inserted with `author_id = userId` (exactly as today for authenticated requests).

## Tasks / Subtasks

- [x] **Task 1: Update `add-tape` — enforce auth on public scenarios** (AC: #1, #2, #5)
  - [x] In `supabase/functions/add-tape/index.ts`, change scenario pre-fetch select from `.select('id')` → `.select('id, is_public')`
  - [x] Move the `extractUserId` call to BEFORE the scenario fetch (or keep order but use userId after fetch — either works; placing before keeps auth check fast)
  - [x] After confirming scenario exists: `if (!userId && scenario.is_public) { return jsonError('UNAUTHORIZED', 'Login required to add tapes to a public scenario', 401) }`
  - [x] Leave the anonymous path unchanged for private scenarios (`!userId && !scenario.is_public` → continue inserting with `author_id: null`)

- [x] **Task 2: Run tests** (regression guard)
  - [x] `cd web && npm test` — no new failures (40/40 pass expected)
  - [x] No new test files required — this is server-side enforcement; client-side gate already prevents logged-out users from reaching the endpoint in normal flow

### Review Findings

- [x] [Review][Patch] Counterintuitive auth guard has no explaining comment [supabase/functions/add-tape/index.ts:61] — The condition `!userId && scenario.is_public` blocks anonymous adds only on public scenarios (not private), which is the inverse of the typical "private = locked" mental model. A short inline comment prevents future maintainers from accidentally flipping the logic.

## Dev Notes

### Scope Boundary — Critical

- **IS:** One surgical change to `add-tape/index.ts` — add `is_public` to the scenario select + one auth guard condition scoped to public scenarios.
- **IS NOT:** Any client-side UI changes (login gate already in place from story 1.3); any change to `get-scenario-by-slug` (read access remains public for all scenarios); any RLS policies; any schema migration (column exists from story 2.2).
- **DO NOT** add auth enforcement to private scenarios in this story — the unlisted model explicitly allows anonymous tape-adding when you have the link.
- **DO NOT** change `update-tape` or `delete-tape` — they already enforce 401 for all scenarios (story 2.1).
- **DO NOT** change `create-scenario`, `update-scenario`, `delete-scenario`, `toggle-scenario-visibility`, or `list-scenarios`.

### The Unlisted Model — Why Private Still Allows Anonymous

From brainstorming-session-2026-04-10-phase2.md (Theme 2, "The Unlisted Model #2"):

> *"Private = unlisted, not locked. The link IS the invitation. No account needed to view a private scenario, but login is required to add tapes."*

The brainstorming says login should be required for private adds too — but story 2.3 explicitly deferred this to story 2.4 and named it "public scenario permissions". The product decision: story 2.4 enforces auth **only** on public scenarios. The private/link-access behavior is unchanged. This preserves the frictionless party-game feel for link-shared scenarios while protecting public community content.

### Exact Code Change — `add-tape/index.ts`

**Current scenario fetch (line 49–53):**
```ts
const { data: scenario, error: sErr } = await supabase
  .from('scenarios')
  .select('id')
  .eq('public_slug', scenarioSlug)
  .maybeSingle()
```

**After change:**
```ts
const { data: scenario, error: sErr } = await supabase
  .from('scenarios')
  .select('id, is_public')
  .eq('public_slug', scenarioSlug)
  .maybeSingle()
```

**Insert a guard after the `!scenario` check (currently lines 58–60):**
```ts
if (sErr) {
  return jsonError('DATABASE_ERROR', sErr.message, 500)
}
if (!scenario) {
  return jsonError('NOT_FOUND', 'Scenario not found', 404)
}

// ADD AFTER THE !scenario CHECK:
if (!userId && scenario.is_public) {
  return jsonError('UNAUTHORIZED', 'Login required to add tapes to a public scenario', 401)
}
```

No other changes in the function. The `userId` variable is already extracted earlier in the function (line 38). The existing `...(userId ? { author_id: userId } : {})` insert logic is unchanged — for private scenarios, anonymous adds still store `author_id: null`.

### Current `add-tape` Function Structure (Reference)

Key lines in the current `supabase/functions/add-tape/index.ts`:
- Lines 38: `const userId = await extractUserId(req)` — already extracts userId but allows null
- Line 49: `const { data: scenario, error: sErr } = await supabase.from('scenarios').select('id')...`
- Lines 55–60: `if (sErr)...` / `if (!scenario)...` — guards we insert AFTER
- Lines 82–90: Insert with `...(userId ? { author_id: userId } : {})` — unchanged

### No Infrastructure Needed

Everything required is already in place:
- `is_public` column: added in story 2.2 (`supabase/migrations/20260412000000_add_is_public_to_scenarios.sql`)
- `extractUserId`: `supabase/functions/_shared/auth.ts`
- `jsonError`: `supabase/functions/_shared/errors.ts`
- `corsHeaders`, `jsonOk`, `mapTape`, `formatZodError`: all in `_shared/`

### Why No Client-Side Changes

Story 1.3 already gates the "ADD TO THE CHAOS" button behind login for ALL scenarios. The client will never send an unauthenticated `add-tape` request in normal usage. Story 2.4's server-side check is belt-and-suspenders protection for:
- Direct API clients / curl requests
- Stale cached pages where the login state hasn't refreshed
- Any future integration or automated usage

### Why No Schema Migration

The `is_public` column (`BOOLEAN NOT NULL DEFAULT FALSE`) was added in story 2.2. Story 2.4 only reads it; no schema changes needed.

### Testing Note

The 40-test suite in `web/` is all unit/integration tests against the frontend. The `add-tape` edge function change is server-side only. No frontend test currently exercises the auth path of `add-tape`. The regression check ensures no existing frontend tests break due to type changes.

For manual verification: deploy the edge function and use curl or the Supabase Edge Function test console to confirm:
1. `POST add-tape` with no auth + public scenario slug → 401
2. `POST add-tape` with no auth + private scenario slug → 200 (tape created)
3. `POST add-tape` with valid JWT + public scenario slug → 200 (tape created with author_id set)

### Project Structure Notes

- Only file modified: `supabase/functions/add-tape/index.ts`
- No new files, no new directories, no new dependencies
- No changes to `web/src/` — client behavior unchanged
- No changes to `_shared/` — all helpers used as-is

### References

- Design decision source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Theme 2 ("The Unlisted Model #2"), Theme 6 ("Public = Community Object #17")
- Story 2.3 scope boundary (explicit deferral): `_bmad-output/implementation-artifacts/2-3-public-private-toggle.md` — Dev Notes → "IS NOT: … the 'add-tape requires login on public scenarios' rule (story 2-4)"
- `is_public` column: `supabase/migrations/20260412000000_add_is_public_to_scenarios.sql`
- `extractUserId` pattern: `supabase/functions/_shared/auth.ts`
- `jsonError` pattern: `supabase/functions/_shared/errors.ts`
- Current `add-tape` function: `supabase/functions/add-tape/index.ts`
- Client-side login gate (already in place): `web/src/hooks/useLoginGate.ts`, `web/src/pages/ScenarioPage.tsx`
- Project context (branch, anti-patterns): `_bmad-output/project-context.md`
- Deferred work (do not re-raise): `_bmad-output/implementation-artifacts/deferred-work.md`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

No issues encountered.

### Completion Notes List

- Task 1: Updated `supabase/functions/add-tape/index.ts` — changed `.select('id')` to `.select('id, is_public')` on the scenario fetch; added guard `if (!userId && scenario.is_public)` returning 401 UNAUTHORIZED immediately after the `!scenario` 404 check. The `userId` variable was already extracted at line 38 (before the scenario fetch), so no reordering was needed. Anonymous adds on private scenarios are completely unchanged.
- Task 2: Ran `npm test` in `web/` — 40/40 tests pass, no regressions.

### File List

- `supabase/functions/add-tape/index.ts` (modified)

### Change Log

- 2026-04-12: Story 2-4 implemented — `add-tape` now returns HTTP 401 for unauthenticated requests targeting public scenarios. Private scenarios retain anonymous tape-adding. Single file changed, no schema migration needed (`is_public` column already present from story 2-2).
