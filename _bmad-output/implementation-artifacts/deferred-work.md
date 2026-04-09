# Deferred work

## Resolved (2026-03-30)

- **App entry vs story docs:** The SPA shell is wired in `web/src/main.tsx` → `RouterProvider` → `web/src/router.tsx` (`AppLayout`, routes). There is no `App.tsx` in this project; prefer citing **`router.tsx`**, **`layout/AppLayout.tsx`**, and **`pages/HomePage.tsx`** when updating older story files.

## Deferred from: code review of spec-edit-and-delete-scenarios.md (2026-04-09)

- **DB error leakage:** `DATABASE_ERROR` responses from all edge functions return the raw Supabase/Postgres error message (e.g. constraint names, schema info). Consider logging server-side and returning a generic message to callers. Pre-existing across all edge functions.
- **CORS wildcard on mutation endpoints:** `corsHeaders` applies `Access-Control-Allow-Origin: *` on OPTIONS for all edge functions, including destructive ones. Pre-existing pattern — revisit when auth is added.
- **localStorage ops have no try/catch:** `getKnownScenarioSlugs`, `rememberScenarioSlug`, and `forgetScenarioSlug` can throw in private-browsing or storage-blocked contexts. Pre-existing in `knownScenarios.ts`.
- **`updated_at` set client-side:** `update-scenario` sets `updated_at: new Date().toISOString()` using the edge function's wall clock instead of a DB `ON UPDATE` trigger. Minor clock-skew risk under concurrent renames. Consider adding an `ON UPDATE` trigger to `scenarios` (tapes already have one).

## Deferred from: code review of 1-6-add-appheader-and-home-layout-with-command-center-structure.md (2026-03-30)

- ~~Story file list references `web/src/App.tsx`~~ — see **Resolved** above.
