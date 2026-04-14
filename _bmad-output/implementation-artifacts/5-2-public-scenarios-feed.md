# Story 5.2: Public scenarios feed

Status: done

## Story

As a visitor,
I want to browse all public scenarios in the Public tab,
So that I can discover what others have made without needing an account (FR15, FR16).

## Acceptance Criteria

1. **Given** the Public tab,
   **When** public scenarios exist,
   **Then** they display as scenario cards (name + tape count provocative line) in the same grid style as the existing library (1 col mobile → 2 col at `sm+`),
   **And** each card links to the scenario route (`/s/:slug`).

2. **Given** a logged-out visitor,
   **When** I view the public feed,
   **Then** I can browse and open scenarios but any action requiring login (add tape, follow) triggers the login gate — the public feed itself requires no auth.

3. **Given** no public scenarios yet,
   **When** the feed loads,
   **Then** an appropriate on-brand empty state is shown (not a generic "Create one to get started." — that message is wrong for a public community feed).

4. **Given** the feed is loading,
   **When** data is in flight,
   **Then** a skeleton or loading indicator renders (same pattern as `ScenarioLibrary` with `isLoading: true`).

5. **Given** a fetch error,
   **When** the request fails,
   **Then** an inline error message with a Retry button renders (via `ScenarioLibrary`'s `errorMessage` + `onRetry` props).

## Tasks / Subtasks

- [x] **Task 1: New Edge Function `list-public-scenarios`** (AC: 1, 2)
  - [x] Create `supabase/functions/list-public-scenarios/index.ts`
  - [x] Handle `OPTIONS` (CORS preflight) first — use `corsHeaders` from `_shared/cors.ts`
  - [x] Accept `GET` requests only (read-only, no body); reject other methods with 405
  - [x] Query: `SELECT id, name, public_slug, owner_id, is_public, created_at, updated_at FROM scenarios WHERE is_public = true ORDER BY created_at DESC LIMIT 50`
  - [x] Count tapes per scenario: second query `SELECT scenario_id FROM tapes WHERE scenario_id IN (...)` — same pattern as existing `list-scenarios`
  - [x] Map rows with `mapScenario` from `_shared/map.ts`
  - [x] Return `jsonOk({ scenarios: withCounts })` — same `ListScenariosResponse` shape
  - [x] Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key) — service-role-only rule
  - [x] No auth required — anonymous access (same trust model as `get-scenario-by-slug`)
  - [x] CDN imports only: `https://deno.land/std@0.168.0/http/server.ts`, `https://esm.sh/@supabase/supabase-js@2.45.0`

- [x] **Task 2: Add `publicFeed` query key** (AC: 1)
  - [x] In `web/src/api/queryKeys.ts`, add `publicFeed: [...scenarioKeys.all, 'public-feed'] as const` to `scenarioKeys`

- [x] **Task 3: Add `listPublicScenarios` API function** (AC: 1, 2)
  - [x] In `web/src/api/client.ts`, add `listPublicScenarios()` — GET request pattern (no body)
  - [x] Follow `getScenarioBySlug` pattern: manually set `Authorization` + `apikey` headers; no `supabaseFetch` helper (it adds Content-Type when body is present)
  - [x] Return type: `ListScenariosResponse` (already defined in `types.ts` — no new type needed)

- [x] **Task 4: Add `emptyMessage` prop to `ScenarioLibrary`** (AC: 3)
  - [x] In `web/src/components/ScenarioLibrary.tsx`, add optional `emptyMessage?: string` to `ScenarioLibraryProps`
  - [x] Default: `'No scenarios found. Create one to get started.'` (preserves existing behavior)
  - [x] When `emptyMessage` is provided, render that instead of the default

