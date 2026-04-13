# Story 2.1: Creator Ownership and Contributor Permissions

Status: done

## Story

As a logged-in user,
I want edit and delete actions to be gated on who created the scenario and its tapes,
so that I can only modify my own content (unless I'm the scenario creator).

## Acceptance Criteria

1. **Given** a logged-in user calls `update-tape` or `delete-tape`
   **When** their JWT is valid but they are neither the tape's `author_id` nor the scenario's `owner_id`
   **Then** the Edge Function returns `{ error: { code: "FORBIDDEN", message: "You do not have permission to modify this tape" } }` with HTTP 403

2. **Given** a caller sends `update-tape` or `delete-tape` without an `Authorization` header (or with an invalid JWT)
   **When** the request is processed
   **Then** the Edge Function returns `{ error: { code: "UNAUTHORIZED", message: "Login required" } }` with HTTP 401

3. **Given** a Phase 1 tape where `author_id` is null
   **When** a logged-in scenario owner calls `update-tape` or `delete-tape`
   **Then** the operation succeeds (scenario owner can manage all tapes regardless of `author_id` nullability)

4. **Given** a logged-in user calls `update-scenario` or `delete-scenario`
   **When** they are not the scenario's `owner_id` (including if `owner_id` is null — Phase 1 scenarios)
   **Then** the Edge Function returns HTTP 403 FORBIDDEN

5. **Given** a caller sends `update-scenario` or `delete-scenario` without auth
   **When** the request is processed
   **Then** the Edge Function returns HTTP 401 UNAUTHORIZED

6. **Given** a logged-in user is viewing a scenario
   **When** the tape rows render
   **Then** edit and delete buttons are only visible for tapes where `user.id === tape.authorId` OR `user.id === scenario.ownerId`

7. **Given** a logged-in user is the scenario owner viewing any tape
   **When** the tape rows render
   **Then** edit and delete buttons are visible on ALL persisted tapes in the stack

8. **Given** a logged-in user who is NOT the scenario owner is viewing a tape they did not create
   **When** the tape row renders
   **Then** no edit or delete buttons are shown for that tape

9. **Given** a logged-in user is viewing a scenario
   **When** the scenario header area renders
   **Then** the Rename and Delete scenario buttons are only visible if `user.id === scenario.ownerId`

10. **Given** a logged-out user views any scenario
    **When** the scenario and tape rows render
    **Then** no edit, delete, or rename buttons appear anywhere in the scenario view (login gate still fires on CTA actions — this story removes the buttons from view entirely)

## Tasks / Subtasks

- [x] **Task 1: Update `update-tape` Edge Function — enforce ownership** (AC: #1, #2, #3)
  - [x] Remove `_userId` no-op; rename to `userId` and use it
  - [x] If `userId === null`: return `jsonError('UNAUTHORIZED', 'Login required', 401)`
  - [x] Update scenario select: fetch `id, owner_id` from scenarios (currently only `id`)
  - [x] After fetching the scenario, fetch the tape to get its `author_id` before the update:
    `SELECT id, author_id FROM tapes WHERE id = tapeId AND scenario_id = scenario.id`
  - [x] If tape not found: return `jsonError('NOT_FOUND', 'Tape not found in this scenario', 404)` (early — no need to continue)
  - [x] Permission check: `if (userId !== tape.author_id && userId !== scenario.owner_id)` → return `jsonError('FORBIDDEN', 'You do not have permission to modify this tape', 403)`
  - [x] Proceed with existing update logic (no other changes)

- [x] **Task 2: Update `delete-tape` Edge Function — enforce ownership** (AC: #1, #2, #3)
  - [x] Same pattern as Task 1: call `extractUserId`, 401 if null
  - [x] Update scenario select to include `owner_id`
  - [x] Fetch tape `author_id` before deleting
  - [x] Permission check (same rule): 403 if not owner
  - [x] Proceed with existing delete logic

- [x] **Task 3: Update `update-scenario` Edge Function — enforce ownership** (AC: #4, #5)
  - [x] Add `import { extractUserId } from '../_shared/auth.ts'` (not currently imported)
  - [x] Call `const userId = await extractUserId(req)` after Zod parse
  - [x] If `userId === null`: return `jsonError('UNAUTHORIZED', 'Login required', 401)`
  - [x] Update scenario select to fetch `id, owner_id` first (currently does update in one shot)
  - [x] Check `userId === scenario.owner_id` → 403 if false (including when `owner_id` is null for Phase 1 scenarios)
  - [x] Proceed with update; update the select to include `owner_id` in the return row (so `mapScenario` can include it)

- [x] **Task 4: Update `delete-scenario` Edge Function — enforce ownership** (AC: #4, #5)
  - [x] Same pattern as Task 3: add `extractUserId` import, 401 if no JWT
  - [x] Fetch scenario by slug with `id, owner_id` first
  - [x] Permission check: 403 if `userId !== scenario.owner_id`
  - [x] Proceed with existing delete logic

- [x] **Task 5: Update `ScenarioPage` — conditional tape edit/delete buttons** (AC: #6, #7, #8, #10)
  - [x] Derive `isScenarioOwner` from `user?.id === scenario.ownerId` (note: `scenario` comes from the `useQuery` data — type is `GetScenarioResponse.scenario: ScenarioDto`)
  - [x] Create `canEditTape` helper inline or as a `useCallback`: `(tape: TapeDto) => user !== null && (user.id === scenario.ownerId || user.id === tape.authorId)`
  - [x] Wrap the edit/delete button block (currently: `{isPersistedTape(tape) ? (…) : null}`) in an additional `canEditTape(tape)` check: `{isPersistedTape(tape) && canEditTape(tape) ? (…) : null}`
  - [x] No changes to the edit panel or mutation logic — only the visibility guard changes

- [x] **Task 6: Update `ScenarioPage` — conditional scenario rename/delete buttons** (AC: #9, #10)
  - [x] Derive `isScenarioOwner` (same as Task 5 — same variable, not duplicated)
  - [x] Wrap the Rename and Delete scenario buttons (currently visible to everyone) in `{isScenarioOwner && (…)}`
  - [x] No changes to the rename/delete logic itself

- [x] **Task 7: Handle FORBIDDEN errors in ScenarioPage UI** (AC: #1, #4)
  - [x] The `updateMutation`, `deleteMutation` (tape), and scenario mutations already have `onError` handlers that surface errors
  - [x] Verify that `ApiError` with code `FORBIDDEN` / `UNAUTHORIZED` produces a readable inline message — the existing pattern (`err instanceof ApiError ? err.message : 'Unexpected error'`) will surface the server's error message, which is already descriptive
  - [x] No new error code handling needed — existing ApiError propagation is sufficient
  - [x] **Do NOT add new error display logic** — the existing inline error rendering on tape mutations handles this

- [x] **Task 8: Run tests** (regression guard)
  - [x] `cd web && npm test` — no new failures
  - [x] Verify the login mock in tests (`useAuth: () => ({ user: { id: 'u1' }, … })`) still satisfies existing test expectations (the buttons were previously shown for all persisted tapes; after this story, buttons only show when `user.id === tape.authorId || user.id === scenario.ownerId`)
  - [x] If tests assert edit/delete buttons appear, they may need scenario `ownerId` or tape `authorId` to be set to `'u1'` in test fixtures

### Review Findings (2026-04-12)

- [x] [Review][Patch] Non-null assertion `rows![0]` in update-tape may crash on race condition [`supabase/functions/update-tape/index.ts`] — After the tape pre-fetch confirms existence, the update fires. If the tape is concurrently deleted between pre-fetch and update, the `.select()` returns an empty array and `rows![0]` is `undefined`, throwing a TypeError at runtime instead of a controlled error response. Fix: `rows?.[0]` with an explicit NOT_FOUND guard.
- [x] [Review][Patch] `project-context.md` security note says ownership enforcement is deferred — still references "ownership enforcement is Epic 2 work (intentionally deferred)" under the Security section, now stale since story 2-1 enforces it. Fix: update or remove that sentence.
- [x] [Review][Defer] `delete-tape`/`delete-scenario` no longer verify row was actually deleted [`supabase/functions/delete-tape/index.ts`, `delete-scenario/index.ts`] — deferred, accepted trade-off per spec (pre-fetch confirms existence; race-delete returns ok:true which is idempotent)
- [x] [Review][Defer] `extractUserId` returns null on transient errors, masking 500s as 401 [`supabase/functions/_shared/auth.ts`] — deferred, pre-existing (already in deferred-work.md)
- [x] [Review][Defer] Raw DB error messages leaked in DATABASE_ERROR responses — deferred, pre-existing (already in deferred-work.md)
- [x] [Review][Defer] Non-atomic TOCTOU: ownership pre-fetch → mutation not in a transaction — deferred, architectural limitation, no transaction support in this pattern

## Dev Notes

### Critical: Scope Boundary

- **IS:** Enforcement layer for who can modify tapes/scenarios. UI visibility gates. Server-side 401/403 checks.
- **IS NOT:** The public/private toggle (story 2-2), "going public loses delete rights" rule (story 2-3), or the report footer (story 2-5).
- **DO NOT** add `is_public` column or toggle logic — that is story 2-3's scope.
- **DO NOT** change `add-tape`, `create-scenario`, `get-scenario-by-slug`, or `list-scenarios` — no permission enforcement needed on read or create (login gate is in the client for creates; reads are public).

### Existing Infrastructure — Use It

All four mutation edge functions (`update-tape`, `delete-tape`, `update-scenario`, `delete-scenario`) already import from `_shared/`. `extractUserId` is already in `_shared/auth.ts` and working (built in story 1.1). The pattern to follow:

```ts
// After Zod parse, before creating supabase client:
const userId = await extractUserId(req)
if (!userId) {
  return jsonError('UNAUTHORIZED', 'Login required', 401)
}
```

### Two-Step Permission Check for Tapes

`update-tape` and `delete-tape` currently:
1. Fetch scenario by `public_slug` → get `scenario.id`
2. Do the update/delete using `scenario.id` as the FK guard

The new flow inserts an ownership fetch between steps 1 and 2. For `update-tape`:

```ts
// After fetching scenario, BEFORE the update:
const { data: tapeRow, error: tErr } = await supabase
  .from('tapes')
  .select('id, author_id')
  .eq('id', tapeId)
  .eq('scenario_id', scenario.id)
  .maybeSingle()

if (tErr) return jsonError('DATABASE_ERROR', tErr.message, 500)
if (!tapeRow) return jsonError('NOT_FOUND', 'Tape not found in this scenario', 404)

if (userId !== tapeRow.author_id && userId !== scenario.owner_id) {
  return jsonError('FORBIDDEN', 'You do not have permission to modify this tape', 403)
}
```

Remove the `NOT_FOUND` check that currently exists after the update (since the tape is now pre-fetched and confirmed to exist before the update — the update will always find it).

### Scenario Select Must Include `owner_id`

Currently `update-tape` and `delete-tape` select only `id` from scenarios. Change to:

```ts
.select('id, owner_id')
```

`update-scenario` and `delete-scenario` currently do a blind update/delete by slug. They need a pre-fetch step:

```ts
const { data: scenario, error: sErr } = await supabase
  .from('scenarios')
  .select('id, owner_id')
  .eq('public_slug', scenarioSlug)
  .maybeSingle()

if (sErr) return jsonError('DATABASE_ERROR', sErr.message, 500)
if (!scenario) return jsonError('NOT_FOUND', 'Scenario not found', 404)

if (userId !== scenario.owner_id) {
  return jsonError('FORBIDDEN', 'You do not have permission to modify this scenario', 403)
}
// Then do the update/delete using scenario.id
```

`update-scenario` needs to update the existing update call from `.eq('public_slug', scenarioSlug)` to `.eq('id', scenario.id)` (using the pre-fetched id).

### ScenarioPage — Where to Find `scenario.ownerId`

The `useQuery` result returns `GetScenarioResponse` which contains `scenario: ScenarioDto`. `ScenarioDto` already has `ownerId?: string` (added in story 1.1). The page destructures `scenario` from `query.data`:

```tsx
const { data: queryData } = useQuery(...)
const scenario = queryData?.scenario  // ScenarioDto
```

Derive the permission flags after the scenario loads:

```tsx
const isScenarioOwner = user !== null && !!scenario && user.id === scenario.ownerId

const canEditTape = useCallback(
  (tape: TapeDto) =>
    user !== null && !!scenario && (user.id === scenario.ownerId || user.id === tape.authorId),
  [user, scenario]
)
```

### UI Changes — Exact Locations in ScenarioPage.tsx

**Tape edit/delete buttons** (around line 508):
```tsx
// BEFORE
{isPersistedTape(tape) ? (
  <div className="mt-2 flex flex-wrap gap-2">
    <button onClick={() => openEditPanel(tape)}>Edit</button>
    <button onClick={() => setTapeToDelete(tape)}>Delete</button>
  </div>
) : null}

// AFTER
{isPersistedTape(tape) && canEditTape(tape) ? (
  <div className="mt-2 flex flex-wrap gap-2">
    <button onClick={() => openEditPanel(tape)}>Edit</button>
    <button onClick={() => setTapeToDelete(tape)}>Delete</button>
  </div>
) : null}
```

**Scenario Rename + Delete buttons** (around line 461–476 — the two buttons in the scenario header action row):
```tsx
// BEFORE — buttons always visible
<button aria-label="Edit scenario name">Rename</button>
<button aria-label="Delete scenario">Delete</button>

// AFTER — only visible to scenario owner
{isScenarioOwner && (
  <>
    <button aria-label="Edit scenario name">Rename</button>
    <button aria-label="Delete scenario">Delete</button>
  </>
)}
```

### No Changes Needed to `api/client.ts`

`supabaseFetch` already injects the user's JWT when a session is active (falls back to anon key if no session). All Edge Function calls from the browser already carry the correct auth header. No client-side API changes required for this story.

### Phase 1 Scenarios / Tapes (null `owner_id` / `author_id`)

Phase 1 scenarios have `owner_id = null`. The permission check `userId !== scenario.owner_id` will be `true` (since `userId` is a non-null UUID and `null !== UUID`), meaning no one can rename/delete a Phase 1 scenario. This is intentional and acceptable — Phase 1 content becomes read-only for now. If Melissa wants to claim ownership of Phase 1 scenarios, that is a future admin task and out of scope for this story.

Phase 1 tapes have `author_id = null`. Same rule: scenario owner (if not null) can still modify them via the `userId !== scenario.owner_id` check path. If both `author_id` and `owner_id` are null, no one can edit/delete the tape (correct behavior).

### Regression Risk: Scenario Rename/Delete Now Hidden

The Rename and Delete scenario buttons will disappear for non-owners. Make sure there's no other trigger for `setRenamingScenario` or `setConfirmDeleteScenario` outside of those buttons — if there is, it should also be gated. Quick search: these are only triggered by the two buttons in the scenario header.

### Error Handling — Existing Pattern Is Sufficient

`ScenarioPage` already handles `ApiError` inline for `updateMutation` and `deleteMutation`. A 403 FORBIDDEN will produce an `ApiError` with `.message = 'You do not have permission to modify this tape'`. The existing rendering logic surfaces `err.message` to the user. No new error display components needed.

However: since edit/delete buttons will only be visible to authorized users after this story, the 403 from the server is belt-and-suspenders. It won't be reachable via normal UI flow after this story ships.

### Project Structure Notes

- All modified Edge Functions: `supabase/functions/update-tape/index.ts`, `supabase/functions/delete-tape/index.ts`, `supabase/functions/update-scenario/index.ts`, `supabase/functions/delete-scenario/index.ts`
- No new files, no schema changes — all infrastructure from story 1.1 is already in place
- No changes to `_shared/` — `extractUserId`, `jsonError`, `mapScenario`, `mapTape` are all correct as-is
- No changes to `web/src/api/` — types already have `ownerId`/`authorId`; `supabaseFetch` already sends JWT
- New code feature path: `web/src/features/` pattern not applicable here — changes are to existing `web/src/pages/ScenarioPage.tsx`

### Testing

- `cd web && npm test` (Vitest, single pass)
- No new test files required — behavior is primarily backend enforcement + conditional UI
- If any existing test asserts presence of Edit/Delete buttons on a tape row, the test fixture needs `tape.authorId === 'u1'` (matching the mocked `user.id`) or `scenario.ownerId === 'u1'`
- Pre-existing failures (`document is not defined` in color picker tests) are pre-existing — not a regression

### References

- Phase 2 brainstorming decisions source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Theme 2, "Creator Ownership (#1)"
- Ownership infrastructure (migration, `extractUserId`, `_userId` no-op): `_bmad-output/implementation-artifacts/1-1-supabase-auth-setup-and-user-schema.md` — review findings / completion notes
- Deferred-work items this story resolves: `_bmad-output/implementation-artifacts/deferred-work.md` — "Ownership is unenforced metadata" and "Unused `_userId` bindings"
- Current `update-tape` / `delete-tape` Edge Functions: `supabase/functions/update-tape/index.ts`, `supabase/functions/delete-tape/index.ts`
- `update-scenario` / `delete-scenario` (no `extractUserId` wiring yet): `supabase/functions/update-scenario/index.ts`, `supabase/functions/delete-scenario/index.ts`
- `extractUserId` helper: `supabase/functions/_shared/auth.ts`
- `ApiError` pattern: `web/src/api/client.ts` — `supabaseFetch` injects JWT; `ApiError` propagation in mutations
- Scenario/Tape DTOs: `web/src/api/types.ts` — `ownerId?: string` on `ScenarioDto`, `authorId?: string` on `TapeDto`
- ScenarioPage edit/delete button locations: `web/src/pages/ScenarioPage.tsx` ~line 508 (tape buttons), ~line 461 (scenario rename/delete)
- Project context rules: `_bmad-output/project-context.md` — Phase 2 branch (`phase2`), features path for new code, no App.tsx, all mutations via `supabaseFetch`

## Dev Agent Record

### Agent Model Used

Cursor (Sonnet 4.6)

### Debug Log References

_None._

### Completion Notes List

- `update-tape` and `delete-tape`: replaced `_userId` no-op with active `userId`; added 401 if null; expanded scenario select to `id, owner_id`; inserted pre-fetch of tape `author_id` before mutation; added 403 FORBIDDEN if caller is neither tape author nor scenario owner; removed redundant post-update NOT_FOUND check in `update-tape` (tape existence confirmed at pre-fetch).
- `update-scenario`: added `extractUserId` import; added 401 guard; added pre-fetch of `id, owner_id` by slug; added 403 if `userId !== owner_id`; changed update target from `public_slug` to `id` (pre-fetched); added `owner_id` to select for return row.
- `delete-scenario`: same ownership pattern as `update-scenario`; deletes by pre-fetched `id` instead of slug.
- `_shared/map.ts`: updated `mapScenario` to include `ownerId` (from `owner_id`) and `mapTape` to include `authorId` (from `author_id`) — required for UI permission checks; these fields were already selected in `get-scenario-by-slug` but silently dropped.
- `ScenarioPage.tsx`: derived `isScenarioOwner` and `canEditTape` after data loads; wrapped Rename/Delete scenario buttons in `{isScenarioOwner && ...}`; wrapped tape Edit/Delete buttons with `canEditTape(tape)` check.
- All 40 existing tests pass; 3 pre-existing lint errors (not in changed files).

### File List

- `supabase/functions/update-tape/index.ts`
- `supabase/functions/delete-tape/index.ts`
- `supabase/functions/update-scenario/index.ts`
- `supabase/functions/delete-scenario/index.ts`
- `supabase/functions/_shared/map.ts`
- `web/src/pages/ScenarioPage.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- **2026-04-12:** Story 2.1 — Creator ownership enforcement: 401/403 guards on all four mutation Edge Functions; `mapScenario`/`mapTape` now return `ownerId`/`authorId`; `ScenarioPage` hides edit/rename/delete controls from non-owners.
