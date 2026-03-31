# Test Automation Summary

**Project:** caution-bmad  
**Date:** 2026-03-30

## Generated Tests

### API Tests

- [x] `tests/api/edge-functions.spec.ts` — **Supabase Edge Functions** (`create-scenario`, `get-scenario-by-slug`, `list-scenarios`, `add-tape`, `update-tape`, `delete-tape`)  
  - **Integration:** full flow with real HTTP + anon key (creates a scenario, exercises get/list/add idempotency/update/delete, leaves one tape on the scenario).  
  - **Errors:** validation (`create-scenario` empty name; `update-tape` / `delete-tape` non-UUID `tapeId`), `get-scenario-by-slug` missing slug / unknown slug, `add-tape` missing scenario, `list-scenarios` empty `slugs` → `[]`.

### E2E Tests

- [x] `tests/e2e/home-create-open-add-tape.spec.ts` — **Home → create scenario → open from Library → add tape → both tapes in stack** (uses `tests/e2e/helpers.ts`).  
- [x] `tests/e2e/fr15-fr21.spec.ts` — **epics.md FR15–FR21** (library, cards, new scenario, share URL, deep link + add tape):  
  - **FR15–FR17, FR16:** Library heading + `Scenario library` list; card shows name and provocative one-tape line; link opens scenario.  
  - **FR18:** From library, **New scenario** shows tape creator (Warning Text) again.  
  - **FR19:** **Share URL** input value ends with `/s/:slug`.  
  - **FR20–FR21:** New browser context visits `/s/:slug` cold; scenario loads; **Add tape** adds second row in stack.

## Framework

- **Vitest** (`vitest`) — `npm run test:api`; loads `web/.env` via `tests/api/setup.ts`.  
- **Playwright** (`@playwright/test`) — `npm run test:e2e`; Vite on port **5199**.

## Coverage

- **API:** all six scenario/tape Edge Functions exercised (happy path + selected 4xx cases).  
- **UI:** 1 critical path (create → library → reopen → add tape).

## Prerequisites

- `web/.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.  
- API integration tests are **skipped** when those vars are missing (`describe.skipIf`).

## Next Steps

- Run `npm run test:api` and `npm run test:e2e` in CI with secrets for `web/.env`.  
- Optionally add tests for `405` method mismatches or rate limits if policies change.