- [x] **Task 5: Wire Public tab in `LibraryPage`** (AC: 1, 2, 3, 4, 5)
  - [x] Import `useQuery` from `@tanstack/react-query`
  - [x] Import `listPublicScenarios` from `../api/client`
  - [x] Import `scenarioKeys` from `../api/queryKeys`
  - [x] Import `ScenarioLibrary` from `../components/ScenarioLibrary`
  - [x] Add `useQuery` call inside `LibraryPage`:
    ```ts
    const { data, isLoading, error, refetch } = useQuery({
      queryKey: scenarioKeys.publicFeed,
      queryFn: listPublicScenarios,
    })
    ```
  - [x] Replace the stub `{/* Story 5.2: public feed renders here */}` comment and `<p>` element in the `tab-panel-public` div with `<ScenarioLibrary>`
  - [x] Import `ApiError` from `../api/client`
  - [x] Guard the query with `isSupabaseConfigured()` check — only run if configured (same guard as rest of the app)
    - If not configured: render nothing or a config warning (same as existing pages)

- [x] **Task 6: Update `LibraryPage` tests** (AC: 1, 3, 4, 5)
  - [x] In `web/src/pages/LibraryPage.test.tsx`, add/update tests:
    - Test: Public tab loading state shows skeleton (mock `useQuery` to return `isLoading: true`)
    - Test: Public tab renders scenario cards when data returns (mock `useQuery` with `data: { scenarios: [...] }`)
    - Test: Public tab shows on-brand empty message when `data.scenarios` is empty
    - Test: Public tab shows error + retry when query errors
  - [x] Mock `useQuery` at module level with `vi.mock('@tanstack/react-query', ...)` — return controlled states per test
  - [x] Mock `listPublicScenarios` with `vi.mock('../api/client')` — prevent real fetch calls
  - [x] Existing tests for tab switching, login prompt, modal behavior must continue to pass

- [x] **Task 7: Regression** (all ACs)
  - [x] Run `npm test` in `web/` — all tests pass (86 passed, 11 test files)

### Review Findings

- [x] [Review][Patch] Zero-tape card copy on public feed — resolved 2026-04-13: added optional `zeroTapeCaption` on `ScenarioLibrary`; `LibraryPage` passes visitor-neutral line (“No tapes on this board yet.”). Default zero-tape line unchanged for other callers. [`web/src/components/ScenarioLibrary.tsx`](web/src/components/ScenarioLibrary.tsx), [`web/src/pages/LibraryPage.tsx`](web/src/pages/LibraryPage.tsx)

- [x] [Review][Defer] `list-public-scenarios` returns `DATABASE_ERROR` with raw `sErr.message` / `tErr.message` to callers — same pattern as other Edge Functions; tracked under DB error leakage in `deferred-work.md`. [`supabase/functions/list-public-scenarios/index.ts`](supabase/functions/list-public-scenarios/index.ts) (lines 31–33, 46–48)

- [x] [Review][Defer] Public feed payloads include `ownerId` on each scenario via `mapScenario` — same exposure decision as `list-scenarios` / `get-scenario-by-slug`; see `deferred-work.md` (owner_id / author_id exposure). [`supabase/functions/list-public-scenarios/index.ts`](supabase/functions/list-public-scenarios/index.ts) (lines 56–58)

- [x] [Review][Defer] Tape counts are computed by selecting all `tapes` rows for up to 50 scenario IDs — mirrors `list-scenarios`; fine at current scale, revisit with SQL `COUNT` aggregation if volume grows. [`supabase/functions/list-public-scenarios/index.ts`](supabase/functions/list-public-scenarios/index.ts) (lines 40–54)

## Dev Notes

### What This Story Is and Is Not

**Is:** Wire the Public tab in `LibraryPage` to a new `list-public-scenarios` Edge Function. Display cards using the existing `ScenarioLibrary` component. Handle loading, error, and empty states. Add `emptyMessage` prop to `ScenarioLibrary` for customizable empty copy.

