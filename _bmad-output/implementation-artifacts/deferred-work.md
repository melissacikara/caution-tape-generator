# Deferred work

## Resolved (2026-03-30)

- **App entry vs story docs:** The SPA shell is wired in `web/src/main.tsx` → `RouterProvider` → `web/src/router.tsx` (`AppLayout`, routes). There is no `App.tsx` in this project; prefer citing **`router.tsx`**, **`layout/AppLayout.tsx`**, and **`pages/HomePage.tsx`** when updating older story files.

## Deferred from: code review of 6-2-unified-color-preset-swatches.md (2026-04-11)

- **`normalizeHex` in `ColorPresetRow` accepts non-hex strings without validation** — `normalizeHex` will produce values like `#foo` for garbage input; `isPresetColor` and comparisons may behave unexpectedly. Defensive input validation is a project-wide concern; deferred until a color validation utility is introduced.

## Deferred from: code review of spec-edit-and-delete-scenarios.md (2026-04-09)

- **DB error leakage:** `DATABASE_ERROR` responses from all edge functions return the raw Supabase/Postgres error message (e.g. constraint names, schema info). Consider logging server-side and returning a generic message to callers. Pre-existing across all edge functions.
- **CORS wildcard on mutation endpoints:** `corsHeaders` applies `Access-Control-Allow-Origin: *` on OPTIONS for all edge functions, including destructive ones. Pre-existing pattern — revisit when auth is added.
- **localStorage ops have no try/catch:** `getKnownScenarioSlugs`, `rememberScenarioSlug`, and `forgetScenarioSlug` can throw in private-browsing or storage-blocked contexts. Pre-existing in `knownScenarios.ts`.
- **`updated_at` set client-side:** `update-scenario` sets `updated_at: new Date().toISOString()` using the edge function's wall clock instead of a DB `ON UPDATE` trigger. Minor clock-skew risk under concurrent renames. Consider adding an `ON UPDATE` trigger to `scenarios` (tapes already have one).

## Deferred from: code review of 1-1-supabase-auth-setup-and-user-schema.md (2026-04-11)

- **Unused `_userId` bindings in no-op edge functions:** Intentional forward-wiring for Epic 2 permission checks; `_` prefix is the Deno convention for intentionally unused variables. Revisit when Epic 2 permission enforcement is added.
- **`owner_id`/`author_id` exposed in public API responses:** Both IDs are now included in `get-scenario-by-slug` and `list-scenarios` responses. Needs a product decision on PII exposure and correlation before Epic 2 ships publicly.
- **Per-request `createClient` in `extractUserId`:** A new Supabase client is created for every authenticated request. Revisit if latency becomes measurable under real load.
- **Ownership is unenforced metadata:** The FK columns record who created content but nothing enforces that only the owner can edit/delete it. Intentionally deferred to Epic 2 RLS/permission work.
- **`mapScenario`/`mapTape` use truthiness for optional ID fields:** `owner_id`/`author_id` are omitted when falsy. Explicit `!= null` check would be more defensive. Low risk for UUID columns.
- **`extractUserId` called before env var check in some functions:** Minor ordering issue — the helper is self-guarded and will return null if env vars are missing. No functional impact.



- ~~Story file list references `web/src/App.tsx`~~ — see **Resolved** above.
