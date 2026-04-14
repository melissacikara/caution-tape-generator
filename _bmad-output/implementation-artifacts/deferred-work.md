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

## Deferred from: code review of 2-1-creator-ownership-and-contributor-permissions (2026-04-12)

- **Silent success on zero-row delete (race condition):** `delete-tape` and `delete-scenario` no longer verify that the destructive query actually removed a row (pre-fetch pattern replaced the row-count check). If a tape/scenario is deleted between the pre-fetch and the actual delete, the function returns `{ ok: true }` for a no-op. Acceptable idempotent behavior for this pattern; revisit if stricter delete semantics are required.
- **Non-atomic TOCTOU on ownership check:** The ownership pre-fetch (SELECT) and the mutation (UPDATE/DELETE) are separate round-trips — not wrapped in a transaction. A concurrent request could change row ownership between the check and the operation. Architectural limitation of the current Supabase client usage; revisit if transaction support is added.

## Deferred from: code review of 6-4-save-tape-to-camera-roll (2026-04-11)- **`parseHex` accepts non-hex characters and propagates NaN into canvas `fillStyle`:** Copied verbatim from `TapeRenderer.tsx` per story spec to maintain identical behavior. Values like `#GGGGGG` produce `NaN` channel math and an invalid color string. The UI always provides valid hex via `ColorPickerSwatch`, so real-world impact is low; fix together with `TapeRenderer` if input validation is ever added.
- **Canvas export produces potentially very large images for max-length tape text:** `repeats` is capped at 64 per spec, but each segment grows with text length; a 2000-char locked tape could produce a canvas exceeding 500k × 44px. Browser canvas size limits (typically 32k–65k px wide) may silently clamp or blank the result. Investigate a max-width clamp or resolution reduction for long tapes if users hit blank exports.

## Deferred from: code review of 2-3-public-private-toggle (2026-04-12)
- **`extractUserId` called before env check in `toggle-scenario-visibility`:** Auth is checked before `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are validated. If env vars are missing and `extractUserId` returns null (which it can when the Supabase URL is absent), the function returns 401 UNAUTHORIZED instead of the more accurate 500 SERVER_CONFIG. Minor operational/debugging concern only — no user-facing impact in normal deployments.

## Deferred from: security audit of 4-5-security-and-abuse-posture-review-for-anonymous-sharing.md (2026-04-13)

- **No application-level rate limiting on any Edge Function:** All Edge Functions (`create-scenario`, `add-tape`, `update-tape`, `delete-tape`, `update-scenario`, `delete-scenario`, `list-scenarios`, `get-scenario-by-slug`, `report-tape`, `toggle-scenario-visibility`) rely exclusively on Supabase platform-level rate limits. No per-IP, per-user, or per-endpoint throttling exists in application code. Acceptable for MVP; revisit before public launch.
- **Anonymous scenario creation is uncapped:** Any caller (no auth, no CAPTCHA) can POST to `create-scenario` without limit. A script could create thousands of scenarios. Mitigations: application-level rate limiting (above), CAPTCHA on the create flow, or anonymous creation quotas. Deferred — acceptable given low current traffic; prioritize with rate limiting work.
- **NFR13 future ownership/auth work:** NFR13 ("future ownership and auth improvements") is addressed by Epic 5 (Library Redesign) and Epic 7 (Notifications and Following). No action needed in this story; captured here for traceability.

## Deferred from: code review of 4-4-accessibility-audit-and-fixes-to-wcag-2-1-aa-baseline.md (2026-04-13)

- **Stacked modal Escape ordering:** `LoginModal` and `DeleteConfirmSheet` both attach `window.addEventListener('keydown', ...)` for Escape independently. If both are mounted simultaneously, one Escape press can invoke both `onClose` and `onCancel`. Pre-existing architectural pattern (DeleteConfirmSheet predates Story 4.4). Full modal/portal layer management was explicitly deferred in the story. Revisit when a modal manager or focus-trap utility is introduced.
- **`setState` after unmount on Escape-during-loading:** Pressing Escape while `signInWithOtp` is in flight unmounts `LoginModal`; the async handler may still resolve and call `setModalState`/`setErrorMessage`. Pre-existing: already tracked for the Cancel/backdrop path in this file. React 18+ suppresses the warning. Consolidate with the existing `LoginModal` state-update-after-unmount entry when an `AbortController` fix is applied.

## Deferred from: code review of 2-5-report-tape-and-persistent-footer (2026-04-13)
- **No `tapeId`↔`scenarioSlug` cross-validation in `report-tape` Edge Function:** The function accepts any valid tape UUID paired with any scenario slug without verifying the tape actually belongs to that scenario. A direct API caller could log a mismatched report. No exploitable consequence for an append-only admin log; acceptable for MVP scope.
- **Raw `DATABASE_ERROR` on FK violation for non-existent tapeId in `report-tape`:** If a caller submits a UUID for a deleted or non-existent tape, the FK constraint fires and returns HTTP 500 with raw Postgres error detail. Pre-existing pattern tracked elsewhere in this file. Address when the broader DB error leakage issue is resolved.

## Deferred from: code review of 5-1-two-tab-library-structure-and-shell (2026-04-13)

- **`router.tsx` includes lazy-import conversions of pre-existing pages from prior stories (4.x):** The uncommitted diff for story 5-1 includes lazy import conversions of AboutPage, AuthCallbackPage, HomePage, NotFoundPage, and ScenarioPage — changes made during Epic 4 stories that were never committed. These are correct and regression-tested. No action needed beyond committing all phase2 work as a coherent batch.
- **`AppHeader.tsx` diff includes story 4-1 responsive layout additions:** `min-w-0 flex-1 truncate` on the logo link and `shrink-0 gap-3 md:gap-5` on the nav element appear in the 5-1 diff but originate from story 4-1. Correct and tested. Same batch-commit situation as above.

## Deferred from: code review of 5-2-public-scenarios-feed.md (2026-04-13)

- **`list-public-scenarios` surfaces raw DB errors in `DATABASE_ERROR` responses:** Uses `sErr.message` / `tErr.message` like other Edge Functions. Address with the broader “DB error leakage” / generic server messages work already tracked in this file.

- **Public feed JSON includes `ownerId` per scenario:** `mapScenario` shape matches `list-scenarios` and `get-scenario-by-slug`; same product/PII exposure tradeoff noted under the existing `owner_id` / `author_id` exposure bullet.

- **Tape counts via full row fetch from `tapes`:** For each feed load, counts are derived by selecting all `scenario_id` rows for matched scenarios (up to 50), same pattern as `list-scenarios`. Revisit with grouped `COUNT` in SQL if tape volume or scenario count makes this hot.

## Deferred from: code review of 5-3-private-tab-my-scenarios-bucket.md (2026-04-13)

- **`list-my-scenarios` surfaces raw DB errors in `DATABASE_ERROR` responses:** Uses `sErr.message` / `tErr.message` like other Edge Functions. Address with the broader “DB error leakage” / generic server messages work already tracked in this file.

## Deferred from: code review of 5-4-private-tab-invited-bucket.md (2026-04-13)

- **`list-invited-scenarios` surfaces raw DB errors in `DATABASE_ERROR` responses:** Uses `iErr.message` / `sErr.message` / `tErr.message` like other Edge Functions. Address with the broader “DB error leakage” / generic server messages work already tracked in this file.