**Is not:** Homepage top-3 public scenarios (brainstorm #8 — separate feature). Follow/unfollow (Epic 7). Private buckets (stories 5.3–5.5). Any new route or tab navigation changes.

### Critical: Do Not Duplicate `list-scenarios`

The existing `list-scenarios` Edge Function takes `{ slugs: string[] }` as POST body and returns only scenarios matching those slugs (the device's locally-known scenarios). **Do not reuse or modify it for the public feed.** The public feed requires a completely different query: `WHERE is_public = true` with no slug filter.

### Edge Function Pattern — Follow Exactly

All imports via CDN URLs. No npm specifiers. Pattern from `list-scenarios/index.ts`:

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'
import { mapScenario } from '../_shared/map.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'GET') {
    return jsonError('METHOD_NOT_ALLOWED', 'Use GET', 405)
  }
  // ... no body parsing needed
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  // ...
})
```

### Client Function Pattern — GET Without `supabaseFetch`

`supabaseFetch` adds `Content-Type: application/json` when a body is present — not needed for GET. Follow the `getScenarioBySlug` pattern for a clean GET call:

```ts
export async function listPublicScenarios(): Promise<ListScenariosResponse> {
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  const { data: { session } } = await supabaseClient.auth.getSession()
  const token = session?.access_token ?? anon
  const res = await fetch(supabaseFunctionUrl('list-public-scenarios'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
    },
  })
  return parseJson<ListScenariosResponse>(res)
}
```

Note: `supabaseFunctionUrl` and `parseJson` are already defined in `client.ts` but not exported — the new function must live **in the same file** (`web/src/api/client.ts`).

### queryKeys.ts Addition

```ts
export const scenarioKeys = {
  all: ['scenarios'] as const,
  bySlug: (slug: string) => [...scenarioKeys.all, 'slug', slug] as const,
  list: (slugsSorted: string) => [...scenarioKeys.all, 'list', slugsSorted] as const,
  publicFeed: ['scenarios', 'public-feed'] as const,   // ← add this
}
```

### `ScenarioLibrary` — Minimal Change

The `ScenarioLibrary` component already handles: skeleton loading, error + retry, empty state, and the card grid. Only the empty-state message is hardcoded and wrong for the public feed context ("Create one" is wrong for a visitor looking at a community feed). Add a single optional `emptyMessage` prop with the existing message as default — no behavioral changes. Tests in `ScenarioLibrary.test.tsx` should continue to pass without modification if default is preserved.

### TanStack Query in `LibraryPage`

The `QueryProvider` is already wrapping `AuthProvider` in `main.tsx` (correct order). `LibraryPage` can call `useQuery` directly — no provider changes needed.

Pattern used in `ScenarioPage` for reference:
```ts
const { data, isLoading } = useQuery({
  queryKey: scenarioKeys.bySlug(slug),
  queryFn: () => getScenarioBySlug(slug),
})
```

For the public feed (no arguments):
```ts
const { data, isLoading, error, refetch } = useQuery({
  queryKey: scenarioKeys.publicFeed,
  queryFn: listPublicScenarios,
})
```

### Error Handling — Use `ApiError`

`parseJson` throws `ApiError` on non-ok responses. In the template:
```tsx
errorMessage={error instanceof ApiError ? error.message : error ? 'Could not load public scenarios.' : undefined}
```

Import `ApiError` from `'../api/client'`.

### Login Gate — No Extra Work Needed

Logged-out visitors can browse and click cards — they land on `/s/:slug` where the existing login gate handles any restricted action (add tape). **Do not add a login gate to the public feed.** The story AC says "any action requiring login triggers the login gate" — that's already handled at the ScenarioPage level.

### Styling — Tailwind v4 Semantic Tokens Only

`ScenarioLibrary` already uses correct semantic tokens. In `LibraryPage`, any wrapper or loading placeholder must use tokens from `web/src/index.css @theme`:
- `bg-surface-raised`, `border-border`, `text-muted`, `text-foreground`
- `font-ui` (DM Mono) for meta copy
- `font-display` + `uppercase tracking-wide` for headings (Bebas Neue)
- No hardcoded hex values

### File Locations

- **New:** `supabase/functions/list-public-scenarios/index.ts`
- **Modified:** `web/src/api/queryKeys.ts` — add `publicFeed` key
- **Modified:** `web/src/api/client.ts` — add `listPublicScenarios()` function
- **Modified:** `web/src/components/ScenarioLibrary.tsx` — add `emptyMessage?` prop
- **Modified:** `web/src/pages/LibraryPage.tsx` — wire public tab with TanStack Query
- **Modified:** `web/src/pages/LibraryPage.test.tsx` — add public feed tests

Do **not** touch `web/src/api/types.ts` — `ListScenariosResponse` already covers the public feed response shape.

### Project Structure Notes

- `supabase/functions/list-public-scenarios/` follows the `kebab-case` Edge Function directory convention
- Named exports only from `ScenarioLibrary.tsx` and `LibraryPage.tsx` — no default exports from feature modules
- `ScenarioLibrary.test.tsx` already exists at `web/src/components/ScenarioLibrary.test.tsx` — read it before changing `ScenarioLibrary.tsx` to avoid breaking its tests

### Testing Standards

- Co-locate tests at `web/src/pages/LibraryPage.test.tsx` (already exists from 5.1)
- Mock `@tanstack/react-query`'s `useQuery` with `vi.mock` to control loading/error/data states per test
- Mock `listPublicScenarios` via `vi.mock('../api/client')` — prevent real network calls
- Wrap renders in `MemoryRouter` — same pattern as all existing page tests
- `npm test` in `web/` → `vitest run` — all tests must pass

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.2]
- [Source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Decision #9 (Two-Tab Library)]
- [Source: `_bmad-output/implementation-artifacts/5-1-two-tab-library-structure-and-shell.md` — file locations, auth pattern, tab structure]
- [Source: `web/src/pages/LibraryPage.tsx` — stub comment at line 61–62 (replace this)]
- [Source: `web/src/components/ScenarioLibrary.tsx` — component to reuse + extend with `emptyMessage`]
- [Source: `web/src/api/client.ts` — `listPublicScenarios` goes here; `supabaseFunctionUrl` and `parseJson` are local helpers]
- [Source: `web/src/api/queryKeys.ts` — add `publicFeed` key]
- [Source: `supabase/functions/list-scenarios/index.ts` — Edge Function pattern to follow]
- [Source: `supabase/functions/get-scenario-by-slug/index.ts` — GET pattern reference]
- [Source: `_bmad-output/project-context.md` — stack rules, token-only styling, no-go patterns]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (Cursor)

### Debug Log References

_No blockers — clean implementation._

### Completion Notes List

- Created `list-public-scenarios` Edge Function (GET, no auth, service-role key, queries `WHERE is_public = true ORDER BY created_at DESC LIMIT 50`, counts tapes per scenario, maps with `mapScenario`)
- Added `publicFeed: ['scenarios', 'public-feed'] as const` to `scenarioKeys` in `queryKeys.ts`
- Added `listPublicScenarios()` to `client.ts` following the `getScenarioBySlug` GET pattern (manual auth headers, no `supabaseFetch`)
- Added optional `emptyMessage?` prop to `ScenarioLibrary` with existing copy as default — no behavioral change for existing callers
- Added optional `zeroTapeCaption?` for visitor-neutral zero-tape card line; `LibraryPage` public feed sets “No tapes on this board yet.”
- Wired Public tab in `LibraryPage` with `useQuery`, guarded by `isSupabaseConfigured()`; renders `ScenarioLibrary` with loading/error/empty/data states
- Added/updated tests in `LibraryPage.test.tsx` and `ScenarioLibrary.test.tsx`; all 86 tests pass (11 test files)

### File List

- `supabase/functions/list-public-scenarios/index.ts` — new
- `web/src/api/queryKeys.ts` — modified (added `publicFeed` key)
- `web/src/api/client.ts` — modified (added `listPublicScenarios()`)
- `web/src/components/ScenarioLibrary.tsx` — modified (added `emptyMessage?`, `zeroTapeCaption?` props)
- `web/src/components/ScenarioLibrary.test.tsx` — modified (zero-tape caption test)
- `web/src/pages/LibraryPage.tsx` — modified (wired public feed with TanStack Query)
- `web/src/pages/LibraryPage.test.tsx` — modified (added public feed tests, updated mocks)

### Change Log

- 2026-04-13: Implemented story 5-2 — public scenarios feed wired to new `list-public-scenarios` Edge Function; added `emptyMessage` prop to `ScenarioLibrary`; 6 new tests; all 84 tests pass
- 2026-04-13: Code review follow-up — `zeroTapeCaption` on `ScenarioLibrary`, neutral public-feed zero-tape line; story `done`; 86 tests pass
