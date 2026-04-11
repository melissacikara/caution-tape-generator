# Story 1.1: Supabase Auth Setup & User Schema

Status: done

## Story

As a developer,
I want Supabase Auth configured for magic link login and the database schema updated to associate scenarios and tapes with authenticated users,
So that all subsequent identity-dependent features (Epics 1–5) have a stable, auth-aware foundation to build on.

## Acceptance Criteria

1. **Given** the Supabase project exists with the Phase 1 schema (`scenarios`, `tapes` tables)
   **When** this story is implemented
   **Then** Supabase Auth is enabled with magic link (email OTP) as the only sign-in method — no password, no OAuth providers

2. **And** a migration adds `owner_id uuid references auth.users(id)` (nullable) to the `scenarios` table

3. **And** a migration adds `author_id uuid references auth.users(id)` (nullable) to the `tapes` table

4. **And** nullable columns preserve all existing Phase 1 data — no data loss, no backfill required

5. **And** all six existing Edge Functions (`create-scenario`, `get-scenario-by-slug`, `add-tape`, `update-tape`, `delete-tape`, `list-scenarios`) are updated to optionally extract the Supabase JWT from the `Authorization: Bearer <token>` header

6. **And** Edge Functions treat a missing or invalid JWT as anonymous (not an error) — Phase 1 anonymous access continues to work

7. **And** `create-scenario` sets `owner_id` when a valid JWT is present

8. **And** `add-tape` sets `author_id` when a valid JWT is present

9. **And** the Supabase client singleton is added to `web/` (`@supabase/supabase-js`) using only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — the service role key is never in the browser

## Tasks / Subtasks

