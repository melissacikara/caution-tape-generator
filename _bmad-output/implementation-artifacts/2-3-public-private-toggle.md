# Story 2.3: Public/Private Toggle

Status: done

## Story

As a scenario creator,
I want to toggle my scenario between private and public,
so that I can share it broadly (public feed, Epic 4) or keep it link-only — with clear consequences for each state.

## Acceptance Criteria

1. **Given** I am the scenario owner on the ScenarioPage,
   **When** the scenario is private (`isPublic = false`),
   **Then** a "Make Public" button is visible in the scenario header (alongside Rename/Delete).

2. **Given** I am the scenario owner on the ScenarioPage,
   **When** the scenario is public (`isPublic = true`),
   **Then** a "Make Private" button is visible, and the Delete scenario button is **NOT** shown — even for the owner.

3. **Given** I am not the scenario owner, or I am logged out,
   **When** viewing the scenario page,
   **Then** no toggle button is shown (only owners can change visibility).

4. **Given** I click "Make Public" on my private scenario,
   **When** I see a confirmation dialog and click "Go public",
   **Then** the `toggle-scenario-visibility` Edge Function is called with `isPublic: true`, the scenario updates in the DB, and the UI reflects the public state (toggle becomes "Make Private", Delete disappears).

5. **Given** I click "Make Private" on my public scenario,
   **When** the action fires (no confirmation needed),
   **Then** the `toggle-scenario-visibility` Edge Function is called with `isPublic: false`, the DB updates, and the Delete scenario button reappears.

6. **Given** a scenario has `is_public = true`,
   **When** the scenario owner (or anyone) calls `delete-scenario`,
   **Then** the Edge Function returns HTTP 403 with `{ error: { code: "FORBIDDEN", message: "Public scenarios cannot be deleted. Make it private first to regain delete rights." } }`.

7. **Given** a caller without auth calls `toggle-scenario-visibility`,
   **When** the request is processed,
   **Then** HTTP 401 UNAUTHORIZED is returned.

8. **Given** a non-owner calls `toggle-scenario-visibility`,
   **When** the request is processed,
   **Then** HTTP 403 FORBIDDEN is returned.

9. **Given** the toggle is pending (network in-flight),
   **When** the button renders,
   **Then** it is disabled and shows a loading label to prevent double-fire.

## Tasks / Subtasks

