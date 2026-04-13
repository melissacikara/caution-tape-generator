# Story 2.5: Report Tape and Persistent Footer

Status: done

## Story

As a visitor to the app,
I want a persistent footer visible on every page and a per-tape "Report" affordance on public scenarios,
so that the app feels like a finished product, there's a path to support the creator, and Melissa can moderate public content through a simple human-reviewed flagging system.

## Acceptance Criteria

1. **Given** any page in the app (home, scenario, about, not-found),
   **When** I scroll past the main content,
   **Then** a persistent footer is visible containing a "Buy me a coffee" external link.

2. **Given** I am viewing a **public** scenario (`scenario.isPublic === true`),
   **When** I look at a persisted tape row (non-optimistic),
   **Then** a "Report" button is visible on that row — regardless of whether I am logged in or not.

3. **Given** I am viewing a **private** scenario (`scenario.isPublic === false`),
   **When** I view any tape row,
   **Then** no "Report" button is shown — private scenarios are unmoderated (between consenting friends).

4. **Given** I click "Report" on a public tape,
   **When** the `report-tape` Edge Function succeeds,
   **Then** the button permanently changes to "Reported" for the duration of the session (client state, no refresh needed) and is disabled — no toast, no modal.

5. **Given** I click "Report" and the Edge Function returns an error,
   **When** the mutation fails,
   **Then** an inline error ("Couldn't report. Try again.") appears near the tape and the button resets to "Report."

6. **Given** the `report-tape` Edge Function receives a valid `{ scenarioSlug, tapeId }` payload,
   **When** invoked,
   **Then** a row is inserted into `tape_reports` with `tape_id`, `scenario_slug`, and `reported_at`, and the response is `{ ok: true }` with HTTP 200.

7. **Given** the migration runs on the live database,
   **When** applied,
   **Then** `tape_reports` exists with the correct columns and indexes.

## Tasks / Subtasks