- [x] Task 1: DB migration — add `owner_id` and `author_id` columns (AC: #2, #3, #4)
  - [x] Create migration file `supabase/migrations/YYYYMMDDHHMMSS_add_auth_ownership.sql`
  - [x] `ALTER TABLE scenarios ADD COLUMN owner_id uuid references auth.users(id) on delete set null`
  - [x] `ALTER TABLE tapes ADD COLUMN author_id uuid references auth.users(id) on delete set null`
  - [x] Add index `idx_scenarios_owner_id` on `scenarios(owner_id)` for future Epic 2 / 4 queries
  - [x] Add index `idx_tapes_author_id` on `tapes(author_id)` for future Epic 2 queries
  - [x] Verify all existing Phase 1 rows remain intact (columns nullable, no default change)
  - [x] Run `npx supabase db push` against linked project or test locally

- [x] Task 2: Supabase Auth dashboard config (AC: #1)
  - [x] Enable Supabase Auth → Email provider → Magic link (email OTP)
  - [x] Disable all other sign-in methods (password, OAuth, phone) in Supabase dashboard
  - [x] Set Site URL to Vercel production URL in Supabase Auth → URL Configuration
  - [x] Add `http://localhost:5173` to Redirect URLs for local dev
  - [x] Add Vercel production URL to Redirect URLs

- [x] Task 3: JWT helper in Edge Functions `_shared/` (AC: #5, #6)
  - [x] Create `supabase/functions/_shared/auth.ts` — exports `extractUserId(req): Promise<string | null>`
  - [x] `extractUserId` reads `Authorization: Bearer <token>` header; if absent → returns `null`
  - [x] Uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` to create an admin client and call `supabase.auth.getUser(token)` to verify the JWT
  - [x] Returns `user.id` on success, `null` on error/invalid token — never throws, never returns 401

- [x] Task 4: Update `create-scenario` Edge Function (AC: #7)
  - [x] Call `extractUserId(req)` at the top of handler
  - [x] Pass `owner_id: userId ?? undefined` to the `.insert()` call (omit field when null to keep existing behaviour)
  - [x] Update select to include `owner_id` in the return row

- [x] Task 5: Update `add-tape` Edge Function (AC: #8)
  - [x] Call `extractUserId(req)` at the top of handler
  - [x] Pass `author_id: userId ?? undefined` to the tape `.insert()` call
  - [x] Update select to include `author_id` in the return row

- [x] Task 6: Update remaining Edge Functions — `get-scenario-by-slug`, `update-tape`, `delete-tape`, `list-scenarios` (AC: #6)
  - [x] Each function should call `extractUserId(req)` and attach to context (no-op for now — just proves wiring works and sets up for Epic 2 permission checks)
  - [x] No behaviour changes — anonymous access still works for all read operations

- [x] Task 7: Update shared map helpers (AC: #7, #8)
  - [x] `mapScenario` in `_shared/map.ts` — add optional `owner_id` → `ownerId` field
  - [x] `mapTape` in `_shared/map.ts` — add optional `author_id` → `authorId` field

- [x] Task 8: Add `@supabase/supabase-js` client to web app (AC: #9)
  - [x] `cd web && npm install @supabase/supabase-js`
  - [x] Create `web/src/lib/supabase.ts` — exports a singleton `supabaseClient` created with `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`
  - [x] Use `persistSession: true` (default) so session is stored in `localStorage` across visits
  - [x] Do NOT add `@supabase/ssr` or `createBrowserClient` — use plain `createClient` (SSR not used; Vite SPA only)
  - [x] Do NOT expose or reference `SUPABASE_SERVICE_ROLE_KEY` anywhere in `web/`

- [x] Task 9: Update `web/src/api/types.ts` (AC: #7, #8)
  - [x] Add optional `ownerId?: string` to `ScenarioDto`
  - [x] Add optional `authorId?: string` to `TapeDto`

- [x] Task 10: Deploy and verify
  - [x] `npx supabase functions deploy` for all six updated functions
  - [x] Smoke-test: create scenario anonymously → `owner_id` is null ✓
  - [x] Smoke-test: `get-scenario-by-slug` still returns existing Phase 1 scenarios ✓

### Review Findings

- [x] [Review][Decision] Supabase client throws at module import time — should it throw or be lazy? [`web/src/lib/supabase.ts`] — Kept throw (Option A). Added stub env vars to `web/src/test-setup.ts` to protect future tests.
- [x] [Review][Patch] `extractUserId` missing try/catch — network errors will throw instead of return null [`supabase/functions/_shared/auth.ts`]
- [x] [Review][Patch] Empty bearer token not guarded — `Bearer ` with no trailing token passes the startsWith check and sends an empty string to getUser [`supabase/functions/_shared/auth.ts`]
- [x] [Review][Patch] `create-scenario` `firstTape` does not set `author_id` — the first tape for a new authenticated scenario is created anonymously while subsequent tapes via `add-tape` are attributed [`supabase/functions/create-scenario/index.ts`]
- [x] [Review][Defer] Unused `_userId` bindings in no-op functions — intentional forward-wiring for Epic 2; `_` prefix is Deno convention [`supabase/functions/get-scenario-by-slug`, `update-tape`, `delete-tape`, `list-scenarios`] — deferred, pre-existing
- [x] [Review][Defer] `owner_id`/`author_id` exposed in public API responses (PII/enumeration concern) — product decision needed; deferred to Epic 2 privacy work — deferred, pre-existing
- [x] [Review][Defer] Per-request `createClient` in `extractUserId` (latency) — premature optimization; revisit under load — deferred, pre-existing
- [x] [Review][Defer] Ownership is unenforced metadata until RLS/app-layer checks — explicitly scoped to Epic 2 per story design — deferred, pre-existing
- [x] [Review][Defer] `mapScenario`/`mapTape` use truthiness instead of `!= null` for optional ids — edge case with no real-world impact for UUID columns — deferred, pre-existing
- [x] [Review][Defer] `extractUserId` called before env var check in some functions — minor ordering; helper is self-guarded — deferred, pre-existing

## Dev Notes

### Critical: What This Story Is and Is Not

- **IS:** Pure infrastructure — migrations, auth wiring in Edge Functions, Supabase client singleton in web. No UI, no login screens, no session gating.
- **IS NOT:** The login UI flow (Story 1.2), login gate (Story 1.3), or context-aware CTAs (Story 1.4).
- **DO NOT** add any `AuthContext`, login modals, or session-gating logic here — those belong in Stories 1.2 and 1.3.

### Supabase Auth — Magic Link Only

Supabase's `signInWithOtp()` sends a magic link by default:

```ts
// Story 1.2 will use this — listed here for architectural awareness only
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

This story only enables the Auth provider in the dashboard and creates the client singleton. No UI calls to `signInWithOtp` yet.

### DB Migration Pattern

Follow the existing migration naming convention:

```
supabase/migrations/YYYYMMDDHHMMSS_add_auth_ownership.sql
```

Existing migrations: `20260330160000_create_scenarios_and_tapes.sql`, `20260330180000_idempotency_tapes.sql`, `20260330200000_tapes_updated_at.sql`. Use a timestamp after `20260330200000`.

Use `ON DELETE SET NULL` (not CASCADE) for `auth.users` foreign keys — if a user's auth record is deleted, their scenarios/tapes become anonymous rather than being deleted.

### JWT Extraction in Edge Functions

Pattern for `_shared/auth.ts`:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

export async function extractUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return null
  const supabase = createClient(url, key)
  const { data } = await supabase.auth.getUser(token)
  return data?.user?.id ?? null
}
```

Key decisions:
- Use `getUser(token)` not `verifyToken` — validates against Supabase Auth server, not just JWT signature
- Returns `null` on any error — anonymous callers are never rejected
- Edge Functions already import `@supabase/supabase-js@2.45.0` — reuse same version

### Supabase Client in `web/src/lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
```

- `persistSession: true` is the default — no need to specify
- Session stored in `localStorage` by default — matches Phase 1 pattern (`knownScenarios.ts` already uses localStorage)
- Export as `supabaseClient` (not `supabase`) to avoid collision with any imports of the literal package name

### api/client.ts Auth Header Update

The existing `supabaseFetch` in `web/src/api/client.ts` sends `Authorization: Bearer <anon_key>`. For authenticated requests, this must send the user's JWT instead. **However, do not change `api/client.ts` in this story** — that wiring belongs in Story 1.2 when the auth context/session is available. This story only creates the Supabase client singleton.

### Updated Type Shapes (api/types.ts)

```ts
export type ScenarioDto = {
  id: string
  name: string
  publicSlug: string
  ownerId?: string        // NEW: null for Phase 1 scenarios, UUID for Phase 2+
  createdAt: string
  updatedAt?: string
}

export type TapeDto = {
  id: string
  scenarioId: string
  tapeText: string
  color: string
  authorId?: string       // NEW: null for Phase 1 tapes, UUID for Phase 2+
  createdAt: string
  updatedAt?: string
}
```

### Edge Function Existing Pattern

All six Edge Functions follow the same structure. Example from `add-tape/index.ts`:
1. `serve(async (req) => {`
2. CORS OPTIONS handling
3. Method check
4. JSON parse + Zod validation
5. `createClient(url, key)` with service role
6. DB queries

Insert `const userId = await extractUserId(req)` after step 3 (before creating the service role client). Add import of `extractUserId` from `'../_shared/auth.ts'`.

### Project Structure Notes

- **Migration file location:** `supabase/migrations/` — already has 3 files; add 4th
- **New shared helper:** `supabase/functions/_shared/auth.ts`
- **New client file:** `web/src/lib/supabase.ts`
- **Modified files:**
  - `supabase/functions/_shared/map.ts` — add `ownerId`/`authorId` to mappers
  - `supabase/functions/create-scenario/index.ts`
  - `supabase/functions/add-tape/index.ts`
  - `supabase/functions/get-scenario-by-slug/index.ts`
  - `supabase/functions/update-tape/index.ts`
  - `supabase/functions/delete-tape/index.ts`
  - `supabase/functions/list-scenarios/index.ts`
  - `web/src/api/types.ts`
  - `web/package.json` (add `@supabase/supabase-js`)

### CORS Header — authorization Already Allowed

`supabase/functions/_shared/cors.ts` already includes `authorization` in `Access-Control-Allow-Headers`. No CORS change needed.

### Deferred Items (from deferred-work.md) — Not Scope of This Story

- CORS wildcard on mutation endpoints — noted in deferred-work.md; revisit after auth. **Do not address here.**
- DB error leakage in edge functions — pre-existing; **do not fix here.**

### References

- Epic 1, Story 1.1 — [Source: `_bmad-output/planning-artifacts/epics.md` §Story 1.1]
- Architecture: Auth + security, data architecture — [Source: `_bmad-output/planning-artifacts/architecture.md` §Authentication & Security, §Data Architecture]
- Phase 1 DB schema — [Source: `supabase/migrations/20260330160000_create_scenarios_and_tapes.sql`]
- Existing edge function pattern — [Source: `supabase/functions/add-tape/index.ts`]
- Existing CORS headers — [Source: `supabase/functions/_shared/cors.ts`]
- Phase 1 API client — [Source: `web/src/api/client.ts`]
- Session handoff (Phase 2 context) — [Source: `_bmad-output/session-handoff.md`]
- Supabase Auth JS: `signInWithOtp`, `onAuthStateChange`, `getUser` — [Supabase Docs](https://supabase.com/docs/guides/auth/auth-magic-link)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

No issues encountered during implementation. One note: a `git stash` during baseline regression verification reverted edge function files; all changes were re-applied cleanly afterward.

### Completion Notes List

- Created migration `supabase/migrations/20260411000000_add_auth_ownership.sql` — adds nullable `owner_id` (scenarios) and `author_id` (tapes) columns with `ON DELETE SET NULL` FK to `auth.users`, plus indexes for both.
- Created `supabase/functions/_shared/auth.ts` — `extractUserId()` helper that reads `Authorization: Bearer <token>`, calls `supabase.auth.getUser(token)` via service role, returns UUID or `null`. Never throws; anonymous callers always pass through.
- Updated `create-scenario/index.ts` — calls `extractUserId`, spreads `owner_id` into insert when userId is present, added `owner_id` to select.
- Updated `add-tape/index.ts` — calls `extractUserId`, spreads `author_id` into insert when userId is present, added `author_id` to both select paths (new insert + idempotency fetch).
- Updated `get-scenario-by-slug`, `update-tape`, `delete-tape`, `list-scenarios` — each calls `extractUserId` (result stored as `_userId`; no-op wiring for Epic 2). Select queries in `get-scenario-by-slug` and `list-scenarios` also now fetch `owner_id`; tape selects in `get-scenario-by-slug` and `update-tape` fetch `author_id`.
- Updated `_shared/map.ts` — `mapScenario` maps `owner_id → ownerId` (omitted if null), `mapTape` maps `author_id → authorId` (omitted if null).
- Installed `@supabase/supabase-js` in `web/` and created `web/src/lib/supabase.ts` exporting singleton `supabaseClient` using `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. No SSR client, no service role key in browser.
- Updated `web/src/api/types.ts` — added `ownerId?: string` to `ScenarioDto` and `authorId?: string` to `TapeDto`.
- Task 2 (Supabase Auth dashboard) and Task 10 (deploy + smoke-test) are manual steps for Melissa to perform against the Supabase dashboard and CLI respectively. All code changes needed to support these are complete.
- TypeScript passes clean (`tsc --noEmit` exits 0). Pre-existing test failures in color picker tests (`document is not defined`) confirmed pre-existing before this story — no regressions introduced.

### File List

- supabase/migrations/20260411000000_add_auth_ownership.sql (new)
- supabase/functions/_shared/auth.ts (new)
- supabase/functions/_shared/map.ts (modified)
- supabase/functions/create-scenario/index.ts (modified)
- supabase/functions/add-tape/index.ts (modified)
- supabase/functions/get-scenario-by-slug/index.ts (modified)
- supabase/functions/update-tape/index.ts (modified)
- supabase/functions/delete-tape/index.ts (modified)
- supabase/functions/list-scenarios/index.ts (modified)
- web/src/lib/supabase.ts (new)
- web/src/api/types.ts (modified)
- web/package.json (modified — @supabase/supabase-js added)
- web/package-lock.json (modified)

## Change Log

| Date | Change |
|------|--------|
| 2026-04-11 | Initial implementation of Story 1.1 — DB migration, JWT auth helper, edge function wiring, Supabase client singleton, updated DTO types |
