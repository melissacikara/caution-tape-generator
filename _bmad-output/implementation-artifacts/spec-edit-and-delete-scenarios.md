---
title: 'Edit and delete scenarios'
type: 'feature'
created: '2026-04-07'
status: 'done'
baseline_commit: '3a98492c352132ac49f05db46173dea219cac1e0'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users can view and add tapes to scenarios, but they cannot rename a scenario or remove one they no longer want — the scenario entity is immutable once created.

**Approach:** Add `update-scenario` and `delete-scenario` Edge Functions, wire client API functions, and surface an inline name-edit control and a delete-with-confirm flow in `ScenarioPage`. On successful delete, remove the slug from device storage and navigate home.

## Boundaries & Constraints

**Always:**
- Same anonymous link-based access model as tapes: anyone with the scenario URL can edit the name or delete the scenario (no auth, no ownership)
- Confirm sheet required before permanent delete (same `DeleteConfirmSheet` component already used for tapes)
- Edge functions follow existing project patterns: POST body, Zod validation, `_shared` helpers, camelCase JSON boundary, snake_case in DB
- On delete: remove slug from `knownScenarios` in localStorage, invalidate all scenario queries, navigate to `/`
- On rename: optimistic update — update query cache immediately, rollback on error; invalidate both `bySlug` and `list` keys on settle

**Ask First:** None.

**Never:**
- Do not delete tapes separately — `DELETE CASCADE` on the DB handles child rows (this is how the schema is set up, matches existing migrations)
- Do not add pagination, ownership, or auth checks
- Do not modify existing tape edit/delete flows

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Rename happy path | `scenarioSlug` + `name` (non-empty, ≤500 chars) | 200 `{ scenario: ScenarioDto }`, optimistic name visible immediately | N/A |
| Rename empty name | User clears input | Edit save button disabled; no request sent | Input validation, no API call |
| Rename server failure | Valid input, DB error | Rollback to previous name; inline error message shown | Inline error, user can retry |
| Delete happy path | `scenarioSlug` present | 200 `{ ok: true }`, slug removed from localStorage, navigate to `/` | N/A |
| Delete server failure | DB error | Sheet stays open, error message shown | Inline error in confirm sheet |
| Scenario not found | Invalid slug in update/delete | 404 from Edge Function | `ApiError` surfaced in UI |

</frozen-after-approval>

## Code Map

- `supabase/functions/update-scenario/index.ts` -- new Edge Function: rename scenario by slug
- `supabase/functions/delete-scenario/index.ts` -- new Edge Function: delete scenario by slug (tapes deleted via DB cascade)
- `web/src/api/types.ts` -- add `UpdateScenarioBody`, `UpdateScenarioResponse`, `DeleteScenarioBody`, `DeleteScenarioResponse`
- `web/src/api/client.ts` -- add `updateScenario`, `deleteScenario` client functions
- `web/src/lib/knownScenarios.ts` -- add `forgetScenarioSlug` to remove a slug from localStorage
- `web/src/pages/ScenarioPage.tsx` -- add rename inline UI in scenario header + delete scenario button + confirm sheet

## Tasks & Acceptance

**Execution:**
- [x] `supabase/functions/update-scenario/index.ts` -- CREATE -- POST handler accepting `{ scenarioSlug, name }`, validates with Zod, updates `scenarios.name` + `updated_at`, returns `{ scenario: ScenarioDto }`
- [x] `supabase/functions/delete-scenario/index.ts` -- CREATE -- POST handler accepting `{ scenarioSlug }`, deletes scenario row (tapes cascade), returns `{ ok: true }`
- [x] `web/src/api/types.ts` -- ADD types `UpdateScenarioBody`, `UpdateScenarioResponse`, `DeleteScenarioBody`, `DeleteScenarioResponse`
- [x] `web/src/api/client.ts` -- ADD `updateScenario` and `deleteScenario` functions following existing `supabaseFetch` pattern
- [x] `web/src/lib/knownScenarios.ts` -- ADD `forgetScenarioSlug(slug)` that removes a single slug from the localStorage array
- [x] `web/src/pages/ScenarioPage.tsx` -- ADD: (1) inline rename — pencil/edit button next to scenario name that opens an input; save/cancel buttons; optimistic update with rollback; (2) delete scenario button in header area; uses existing `DeleteConfirmSheet`; on success calls `forgetScenarioSlug`, invalidates queries, navigates to `/`

**Acceptance Criteria:**
- Given a scenario page, when I click Edit name, then the name becomes an editable input field with Save and Cancel controls
- Given I save a new name, when the request succeeds, then the header reflects the new name immediately (optimistic) and is confirmed by the server response
- Given a rename fails, when the server returns an error, then the original name is restored and an inline error message is visible
- Given I click Delete scenario, when the confirm sheet appears and I confirm, then the scenario is permanently deleted, the slug is removed from this device's known scenarios, and I am navigated to the home page
- Given a delete fails, when the server returns an error, then the confirm sheet stays open with an error message and the scenario is not removed
- Given an empty scenario name in the edit input, when I try to save, then the Save button is disabled and no request is sent

## Spec Change Log

## Verification

**Commands:**
- `cd web && npm run build` -- expected: zero TypeScript errors, clean build

**Manual checks (if no CLI):**
- Open a scenario page; verify Edit name and Delete scenario controls appear in the header
- Rename a scenario; verify the name updates in the header and in the scenario library card
- Delete a scenario; verify redirect to home and the card is gone from the library

## Suggested Review Order

**Edge function contracts**

- Entry point: POST body, Zod `.trim()` + min/max, DB update, 404 guard
  [`update-scenario/index.ts:10`](../../supabase/functions/update-scenario/index.ts#L10)

- Symmetrical delete; relies on DB CASCADE — no tape cleanup needed
  [`delete-scenario/index.ts:10`](../../supabase/functions/delete-scenario/index.ts#L10)

**Client API layer**

- Four new types; `DeleteScenarioResponse.ok: true` (not `boolean`) for precision
  [`types.ts:65`](../../web/src/api/types.ts#L65)

- Two new fetch wrappers following `supabaseFetch` pattern
  [`client.ts:120`](../../web/src/api/client.ts#L120)

**Rename flow**

- Optimistic update, cache rollback, input reset on error — key design
  [`ScenarioPage.tsx:216`](../../web/src/pages/ScenarioPage.tsx#L216)

- Inline input; Save disabled when trimmed empty; Enter/Escape shortcuts
  [`ScenarioPage.tsx:411`](../../web/src/pages/ScenarioPage.tsx#L411)

**Delete flow**

- Success sequence: forget slug → invalidate all → navigate home
  [`ScenarioPage.tsx:252`](../../web/src/pages/ScenarioPage.tsx#L252)

- `DeleteConfirmSheet` wired for scenario; error surfaced inline
  [`ScenarioPage.tsx:543`](../../web/src/pages/ScenarioPage.tsx#L543)

**State helper**

- Removes single slug from localStorage array on scenario delete
  [`knownScenarios.ts:21`](../../web/src/lib/knownScenarios.ts#L21)

**Peripherals (out-of-spec additions)**

- `/about` route registered
  [`router.tsx:14`](../../web/src/router.tsx#L14)

- About nav link added to header
  [`AppHeader.tsx:24`](../../web/src/components/AppHeader.tsx#L24)

- Static About page content
  [`AboutPage.tsx:1`](../../web/src/pages/AboutPage.tsx#L1)
