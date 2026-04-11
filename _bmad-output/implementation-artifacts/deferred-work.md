# Deferred work

## Resolved (2026-03-30)

- **App entry vs story docs:** The SPA shell is wired in `web/src/main.tsx` → `RouterProvider` → `web/src/router.tsx` (`AppLayout`, routes). There is no `App.tsx` in this project; prefer citing **`router.tsx`**, **`layout/AppLayout.tsx`**, and **`pages/HomePage.tsx`** when updating older story files.

## Deferred from: code review of 6-3-long-tape-text-support.md (2026-04-11)

- **Session expiry while add panel is open** — if `user` becomes `null` (session expiry) after `addOpen` is already `true`, the add-tape panel stays open in an unauthenticated state. Epic 2 RLS/auth session work will address this holistically.

## Deferred from: code review of 6-2-unified-color-preset-swatches.md (2026-04-11)

- **`normalizeHex` in `ColorPresetRow` accepts non-hex strings without validation** — `normalizeHex` will produce values like `#foo` for garbage input; `isPresetColor` and comparisons may behave unexpectedly. Defensive input validation is a project-wide concern; deferred until a color validation utility is introduced.

## Deferred from: code review of spec-edit-and-delete-scenarios.md (2026-04-09)

- **DB error leakage:** `DATABASE_ERROR` responses from all edge functions return the raw Supabase/Postgres error message (e.g. constraint names, schema info). Consider logging server-side and returning a generic message to callers. Pre-existing across all edge functions.
- **CORS wildcard on mutation endpoints:** `corsHeaders` applies `Access-Control-Allow-Origin: *` on OPTIONS for all edge functions, including destructive ones. Pre-existing pattern — revisit when auth is added.
- **localStorage ops have no try/catch:** `getKnownScenarioSlugs`, `rememberScenarioSlug`, and `forgetScenarioSlug` can throw in private-browsing or storage-blocked contexts. Pre-existing in `knownScenarios.ts`.
- **`updated_at` set client-side:** `update-scenario` sets `updated_at: new Date().toISOString()` using the edge function's wall clock instead of a DB `ON UPDATE` trigger. Minor clock-skew risk under concurrent renames. Consider adding an `ON UPDATE` trigger to `scenarios` (tapes already have one).

## Deferred from: code review of 1-3-login-gate-on-tape-and-scenario-creation.md (2026-04-11)

- **Double `useAuth()` subscription per component** — `TapeCreatorPanel`, `HomePage`, and `ScenarioPage` each call `useAuth()` directly AND `useLoginGate()` also calls it internally. Both calls resolve to the same React context value; no functional impact. Revisit if hook API is redesigned to expose `user` directly.
- **ScenarioPage early-return paths don't render the LoginModal** — Three early-return paths (`!slug`, `!configured`, loading/error states) precede the return that renders the gate. Currently unreachable since the gate is only reachable after all guards pass. Fragile if guard order changes. Revisit if early-return conditions are refactored.



- **`LoginModal` state update after unmount** — If the user closes the modal or navigates away while the `signInWithOtp` request is in flight, the promise still resolves and calls `setModalState`/`setErrorMessage` on an unmounted component. React 18+ suppresses the warning but the state update is wasted. Fix: use an `AbortController` or an `isMounted` ref guard on the async handler. Low priority — no crash, no data loss.
- **`signOut()` errors are silently swallowed** — `signOut` awaits `supabaseClient.auth.signOut()` with no try/catch. On network/API failure the header continues showing the logged-in state with no feedback to the user. Fix: wrap in try/catch and surface an error message. Deferred — failure here is very rare and non-destructive (session expires naturally).
- **Unhandled `onAuthStateChange` events leave context stale** — Events outside the handled set (e.g. `USER_UPDATED`, `PASSWORD_RECOVERY`) do not update `user`/`session` in context. Currently only email/magic-link auth is used so this is safe. Revisit if additional auth methods or user-update flows are added.
- **`user.email` can be null in `AppHeader`** — The header renders `user.email` directly; for auth providers or identities where email is null the label is empty. Low risk while only magic-link (email) auth is in use. Add a fallback label if non-email providers are introduced.
- **OTP error messages may enable email enumeration** — Supabase's raw error messages (e.g. "Email not confirmed") can reveal whether an account exists. Mitigate by returning a generic "If this address is registered, you'll receive a link" message. Deferred — acceptable risk for current user base; revisit before public launch.
- **React Strict Mode double-mount on `/auth/callback`** — In development, Strict Mode mounts effects twice, which can cause two overlapping `onAuthStateChange` subscriptions + `getSession()` calls on the callback page. The `didNavigate` ref guard prevents double-navigation but a second subscription fires. No functional impact in production (Strict Mode is dev-only). The fix (abort flag on the second mount) is a polish item.
- **`@supabase/supabase-js` not in `package.json`** — The package is installed in `node_modules` (added during Phase 1 / Story 1.1) but not declared in `web/package.json`. A clean `npm install` from scratch would fail. Tracked here as a reminder to add it explicitly. Low urgency while the lockfile is committed. Fix: `npm install @supabase/supabase-js` in `web/`.



- **Unused `_userId` bindings in no-op edge functions:** Intentional forward-wiring for Epic 2 permission checks; `_` prefix is the Deno convention for intentionally unused variables. Revisit when Epic 2 permission enforcement is added.
- **`owner_id`/`author_id` exposed in public API responses:** Both IDs are now included in `get-scenario-by-slug` and `list-scenarios` responses. Needs a product decision on PII exposure and correlation before Epic 2 ships publicly.
- **Per-request `createClient` in `extractUserId`:** A new Supabase client is created for every authenticated request. Revisit if latency becomes measurable under real load.
- **Ownership is unenforced metadata:** The FK columns record who created content but nothing enforces that only the owner can edit/delete it. Intentionally deferred to Epic 2 RLS/permission work.
- **`mapScenario`/`mapTape` use truthiness for optional ID fields:** `owner_id`/`author_id` are omitted when falsy. Explicit `!= null` check would be more defensive. Low risk for UUID columns.
- **`extractUserId` called before env var check in some functions:** Minor ordering issue — the helper is self-guarded and will return null if env vars are missing. No functional impact.



- ~~Story file list references `web/src/App.tsx`~~ — see **Resolved** above.