- [x] **Task 1: New Edge Function `toggle-scenario-visibility`** (AC: #4, #5, #6, #7, #8)
  - [x] Create `supabase/functions/toggle-scenario-visibility/index.ts`
  - [x] Zod body schema: `{ scenarioSlug: z.string().min(1).max(128), isPublic: z.boolean() }`
  - [x] Handle OPTIONS (CORS) → `new Response('ok', { headers: corsHeaders })`
  - [x] Enforce POST-only → 405 otherwise
  - [x] `extractUserId(req)` → 401 if null
  - [x] Supabase client from env (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`)
  - [x] Pre-fetch: `.select('id, owner_id').eq('public_slug', scenarioSlug).maybeSingle()` → 404 if missing, 500 on DB error
  - [x] Permission check: `userId !== scenario.owner_id` → 403 FORBIDDEN
  - [x] Update: `.update({ is_public: isPublic }).eq('id', scenario.id).select('id, name, public_slug, owner_id, is_public, created_at, updated_at')` → return `jsonOk({ scenario: mapScenario(rows[0]) })`
  - [x] No migration needed — `is_public` column added by story 2-2

- [x] **Task 2: Block deletion of public scenarios in `delete-scenario`** (AC: #6)
  - [x] Modify `supabase/functions/delete-scenario/index.ts`
  - [x] Change pre-fetch select from `.select('id, owner_id')` → `.select('id, owner_id, is_public')`
  - [x] After the ownership check: `if (scenario.is_public) { return jsonError('FORBIDDEN', 'Public scenarios cannot be deleted. Make it private first to regain delete rights.', 403) }`
  - [x] Confirm the check sits between the ownership check and the `.delete()` call

- [x] **Task 3: Add types and API client function** (AC: #4, #5)
  - [x] In `web/src/api/types.ts`, add:
    ```ts
    export type ToggleScenarioVisibilityBody = {
      scenarioSlug: string
      isPublic: boolean
    }
    export type ToggleScenarioVisibilityResponse = {
      scenario: ScenarioDto
    }
    ```
  - [x] In `web/src/api/client.ts`, add:
    ```ts
    export async function toggleScenarioVisibility(
      body: ToggleScenarioVisibilityBody,
    ): Promise<ToggleScenarioVisibilityResponse> {
      const res = await supabaseFetch('toggle-scenario-visibility', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return parseJson<ToggleScenarioVisibilityResponse>(res)
    }
    ```
  - [x] Import `ToggleScenarioVisibilityBody` and `ToggleScenarioVisibilityResponse` at the top of `client.ts`
  - [x] Import `toggleScenarioVisibility` in `ScenarioPage.tsx` from `'../api/client'`

- [x] **Task 4: Add toggle mutation in `ScenarioPage`** (AC: #4, #5, #9)
  - [x] Add `[confirmMakePublic, setConfirmMakePublic] = useState(false)` state
  - [x] Add `toggleVisibilityMutation = useMutation(...)`:
    - `mutationFn`: calls `toggleScenarioVisibility({ scenarioSlug: slug!, isPublic })`
    - `onMutate`: optimistic update — flip `scenario.isPublic` in the TanStack cache (same pattern as `renameScenarioMutation`)
    - `onError`: rollback via `ctx.previous` (same pattern as all other mutations)
    - `onSettled`: `invalidateQueries` on both `scenarioKeys.bySlug(slug)` AND `scenarioKeys.all`
    - `onSuccess`: `setConfirmMakePublic(false)` (dismiss the dialog)
  - [x] Derive `toggleVisibilityErr` from `toggleVisibilityMutation.error` (same pattern as `renameErr`, `deleteScenarioErr`)

- [x] **Task 5: Update `ScenarioPage` header UI** (AC: #1, #2, #3, #4, #5, #9)
  - [x] In the `isScenarioOwner` block (currently contains Rename + Delete buttons), add the toggle button:
    - When `!scenario.isPublic`: render a "Make Public" button → `onClick` opens confirmation dialog (`setConfirmMakePublic(true)`)
    - When `scenario.isPublic`: render a "Make Private" button → `onClick` fires `toggleVisibilityMutation.mutate(false)` directly
    - Disable both when `toggleVisibilityMutation.isPending`
    - Loading label: "Updating…" while pending
  - [x] Change the Delete scenario button visibility condition from `isScenarioOwner` to `isScenarioOwner && !scenario.isPublic`
    - The Rename button is still visible even when public (renaming is always allowed)
  - [x] Optional: add a small public/private status badge next to the scenario name to show all users the current visibility state (e.g., `isPublic` → `PUBLIC` badge / `PRIVATE` badge in `font-ui text-xs` styled consistently with muted text)
  - [x] Inline error for toggle: below the button row, show `toggleVisibilityErr` if present (same pattern as `renameErr`)

- [x] **Task 6: Add "Make Public" confirmation dialog** (AC: #4)
  - [x] Reuse existing `DeleteConfirmSheet` component (already imported)
  - [x] Add a third `<DeleteConfirmSheet>` instance for the "Make Public" confirmation:
    ```tsx
    <DeleteConfirmSheet
      open={confirmMakePublic}
      title="Make this scenario public?"
      description="Once public, anyone can find and view it. You won't be able to delete it — make it private again to regain that right."
      confirmLabel={toggleVisibilityMutation.isPending ? 'Updating…' : 'Go public'}
      cancelLabel="Keep private"
      onCancel={() => {
        if (!toggleVisibilityMutation.isPending) {
          setConfirmMakePublic(false)
          toggleVisibilityMutation.reset()
        }
      }}
      onConfirm={() => toggleVisibilityMutation.mutate(true)}
      pending={toggleVisibilityMutation.isPending}
      errorMessage={confirmMakePublic && toggleVisibilityErr ? toggleVisibilityErr : null}
    />
    ```
  - [x] Note: `DeleteConfirmSheet` uses `bg-red-700` for the confirm button — this is intentionally fitting here (going public is a meaningful, weighted action)

- [x] **Task 7: Run tests** (regression guard)
  - [x] `cd web && npm test` — no new failures (40/40 pass)
  - [x] Check for any test that asserts the Delete scenario button is visible; it must now also satisfy `!scenario.isPublic` in the fixture. Update fixtures to include `isPublic: false` (existing `ScenarioDto` fixtures already have `isPublic: false` from story 2-2 fix, so this should pass)
  - [x] No new test files required — backend enforcement is integration-level; UI logic is primarily conditional rendering with flags already tested

### Review Findings (AI)

- [x] [Review][Decision] Wrong pending label shown in "Make Public" dialog — resolved: added `pendingLabel` prop to `DeleteConfirmSheet` (default `"Removing…"`); make-public sheet passes `pendingLabel="Updating…"`. All existing usages unchanged.
- [x] [Review][Patch] TOCTOU race: `delete-scenario` reads `is_public` and deletes in two separate queries — fixed: added `.eq('is_public', false)` to the DELETE call as an atomic guard. [supabase/functions/delete-scenario/index.ts]
- [x] [Review][Patch] AC6 violation: non-owner calling `delete-scenario` on a public scenario receives the ownership-violation 403, not the AC6-specified "Public scenarios cannot be deleted" 403 — fixed: moved `is_public` check before ownership check. [supabase/functions/delete-scenario/index.ts]
- [x] [Review][Patch] Defense-in-depth: ownership check and UPDATE in `toggle-scenario-visibility` are non-atomic — fixed: added `.eq('owner_id', userId)` to the UPDATE statement. [supabase/functions/toggle-scenario-visibility/index.ts]
- [x] [Review][Defer] `extractUserId` called before env check — missing env vars can surface as 401 UNAUTHORIZED instead of 500 SERVER_CONFIG [supabase/functions/toggle-scenario-visibility/index.ts] — deferred, minor operational/debug concern only

## Dev Notes

### Scope Boundary — Critical

- **IS:** The UI toggle button + confirmation dialog; the `toggle-scenario-visibility` Edge Function; the "can't delete public scenario" backend guard in `delete-scenario`; the Delete button hide logic in the UI.
- **IS NOT:** The public scenarios feed (Epic 4 / story 4-2); the "add-tape requires login on public scenarios" rule (story 2-4 / the current behavior is unchanged here — contributors can still add tapes without auth on any scenario); the report footer (story 2-5); the About page copy explaining the privacy model.
- **DO NOT** change `get-scenario-by-slug`, `add-tape`, `create-scenario`, or `list-scenarios` — no permission changes needed for read or add in this story.
- **DO NOT** add RLS policies — the service-role key bypasses RLS in all edge functions; story 2-4 will address any RLS concerns for direct client queries.
- **DO NOT** add `isPublic` to the `update-scenario` body schema — name updates are separate from visibility; keep them decoupled.

### The Weight of Going Public — Key Design Decision

From brainstorming-session-2026-04-10-phase2.md, Theme 2:

> *"Going public is a meaningful, intentional act with real consequences (losing delete rights on the scenario). That weight is appropriate — it makes the public/private distinction feel like a real decision, not just a visibility filter."*

This is why "Make Public" requires a confirmation but "Make Private" does not. Going public is the weighted action; going private is the safe recovery.

The `DeleteConfirmSheet` red confirm button visually reinforces this weight — appropriate here despite it not being a delete action.

### New Edge Function File

Create at: `supabase/functions/toggle-scenario-visibility/index.ts`

Follow the exact same structure as `update-scenario/index.ts`. The full function:
```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { extractUserId } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'
import { mapScenario } from '../_shared/map.ts'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  scenarioSlug: z.string().min(1).max(128),
  isPublic: z.boolean(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonError('METHOD_NOT_ALLOWED', 'Use POST', 405)
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', formatZodError(parsed.error), 400)
  }

  const userId = await extractUserId(req)
  if (!userId) {
    return jsonError('UNAUTHORIZED', 'Login required', 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !key) {
    return jsonError('SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const supabase = createClient(supabaseUrl, key)
  const { scenarioSlug, isPublic } = parsed.data

  const { data: existing, error: sErr } = await supabase
    .from('scenarios')
    .select('id, owner_id')
    .eq('public_slug', scenarioSlug)
    .maybeSingle()

  if (sErr) {
    return jsonError('DATABASE_ERROR', sErr.message, 500)
  }
  if (!existing) {
    return jsonError('NOT_FOUND', 'Scenario not found', 404)
  }

  if (userId !== existing.owner_id) {
    return jsonError('FORBIDDEN', 'You do not have permission to modify this scenario', 403)
  }

  const { data: rows, error: uErr } = await supabase
    .from('scenarios')
    .update({ is_public: isPublic })
    .eq('id', existing.id)
    .select('id, name, public_slug, owner_id, is_public, created_at, updated_at')

  if (uErr) {
    return jsonError('DATABASE_ERROR', uErr.message, 500)
  }
  const scenario = rows?.[0]
  if (!scenario) {
    return jsonError('NOT_FOUND', 'Scenario not found', 404)
  }

  return jsonOk({ scenario: mapScenario(scenario) })
})
```

Note: The select string `'id, name, public_slug, owner_id, is_public, created_at, updated_at'` matches the other functions exactly (added `is_public` in story 2-2).

### `delete-scenario` Change — Exact Patch

Current pre-fetch in `supabase/functions/delete-scenario/index.ts`:
```ts
const { data: scenario, error: sErr } = await supabase
  .from('scenarios')
  .select('id, owner_id')
  .eq('public_slug', scenarioSlug)
  .maybeSingle()
```

Change to:
```ts
const { data: scenario, error: sErr } = await supabase
  .from('scenarios')
  .select('id, owner_id, is_public')
  .eq('public_slug', scenarioSlug)
  .maybeSingle()
```

Then insert after the ownership check:
```ts
if (scenario.is_public) {
  return jsonError(
    'FORBIDDEN',
    'Public scenarios cannot be deleted. Make it private first to regain delete rights.',
    403,
  )
}
```

### Optimistic Update Pattern for Toggle Mutation

Match the `renameScenarioMutation` optimistic update pattern exactly:

```ts
onMutate: async (newIsPublic: boolean) => {
  if (!slug) return
  const key = scenarioKeys.bySlug(slug)
  await queryClient.cancelQueries({ queryKey: key })
  const previous = queryClient.getQueryData<GetScenarioResponse>(key)
  if (previous) {
    queryClient.setQueryData<GetScenarioResponse>(key, {
      ...previous,
      scenario: { ...previous.scenario, isPublic: newIsPublic },
    })
  }
  return { previous }
},
onError: (_e, _v, ctx) => {
  if (!slug) return
  if (ctx?.previous) {
    queryClient.setQueryData(scenarioKeys.bySlug(slug), ctx.previous)
  }
},
```

### mutationFn Signature

The `mutationFn` receives the variable (`true` or `false`) passed to `.mutate(true)` or `.mutate(false)`:
```ts
mutationFn: async (newIsPublic: boolean) => {
  if (!slug) throw new Error('Missing slug')
  return toggleScenarioVisibility({ scenarioSlug: slug, isPublic: newIsPublic })
},
```

### UI Header Layout

Current button row (inside `isScenarioOwner` block):
```
[Rename] [Delete]
```

After this story:
```
[Make Public / Make Private]  [Rename]  [Delete (only when private)]
```

All buttons stay in the same `flex gap-1 pt-1 shrink-0` container. The toggle button goes first as it's the most significant new action. Apply the same `min-h-[28px] border border-border px-2 font-ui text-xs` class family as the existing Rename/Delete buttons. For the "Make Private" button, `text-muted hover:border-accent` is appropriate (recovery action, neutral styling). For "Make Public" button, same neutral styling (the weight comes from the confirmation dialog, not the button color).

### Visibility Status Badge (Optional but Recommended)

Add a small status indicator near the tape count (`<p className="mt-1 ...">`) to show ALL users the scenario's current visibility:

```tsx
<p className="mt-1 font-ui text-xs text-muted">
  {tapes.length} tape{tapes.length === 1 ? '' : 's'}
  {' · '}
  <span className={scenario.isPublic ? 'text-foreground' : 'text-muted'}>
    {scenario.isPublic ? 'Public' : 'Private'}
  </span>
</p>
```

This helps contributors (non-owners) understand the scenario's current state without any additional complexity.

### Project Structure Notes

- New Edge Function: `supabase/functions/toggle-scenario-visibility/index.ts` (new directory + file)
- Modified Edge Function: `supabase/functions/delete-scenario/index.ts` (add `is_public` to pre-fetch select + public block guard)
- Frontend types: `web/src/api/types.ts` (two new types)
- Frontend client: `web/src/api/client.ts` (one new function + import additions)
- Frontend page: `web/src/pages/ScenarioPage.tsx` (new mutation, state, UI elements)
- No schema migration needed — `is_public` column exists from story 2-2
- No new `web/src/features/` directory needed — all changes are to existing files + new edge function
- No changes to `_shared/` — `mapScenario`, `extractUserId`, `jsonError`, `cors` are all correct as-is

### References

- Brainstorming decisions: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Theme 2 ("Toggle Follows the State #17", "Public = Community Object #17")
- `is_public` column added by: `supabase/migrations/20260412000000_add_is_public_to_scenarios.sql`
- `mapScenario` (returns `isPublic`): `supabase/functions/_shared/map.ts`
- `update-scenario` (pattern to follow): `supabase/functions/update-scenario/index.ts`
- `delete-scenario` (file to modify): `supabase/functions/delete-scenario/index.ts`
- `ScenarioDto` (has `isPublic: boolean`): `web/src/api/types.ts`
- `DeleteConfirmSheet` (reuse for confirmation): `web/src/components/DeleteConfirmSheet.tsx`
- `renameScenarioMutation` (optimistic update pattern): `web/src/pages/ScenarioPage.tsx` ~line 221
- `scenarioKeys` (query key factory): `web/src/api/queryKeys.ts`
- Deferred work (do not re-raise): `_bmad-output/implementation-artifacts/deferred-work.md`
- Project context (branch `phase2`, anti-patterns): `_bmad-output/project-context.md`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (Cursor)

### Debug Log References

None — implementation proceeded cleanly following story spec patterns.

### Completion Notes List

- Created new Edge Function `toggle-scenario-visibility/index.ts` following the exact structure from `update-scenario/index.ts`. Zod validation, auth check, ownership check, DB update, and `mapScenario` response all implemented per spec.
- Modified `delete-scenario/index.ts` to add `is_public` to the pre-fetch select and block deletion with HTTP 403 when `scenario.is_public` is true. Guard sits between ownership check and the `.delete()` call as specified.
- Added `ToggleScenarioVisibilityBody` and `ToggleScenarioVisibilityResponse` types to `web/src/api/types.ts`.
- Added `toggleScenarioVisibility` client function to `web/src/api/client.ts` with proper import additions.
- Added `toggleVisibilityMutation` with full optimistic-update pattern (cancel → snapshot → update cache → rollback on error) matching `renameScenarioMutation` exactly.
- Updated ScenarioPage header: toggle button first (Make Public/Make Private), Rename, Delete (only when private). All buttons in the same `flex gap-1 pt-1 shrink-0` container.
- Added visibility status badge ("Public"/"Private") below tape count visible to all users.
- Added inline error display for `toggleVisibilityErr` when not in the confirmation dialog.
- Added third `DeleteConfirmSheet` instance for "Make Public" confirmation dialog with `cancelLabel="Keep private"`.
- All 40 tests pass — no regressions.

### File List

- `supabase/functions/toggle-scenario-visibility/index.ts` (new)
- `supabase/functions/delete-scenario/index.ts` (modified)
- `web/src/api/types.ts` (modified)
- `web/src/api/client.ts` (modified)
- `web/src/pages/ScenarioPage.tsx` (modified)
