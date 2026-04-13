# Story 2.2: Private Scenarios — Unlisted Model

Status: done

## Story

As a scenario creator,
I want new scenarios to be private (unlisted) by default,
so that I can share my scenario only with people I explicitly send the link to — the link IS the invitation.

## Acceptance Criteria

1. **Given** a new scenario is created via `create-scenario`,
   **When** inserted into the DB,
   **Then** `is_public` defaults to `false` — no caller-supplied value is required or accepted.

2. **Given** a valid slug is requested via `get-scenario-by-slug`,
   **When** the scenario is private (`is_public = false`),
   **Then** the response returns the full scenario and tapes as normal — private does not mean "locked." No auth gate on viewing; the link IS the key.

3. **Given** any endpoint returns a scenario DTO,
   **When** the JSON is serialized,
   **Then** `isPublic: boolean` is present (e.g. `"isPublic": false` for a new scenario).

4. **Given** `list-scenarios` is called with a known-slugs array,
   **When** any of those scenarios have `is_public = false`,
   **Then** those scenarios are included in the response — private access is always link-based, never filtered by `is_public` here.

5. **Given** the migration runs on the live database,
   **When** applied,
   **Then** all existing scenarios have `is_public = false` (DB DEFAULT covers backfill for nullable rows; new column is NOT NULL DEFAULT FALSE).

## Tasks / Subtasks