- [x] **Task 1: DB migration — create `tape_reports` table** (AC: #6, #7)
  - [x] Create `supabase/migrations/20260413000000_create_tape_reports.sql`
  - [x] Table: `tape_reports(id UUID PK DEFAULT gen_random_uuid(), tape_id UUID NOT NULL REFERENCES tapes(id) ON DELETE CASCADE, scenario_slug TEXT NOT NULL, reported_at TIMESTAMPTZ NOT NULL DEFAULT now())`
  - [x] Add index: `CREATE INDEX IF NOT EXISTS idx_tape_reports_tape_id ON tape_reports(tape_id);`
  - [x] Add comment on table: explains this is the human-moderated report log

- [x] **Task 2: Implement `report-tape` Edge Function** (AC: #6)
  - [x] Create `supabase/functions/report-tape/index.ts` using the standard edge function template (see Dev Notes)
  - [x] Zod schema: `{ scenarioSlug: z.string().min(1), tapeId: z.string().uuid() }` — no auth required
  - [x] No `extractUserId` needed — reporting is fully anonymous
  - [x] Insert into `tape_reports`; return `jsonOk({ ok: true })`
  - [x] Use `jsonError` for validation failures (400) and DB errors (500)
  - [x] Handle OPTIONS preflight first (same as all other edge functions)

- [x] **Task 3: Add `reportTape` to API client and types** (AC: #4, #5)
  - [x] `web/src/api/types.ts` — add `ReportTapeBody` and `ReportTapeResponse`
  - [x] `web/src/api/client.ts` — add `reportTape()` using `supabaseFetch('report-tape', { method: 'POST', ... })`

- [x] **Task 4: Build `AppFooter` component** (AC: #1)
  - [x] Create `web/src/components/AppFooter.tsx`
  - [x] Contains: `border-t border-border bg-background`, centered with same `max-w` as header, `font-ui text-xs text-muted`
  - [x] "Buy me a coffee" as an `<a href="..." target="_blank" rel="noopener noreferrer">` — URL in a named constant at top of file

- [x] **Task 5: Wire `AppFooter` into `AppLayout`** (AC: #1)
  - [x] `web/src/layout/AppLayout.tsx` — change root div to `flex flex-col`, wrap `<Outlet />` in a `<div className="flex-1">`, add `<AppFooter />` after it
  - [x] Verify `min-h-svh` + `flex-col` + `flex-1` on content pushes footer to bottom

- [x] **Task 6: Add Report button and mutation to `ScenarioPage`** (AC: #2, #3, #4, #5)
  - [x] Add `reportMutation` using `useMutation` calling `reportTape`
  - [x] Add `reportedTapeIds` state: `useState<Set<string>>(() => new Set())`
  - [x] Import `reportTape` from `../api/client`
  - [x] In the tape list, add Report button conditionally: only when `isPersistedTape(tape) && scenario.isPublic`
  - [x] Report button is independent of `canEditTape` — visible to all visitors on public scenarios
  - [x] Disabled state: `reportedTapeIds.has(tape.id)` → show "Reported" (disabled); otherwise "Report"
  - [x] On success: `setReportedTapeIds(prev => { const next = new Set(prev); next.add(tapeId); return next })`
  - [x] On error: show inline message `"Couldn't report. Try again."` near the tape (per-tape error, not global)

- [x] **Task 7: Run tests** (regression guard)
  - [x] `cd web && npm test` — expect all 40 tests to pass
  - [x] Check if any test fixture constructs `AppLayout` — if so, it now renders `AppFooter`, update mocks if needed

### Review Findings

- [x] [Review][Patch] `reportingTapeId` cleared in `onError` — AC #5 inline error never renders [`web/src/pages/ScenarioPage.tsx`]
- [x] [Review][Patch] `reportMutation.isPending` disables all Report buttons simultaneously, not just the pending tape [`web/src/pages/ScenarioPage.tsx`]
- [x] [Review][Defer] No `tapeId`↔`scenarioSlug` cross-validation in Edge Function — deferred, pre-existing acceptable pattern for anonymous admin log; malicious cross-pairing has no exploitable consequence [`supabase/functions/report-tape/index.ts`]
- [x] [Review][Defer] Raw `DATABASE_ERROR` on FK violation for non-existent tapeId — deferred, pre-existing DB error leakage pattern tracked in deferred-work.md [`supabase/functions/report-tape/index.ts`]

## Dev Notes

### Scope Boundary — Critical

- **IS:** `tape_reports` DB table, `report-tape` edge function, `AppFooter` component, `AppLayout` flex update, Report button on public scenario tape rows.
- **IS NOT:** Admin UI to view reports (Melissa reads directly from Supabase dashboard); report deduplication (multiple reports from same session are fine — admin sees all); per-tape report count display; any moderation enforcement; report button on private scenarios.
- **DO NOT** show the Report button on private scenarios — "private scenarios are unmoderated (between consenting friends)" is an explicit design decision from brainstorming-session-2026-04-10-phase2.md Theme 6 (#18).
- **DO NOT** require auth for reporting — anonymous reporting is the correct model (even logged-out visitors can report public content).
- **DO NOT** show a toast or modal on successful report — inline "Reported" state change is sufficient per the UX convention (UX-DR12: no success toasts).

### Edge Function Template — Follow Existing Pattern

All edge functions in this project share the same structure. Follow `supabase/functions/add-tape/index.ts` exactly:

```ts
import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  scenarioSlug: z.string().min(1),
  tapeId: z.string().uuid(),
})

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return jsonError('SERVER_CONFIG', 'Missing configuration', 500)

  const supabase = createClient(url, key)

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch (err) {
    return jsonError('VALIDATION_ERROR', formatZodError(err), 400)
  }

  const { error } = await supabase
    .from('tape_reports')
    .insert({ tape_id: body.tapeId, scenario_slug: body.scenarioSlug })

  if (error) return jsonError('DATABASE_ERROR', error.message, 500)

  return jsonOk({ ok: true })
})
```

Key rules:
- CDN imports only — no npm specifiers (`esm.sh/` and `deno.land/std@0.168.0/`)
- ALWAYS handle `OPTIONS` first
- Use `SUPABASE_SERVICE_ROLE_KEY` (never anon key in edge functions)
- All mutations use `POST` — no `PATCH`, `PUT`, `DELETE` HTTP methods
- Zod parse at entry using `formatZodError` from `_shared/zod.ts`

### API Types and Client Pattern

`web/src/api/types.ts` — add alongside other type pairs:
```ts
export type ReportTapeBody = {
  scenarioSlug: string
  tapeId: string
}
export type ReportTapeResponse = { ok: true }
```

`web/src/api/client.ts` — add using `supabaseFetch` (never raw `fetch`):
```ts
export async function reportTape(body: ReportTapeBody): Promise<ReportTapeResponse> {
  const res = await supabaseFetch('report-tape', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<ReportTapeResponse>(res)
}
```

### `AppFooter` Component Design

Must match the industrial aesthetic. Follow `AppHeader`'s structure:

```tsx
const BUY_ME_COFFEE_URL = 'https://buymeacoffee.com/cautiontape'

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex h-[48px] w-full max-w-[480px] items-center justify-center gap-6 px-4 md:max-w-[640px] md:px-6">
        <a
          href={BUY_ME_COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-ui text-xs text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          ☕ Buy me a coffee
        </a>
      </div>
    </footer>
  )
}
```

The URL constant `BUY_ME_COFFEE_URL` at the top of the file is intentional — Melissa will update it to her real URL. Do NOT hardcode it inline.

### `AppLayout` Update — Flex Column

Change the root `div` to `flex flex-col` and add a `flex-1` wrapper around `<Outlet />`:

```tsx
<div className="flex min-h-svh flex-col overflow-x-hidden bg-background">
  {/* supabase config warning banner */}
  <AppHeader />
  <div className="flex-1">
    <Outlet />
  </div>
  <AppFooter />
</div>
```

This pushes the footer to the bottom on short-content pages (about, not-found). On `ScenarioPage`, the footer appears below the tape stack in the document flow; the pinned bottom bar (z-40) overlays it visually while scrolling, which is the correct behavior (footer is only fully visible after scrolling past all content).

### Report Button Placement in ScenarioPage

The Report button lives in the tape action row, alongside (but independent of) Edit/Delete. The current structure:

```tsx
{isPersistedTape(tape) && canEditTape(tape) ? (
  <div className="mt-2 flex flex-wrap gap-2">
    <button>Edit</button>
    <button>Delete</button>
  </div>
) : null}
```

After this story, the structure should be:

```tsx
{(isPersistedTape(tape) && (canEditTape(tape) || scenario.isPublic)) ? (
  <div className="mt-2 flex flex-wrap gap-2">
    {canEditTape(tape) && (
      <>
        <button ...>Edit</button>
        <button ...>Delete</button>
      </>
    )}
    {scenario.isPublic && (
      <button
        type="button"
        disabled={reportedTapeIds.has(tape.id) || reportMutation.isPending}
        onClick={() => {
          if (!reportedTapeIds.has(tape.id)) {
            reportMutation.mutate({ tapeId: tape.id, scenarioSlug: slug! })
          }
        }}
        className="min-h-[44px] border border-border px-3 font-ui text-xs uppercase tracking-wide text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
      >
        {reportedTapeIds.has(tape.id) ? 'Reported' : 'Report'}
      </button>
    )}
  </div>
) : null}
```

Note: the `reportMutation` should track per-tape errors. Use a separate `reportErrors` state (`Map<string, string>`) if you need per-tape inline errors, or use a single `reportError` + `reportingTapeId` pair if simpler.

### Per-tape Error Pattern

Since `reportMutation.error` is a single value and there could theoretically be multiple tapes visible, track the erroring tape:

```tsx
const [reportingTapeId, setReportingTapeId] = useState<string | null>(null)

const reportMutation = useMutation({
  mutationFn: ({ tapeId, scenarioSlug }: { tapeId: string; scenarioSlug: string }) => {
    setReportingTapeId(tapeId)
    return reportTape({ tapeId, scenarioSlug })
  },
  onSuccess: (_data, vars) => {
    setReportedTapeIds(prev => {
      const next = new Set(prev)
      next.add(vars.tapeId)
      return next
    })
    setReportingTapeId(null)
  },
  onError: () => {
    setReportingTapeId(null)
  },
})
```

Then for the inline error, only show it when `reportMutation.isError && reportingTapeId === tape.id`.

### ReportTapeBody import in ScenarioPage

Add `reportTape` to the existing named import from `'../api/client'`:
```ts
import {
  ...,
  reportTape,
} from '../api/client'
```

Add to types import:
```ts
import type { ..., ReportTapeBody } from '../api/types'
```

`ReportTapeBody` is used only if you're being explicit about the mutation arg type; it's optional since TypeScript infers it.

### Migration Timestamp and Convention

Follow the existing naming convention: `YYYYMMDDHHMMSS_description.sql`. Use `20260413000000`.

Existing migrations (for context):
- `20260330160000_...` — Phase 1 schema
- `20260411000000_add_auth_ownership.sql` — story 2-1 (Epic 2)
- `20260412000000_add_is_public_to_scenarios.sql` — story 2-2

### No RLS on `tape_reports`

`tape_reports` is an append-only admin log. Enable RLS (`ALTER TABLE tape_reports ENABLE ROW LEVEL SECURITY`) but do NOT add any client-access policies — all reads/writes go through the Edge Function using the service role key. The Supabase dashboard bypasses RLS so Melissa can read reports directly.

### Testing Note

There are currently no Edge Function tests (only frontend unit/integration tests in `web/`). The regression check is:
- `cd web && npm test` — all 40 existing tests must pass
- No test fixtures construct `AppLayout`, `AppFooter`, or `ScenarioPage` at the layout level, so the flex-column change should be transparent

If a test does render `AppLayout` via a router setup, `AppFooter` will now appear; `a[href="..."]` won't cause failures, just ensure no snapshot tests break (project uses `@testing-library/react`, not snapshot testing).

### Deferred Work — Do Not Re-Raise

Items from `_bmad-output/implementation-artifacts/deferred-work.md` relevant to this story:
- CORS wildcard on all edge functions (including `report-tape`) — tracked, do not fix here
- DB error leakage in `DATABASE_ERROR` responses — tracked, do not fix here
- `@supabase/supabase-js` not in `web/package.json` — tracked; the project works despite this, do not add as part of this story

### Project Structure Notes

- `AppFooter.tsx` goes in `web/src/components/` (shared presentational) — same level as `AppHeader.tsx`
- `report-tape/` goes in `supabase/functions/report-tape/index.ts` — kebab-case directory, `index.ts` entry file
- Migration file goes in `supabase/migrations/` following `YYYYMMDDHHMMSS_description.sql`
- No new `web/src/features/` directory needed — this story only touches existing components and adds one new component
- The story adds one new DB table, one new edge function, one new frontend component, and extends two existing files (`AppLayout`, `ScenarioPage`)

### References

- Design decision source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Theme 6, "Report + Footer (#18)"
- UX convention (no toasts): Phase 1 UX-DR12 — "no success toasts; tape add confirmed by stack update"
- Edge function pattern (OPTIONS first, Zod, service key): `supabase/functions/add-tape/index.ts`
- `_shared` utilities: `cors.ts`, `errors.ts`, `zod.ts`, `auth.ts` — in `supabase/functions/_shared/`
- `supabaseFetch` pattern: `web/src/api/client.ts` — always use this for edge function calls, never raw `fetch`
- `isPersistedTape` utility: already defined in `ScenarioPage.tsx` — reuse, don't duplicate
- `canEditTape` helper: already in `ScenarioPage.tsx` — report button has different visibility rules (public scenario only, no ownership check)
- `AppHeader` styling reference: `web/src/components/AppHeader.tsx` — mirror the link styles for footer
- Previous story (2-4) learnings: `_bmad-output/implementation-artifacts/2-4-public-scenario-permissions.md` — single-file surgical changes work well; keep scope tight

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-5

### Debug Log References

No blockers encountered. Implementation followed story spec exactly.

### Completion Notes List

- Created `supabase/migrations/20260413000000_create_tape_reports.sql`: `tape_reports` table with UUID PK, `tape_id` FK (CASCADE DELETE), `scenario_slug`, `reported_at`. RLS enabled, no client policies (service-role-only access). Index on `tape_id`.
- Created `supabase/functions/report-tape/index.ts`: anonymous POST endpoint, Zod-validated `{ scenarioSlug, tapeId }`, inserts into `tape_reports`, returns `{ ok: true }`. Follows `add-tape` pattern (OPTIONS first, `serve`, `safeParse`, `jsonError`/`jsonOk`).
- Added `ReportTapeBody` and `ReportTapeResponse` types to `web/src/api/types.ts`.
- Added `reportTape()` function to `web/src/api/client.ts` using `supabaseFetch`.
- Created `web/src/components/AppFooter.tsx`: `BUY_ME_COFFEE_URL` constant, `<footer>` with `border-t border-border bg-background`, 48px height, centered "Buy me a coffee" link with focus-visible ring and hover transition.
- Updated `web/src/layout/AppLayout.tsx`: root div now `flex flex-col`, `<Outlet />` wrapped in `<div className="flex-1">`, `<AppFooter />` after it — footer sticks to bottom on short pages.
- Updated `web/src/pages/ScenarioPage.tsx`: added `reportedTapeIds` (Set state), `reportingTapeId` (string|null state), and `reportMutation` (useMutation). Tape action row restructured: Edit/Delete shown only for `canEditTape`, Report button shown only when `isPersistedTape && scenario.isPublic` (no auth check — anonymous reporting). Per-tape inline error shown when `reportMutation.isError && reportingTapeId === tape.id`.
- All 40 existing tests pass (no regressions). No test fixtures render `AppLayout`, so `AppFooter` addition is transparent to the test suite.

### File List

- `supabase/migrations/20260413000000_create_tape_reports.sql` — new
- `supabase/functions/report-tape/index.ts` — new
- `web/src/api/types.ts` — modified (added ReportTapeBody, ReportTapeResponse)
- `web/src/api/client.ts` — modified (added reportTape import types + function)
- `web/src/components/AppFooter.tsx` — new
- `web/src/layout/AppLayout.tsx` — modified (flex-col layout + AppFooter)
- `web/src/pages/ScenarioPage.tsx` — modified (reportTape import, reportedTapeIds/reportingTapeId state, reportMutation, Report button in tape list)

## Change Log

- 2026-04-13: Story 2.5 implemented — tape_reports DB table, report-tape edge function, AppFooter component (persistent "Buy me a coffee" footer), AppLayout flex-column update, Report button on public scenario tape rows with anonymous submit, session-scoped "Reported" state, and per-tape inline error on failure.