- [x] **Task 1: DB migration — add `is_public` column** (AC: #1, #5)
  - [x] Create `supabase/migrations/20260412000000_add_is_public_to_scenarios.sql`
  - [x] `ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;`
  - [x] Add index: `CREATE INDEX IF NOT EXISTS idx_scenarios_is_public ON scenarios(is_public);` (needed for Epic 4 public feed)
  - [x] Add comment: `COMMENT ON COLUMN public.scenarios.is_public IS 'Visibility flag. FALSE = unlisted (link-access only). TRUE = listed in public feed. Default false — all new scenarios start private.';`

- [x] **Task 2: Update `_shared/map.ts` — expose `isPublic` in DTO** (AC: #3)
  - [x] Add `is_public: boolean` to the `mapScenario` row parameter type
  - [x] Map `is_public` → `isPublic` in the returned object

- [x] **Task 3: Update `get-scenario-by-slug` — include `is_public` in select** (AC: #2, #3)
  - [x] Change `.select('id, name, public_slug, owner_id, created_at, updated_at')` → add `is_public`
  - [x] No other changes — private scenarios are fully accessible via link (no auth gate)

- [x] **Task 4: Update `create-scenario` — include `is_public` in select** (AC: #1, #3)
  - [x] Change the `.select(...)` after insert to include `is_public`
  - [x] Do NOT add `is_public` to the Zod body schema or insert payload — DB default handles it

- [x] **Task 5: Update `update-scenario` — include `is_public` in selects** (AC: #3)
  - [x] Both the pre-fetch select and the return select need `is_public`

- [x] **Task 6: Update `list-scenarios` — include `is_public` in select** (AC: #3, #4)
  - [x] Change `.select('id, name, public_slug, owner_id, created_at, updated_at')` → add `is_public`
  - [x] No filtering changes — the function already filters by explicit slugs, which is the link-based private access pattern

- [x] **Task 7: Update `web/src/api/types.ts`** (AC: #3)
  - [x] Add `isPublic: boolean` to `ScenarioDto` (not optional — DB is NOT NULL)

- [x] **Task 8: Run tests** (regression guard)
  - [x] `cd web && npm test` — no new failures
  - [x] Check if any test fixtures construct `ScenarioDto` objects directly; if so add `isPublic: false` to those fixtures to satisfy TypeScript

### Review Findings

- [x] [Review][Patch] Partial index would serve Epic 4 better than full boolean index [`supabase/migrations/20260412000000_add_is_public_to_scenarios.sql`]
- [x] [Review][Patch] No unit test for `mapScenario` — TypeScript guards shape at compile time but a unit test would catch runtime regressions if a future select string drops `is_public` [`supabase/functions/_shared/map.ts`]

## Dev Notes

### Scope Boundary — Critical

- **IS:** DB column, DTO plumbing, `mapScenario` update, all edge function selects that return `ScenarioDto`.
- **IS NOT:** The UI toggle (story 2-3), the "going public = lose delete rights" rule (story 2-3/2-4), the public scenarios feed (Epic 4 / story 4-2), access restrictions on `get-scenario-by-slug`.
- **DO NOT** add `is_public` to the `create-scenario` Zod schema or insert — DB default is the entire implementation for defaults.
- **DO NOT** gate `get-scenario-by-slug` on `is_public` — the link IS the invitation for private scenarios.
- **DO NOT** add any frontend UI for toggling visibility — that is story 2-3.

### The Unlisted Model Explained

From the design decision (brainstorming-session-2026-04-10-phase2.md — Theme 2, "The Unlisted Model #2"):

> *Private = unlisted, not locked. The link IS the invitation. No account needed to view a private scenario, but login is required to add tapes.*

- `is_public = false` → scenario is NOT listed in any public feed, but is fully accessible via its `public_slug` URL
- `is_public = true` → scenario appears in the public feed (Epic 4) and has different ownership/deletion rules (stories 2-3, 2-4)
- This story delivers the data model only; stories 2-3 and 2-4 add the behavioral consequences

### Files to Touch

| File | Change |
|------|--------|
| `supabase/migrations/20260412000000_add_is_public_to_scenarios.sql` | New migration |
| `supabase/functions/_shared/map.ts` | `mapScenario`: add `is_public` param + `isPublic` in return |
| `supabase/functions/get-scenario-by-slug/index.ts` | Add `is_public` to `.select(...)` |
| `supabase/functions/create-scenario/index.ts` | Add `is_public` to the return `.select(...)` only |
| `supabase/functions/update-scenario/index.ts` | Add `is_public` to both the pre-fetch and return `.select(...)` |
| `supabase/functions/list-scenarios/index.ts` | Add `is_public` to `.select(...)` |
| `web/src/api/types.ts` | Add `isPublic: boolean` to `ScenarioDto` |

**Not modified:**
- `supabase/functions/delete-scenario/index.ts` — deletes don't return a scenario DTO
- `supabase/functions/update-tape/index.ts` — doesn't return a scenario DTO
- `supabase/functions/delete-tape/index.ts` — doesn't return a scenario DTO
- `supabase/functions/add-tape/index.ts` — returns a tape DTO, not a scenario DTO
- No frontend `.tsx` files — no UI in this story

### Exact Code Changes

#### `_shared/map.ts` — mapScenario update

```ts
export function mapScenario(row: {
  id: string
  name: string
  public_slug: string
  owner_id?: string | null
  is_public: boolean        // ← ADD
  created_at: string
  updated_at?: string
}) {
  return {
    id: row.id,
    name: row.name,
    publicSlug: row.public_slug,
    ownerId: row.owner_id ?? undefined,
    isPublic: row.is_public,  // ← ADD
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
```

#### All edge function selects — pattern to apply

Change every `.select('id, name, public_slug, owner_id, created_at, updated_at')` that is followed by a `mapScenario(...)` call to:
```ts
.select('id, name, public_slug, owner_id, is_public, created_at, updated_at')
```

In `update-scenario` there are two selects: the pre-fetch (which selects `id, owner_id` — no change needed there since it doesn't use `mapScenario`) and the return select after the update (which feeds `mapScenario` — add `is_public` here).

#### `web/src/api/types.ts` — ScenarioDto

```ts
export type ScenarioDto = {
  id: string
  name: string
  publicSlug: string
  ownerId?: string
  isPublic: boolean      // ← ADD (not optional — DB is NOT NULL DEFAULT FALSE)
  createdAt: string
  updatedAt?: string
}
```

### `update-scenario` — Two Selects, Only One Needs `is_public`

The current `update-scenario` has (from story 2-1):
1. **Pre-fetch** `.select('id, owner_id')` — used only for the ownership check; does NOT call `mapScenario` → no change needed
2. **Return select** `.select('id, name, public_slug, owner_id, created_at, updated_at')` after the `.update()` → this feeds `mapScenario` → add `is_public` here

### Migration Timestamp Convention

Existing migrations use timestamps like `20260330160000`, `20260411000000`. Use `20260412000000` for this migration.

### TypeScript Impact on Tests

After adding `isPublic: boolean` (non-optional) to `ScenarioDto`, TypeScript will error on any test fixture that constructs a `ScenarioDto` without `isPublic`. Audit test files for direct `ScenarioDto` object literals and add `isPublic: false`. Common locations:
- `web/src/pages/ScenarioPage` tests (if any construct scenario objects)
- `web/src/tape/TapeCreatorPanel.test.tsx`
- Any mock data in `web/src/api/` tests

Check with `cd web && npm test` to surface all affected fixtures in one pass.

### No RLS Changes

The existing migration (`20260330160000`) already has `ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY` with service-role bypass. The `is_public` column does not require RLS policy changes for this story — Epic 4 will add an RLS policy for the public feed when direct client reads are added.

### Project Structure Notes

- New migration file goes in `supabase/migrations/` following the `YYYYMMDDHHMMSS_description.sql` naming convention
- New feature code path: no new `web/src/features/` directory needed — this story only touches existing files
- `@supabase/supabase-js` is still not in `web/package.json` (tracked in `deferred-work.md`) — do not add it as part of this story

### References

- Design decision source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Theme 2, "The Unlisted Model (#2)"
- Migration convention: `supabase/migrations/20260411000000_add_auth_ownership.sql` — follow same pattern
- `mapScenario` current implementation: `supabase/functions/_shared/map.ts`
- `ScenarioDto` current type: `web/src/api/types.ts`
- Story 2-1 learnings (ownership pre-fetch pattern): `_bmad-output/implementation-artifacts/2-1-creator-ownership-and-contributor-permissions.md`
- Deferred work (do not re-raise): `_bmad-output/implementation-artifacts/deferred-work.md`
- Project context (branch, anti-patterns): `_bmad-output/project-context.md`

## Dev Agent Record

### Agent Model Used

Cursor (Sonnet 4.6)

### Debug Log References

None — implementation was straightforward with no surprises.

### Completion Notes List

- Created migration `20260412000000_add_is_public_to_scenarios.sql`: `NOT NULL DEFAULT FALSE` column, index for Epic 4 public feed, and column comment.
- Updated `mapScenario` in `_shared/map.ts` to accept and map `is_public → isPublic`.
- Added `is_public` to the `.select(...)` string in `get-scenario-by-slug`, `create-scenario`, `update-scenario` (return select only, not the pre-fetch ownership select), and `list-scenarios`.
- Added `isPublic: boolean` (non-optional) to `ScenarioDto` in `web/src/api/types.ts`.
- Ran full test suite: 5 test files, 40 tests — all pass, zero regressions. No test fixtures constructed `ScenarioDto` objects directly so no fixture updates were needed.

### File List

- `supabase/migrations/20260412000000_add_is_public_to_scenarios.sql` (new)
- `supabase/functions/_shared/map.ts` (modified)
- `supabase/functions/_shared/map.test.ts` (new)
- `supabase/functions/get-scenario-by-slug/index.ts` (modified)
- `supabase/functions/create-scenario/index.ts` (modified)
- `supabase/functions/update-scenario/index.ts` (modified)
- `supabase/functions/list-scenarios/index.ts` (modified)
- `web/src/api/types.ts` (modified)

## Change Log

- 2026-04-12: Story 2.2 implemented — added `is_public` DB column (NOT NULL DEFAULT FALSE), wired `isPublic` through all scenario DTOs (map.ts, 4 edge functions, frontend types). All 40 tests pass.
