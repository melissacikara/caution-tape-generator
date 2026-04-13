# Story 1.2: Magic Link Login Flow

Status: done

## Story

As a user,
I want to be able to log in with a magic link sent to my email and have my session persist across visits,
So that I can own my scenarios and tapes as an authenticated identity without ever creating a password.

## Acceptance Criteria

1. **Given** I am on any page in the app
   **When** I choose to log in
   **Then** I see a login UI that accepts my email address and a "Send Magic Link" action — no password field, no OAuth buttons

2. **And** when I submit my email, the app calls `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo } })` using the `supabaseClient` singleton from `web/src/lib/supabase.ts`

3. **And** the UI transitions to a "Check your email" confirmation state (not a new route) — the email field and submit button are replaced with a message like "Magic link sent! Check your inbox."

4. **And** when the user clicks the link in their email and lands back on the app (at `${window.location.origin}/auth/callback`), the session is established via Supabase's implicit flow

5. **And** an `/auth/callback` route exists that processes the token from the URL hash, calls `supabase.auth.getSession()` to confirm the session, then redirects to `/`

6. **And** `onAuthStateChange` is wired in an `AuthProvider` React context so the entire app can reactively read the current user (`User | null`) and loading state

7. **And** a `useAuth()` hook exposes `{ user, session, loading, signOut }` to any component

8. **And** a "Sign out" affordance exists (exact placement is deferred — can be a temporary dev control for now, not production UX); calling it invokes `supabase.auth.signOut()` and clears the session

9. **And** the user's JWT is injected into API requests: `supabaseFetch` in `web/src/api/client.ts` must send `Authorization: Bearer <access_token>` when the user is logged in, falling back to the anon key when logged out — this enables Edge Functions to call `extractUserId(req)` and identify the caller

10. **And** the Supabase client singleton from Story 1.1 (`web/src/lib/supabase.ts`) is reused — do NOT create a second client instance

11. **And** existing Phase 1 anonymous flows (view scenario, add tape without login) continue to work unchanged — this story does not gate any actions behind auth (that is Story 1.3)

## Tasks / Subtasks

- [x] Task 1: Create `AuthProvider` and `useAuth` hook (AC: #6, #7)
  - [x] Create `web/src/providers/AuthProvider.tsx`
  - [x] Subscribe to `supabaseClient.auth.onAuthStateChange` on mount; unsubscribe on unmount via `data.subscription.unsubscribe()`
  - [x] `INITIAL_SESSION` event: set `user` and `session`; set `loading = false`
  - [x] `SIGNED_IN` event: update `user` and `session`
  - [x] `SIGNED_OUT` event: set `user = null`, `session = null`
  - [x] `TOKEN_REFRESHED` event: update `session` (access token may rotate)
  - [x] Context value: `{ user: User | null, session: Session | null, loading: boolean, signOut: () => Promise<void> }`
  - [x] `signOut` calls `await supabaseClient.auth.signOut()`
  - [x] Export `useAuth()` hook with null-check guard (throws if used outside `AuthProvider`)
  - [x] Wrap `<App>` or root with `<AuthProvider>` in `web/src/main.tsx` or `web/src/App.tsx` — place it **inside** `<QueryProvider>` so auth state is available to query hooks

- [x] Task 2: Create `LoginModal` or `LoginPanel` component (AC: #1, #2, #3)
  - [x] Create `web/src/components/LoginModal.tsx` (or `LoginPanel.tsx` if inline — designer's call; modal is the safe default)
  - [x] Two states: `idle` (email input + submit button) and `sent` (confirmation message)
  - [x] Email `<input type="email">` with `aria-label`; required validation before submit
  - [x] Submit calls `supabaseClient.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: \`${window.location.origin}/auth/callback\` } })`
  - [x] On success → transition to `sent` state; on error → show inline error message (do NOT throw or toast)
  - [x] Loading state on the submit button while OTP request is in flight
  - [x] Follow button hierarchy: primary yellow full-width "Send Magic Link"; secondary/ghost "Cancel" if modal
  - [x] Use Bebas Neue / DM Mono per design tokens — no ad hoc hex; no new color values

- [x] Task 3: Add `/auth/callback` route (AC: #4, #5)
  - [x] Create `web/src/pages/AuthCallbackPage.tsx`
  - [x] On mount: call `supabaseClient.auth.getSession()` — Supabase's `@supabase/supabase-js` v2 auto-processes the `#access_token` fragment from the URL before the first `getSession()` call in the implicit flow
  - [x] On success → `navigate('/')` using `useNavigate()` from React Router
  - [x] On error → display inline error message and a "Try again" link back to home; do NOT redirect to a broken state
  - [x] Register this route in `web/src/router.tsx` as `<Route path="/auth/callback" element={<AuthCallbackPage />} />`
  - [x] Add `${origin}/auth/callback` to Supabase Auth Redirect URLs in dashboard (manual step — document in Dev Notes)

- [x] Task 4: Update `supabaseFetch` to send user JWT when logged in (AC: #9)
  - [x] In `web/src/api/client.ts`, update `supabaseFetch` to read the current session
  - [x] Pattern: `const { data: { session } } = await supabaseClient.auth.getSession()` — use the access token if present, else fall back to anon key
  - [x] Set `Authorization: Bearer ${session?.access_token ?? anonKey}` and `apikey: ${anonKey}` (apikey header always uses anon key — that is correct)
  - [x] `getScenarioBySlug` has its own inline headers — update it consistently with the same logic
  - [x] Keep `isSupabaseConfigured()` helper unchanged
  - [x] **CRITICAL:** Never expose or import service role key in `client.ts`

- [x] Task 5: Expose login entry point in AppHeader (AC: #1, #8)
  - [x] Update `web/src/components/AppHeader.tsx` to read `useAuth()`
  - [x] When `loading === false` and `user === null`: show a "Log in" button/link (ghost style per button hierarchy)
  - [x] When `loading === false` and `user !== null`: show user email (truncated) + "Sign out" ghost button
  - [x] When `loading === true`: render nothing or a skeleton in that slot to avoid layout shift
  - [x] Clicking "Log in" opens `LoginModal` (or navigates to login page — modal is preferred)
  - [x] Clicking "Sign out" calls `signOut()` from `useAuth()`

- [x] Task 6: Verify anonymous flows not broken (AC: #11)
  - [x] Manual smoke-test: open a scenario as a logged-out user, add a tape — confirms Phase 1 still works
  - [x] Run existing test suite: `cd web && npm test` — no new failures

## Dev Notes

### Critical: What This Story Is and Is Not

- **IS:** Login UI (magic link send), auth callback route, `AuthProvider` + `useAuth`, JWT injection into API client, "Log in / Sign out" in header
- **IS NOT:** Gating any actions behind auth — that is Story 1.3. Any user (logged in or not) can still view/add/edit/delete tapes in Phase 1 scenarios
- **DO NOT** add permission checks, ownership checks, or "you must be logged in" errors anywhere in this story
- **DO NOT** add `ownerId`/`authorId` display to the UI — that context belongs in Epic 2 (ownership/privacy stories)

### Supabase Auth Client Patterns (v2 / `@supabase/supabase-js@2.45.0`)

**Magic link send:**
```ts
const { error } = await supabaseClient.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: true,
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

**`onAuthStateChange` subscription (AuthProvider pattern):**
```ts
const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'INITIAL_SESSION') {
    setUser(session?.user ?? null)
    setSession(session)
    setLoading(false)
  } else if (event === 'SIGNED_IN') {
    setUser(session?.user ?? null)
    setSession(session)
  } else if (event === 'SIGNED_OUT') {
    setUser(null)
    setSession(null)
  } else if (event === 'TOKEN_REFRESHED') {
    setSession(session)
  }
})
// Cleanup:
return () => data.subscription.unsubscribe()
```

**`getSession()` vs `getUser()` — use `getSession()` on the client:**
- `getSession()` reads from localStorage — fast and correct for client-side use
- `getUser()` makes a network call to validate the JWT — only needed on the server/Edge Functions
- In `AuthProvider`, rely on `onAuthStateChange` for reactive updates; only call `getSession()` in `AuthCallbackPage` to confirm the callback succeeded

**Auth callback (implicit flow):**
In Supabase v2 implicit flow, the access token is in the URL fragment (`#access_token=...`). The Supabase JS client automatically detects and processes this fragment during `createClient` initialization or on the first auth call. The callback page simply needs to call `getSession()` to confirm session establishment.

```ts
// AuthCallbackPage.tsx
useEffect(() => {
  supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
    if (session) {
      navigate('/')
    } else {
      setError(error?.message ?? 'Login link expired or invalid. Please try again.')
    }
  })
}, [])
```

**Sign out:**
```ts
await supabaseClient.auth.signOut()
// onAuthStateChange fires SIGNED_OUT → AuthProvider clears user/session
```

### JWT Injection in `api/client.ts`

Current `supabaseFetch` sends `Bearer ${anon}` always. Update it to:

```ts
import { supabaseClient } from '../lib/supabase'

async function supabaseFetch(path: string, init: RequestInit): Promise<Response> {
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  const { data: { session } } = await supabaseClient.auth.getSession()
  const token = session?.access_token ?? anon

  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('apikey', anon)            // apikey always uses anon key — correct per Supabase docs
  return fetch(supabaseFunctionUrl(path), { ...init, headers })
}
```

Also update `getScenarioBySlug` inline headers the same way — it currently hardcodes the anon key directly.

### `web/src/api/types.ts` — Already Updated in Story 1.1

Story 1.1 completion notes state `ownerId` and `authorId` were added to DTOs. **Check the actual file first.** If they were not committed (the file in the repo doesn't show them), add them now:
```ts
export type ScenarioDto = {
  id: string
  name: string
  publicSlug: string
  ownerId?: string   // nullable for Phase 1 scenarios
  createdAt: string
  updatedAt?: string
}
export type TapeDto = {
  id: string
  scenarioId: string
  tapeText: string
  color: string
  authorId?: string  // nullable for Phase 1 tapes
  createdAt: string
  updatedAt?: string
}
```

### Supabase Dashboard Manual Steps (Required Before Testing)

1. **Redirect URL:** Add `${VERCEL_PRODUCTION_URL}/auth/callback` and `http://localhost:5173/auth/callback` to **Authentication → URL Configuration → Redirect URLs** in Supabase Dashboard
2. These were set for Story 1.1's Site URL but the `/auth/callback` suffix path may not be listed — verify both are present

### File Locations

- `web/src/providers/AuthProvider.tsx` — **new file** (a `QueryProvider.tsx` already exists in `web/src/providers/` as a pattern to follow)
- `web/src/components/LoginModal.tsx` — **new file**
- `web/src/pages/AuthCallbackPage.tsx` — **new file** (see existing pages: `HomePage.tsx`, `ScenarioPage.tsx`, `NotFoundPage.tsx`, `AboutPage.tsx` as patterns)
- `web/src/router.tsx` — **modify** (add `/auth/callback` route)
- `web/src/components/AppHeader.tsx` — **modify** (add login/logout controls)
- `web/src/api/client.ts` — **modify** (JWT injection)
- `web/src/main.tsx` or `web/src/App.tsx` — **modify** (wrap with `AuthProvider`)
- **DO NOT** create a second Supabase client — use the existing singleton from `web/src/lib/supabase.ts`

### Existing Code Patterns to Follow

**QueryProvider pattern** (provider wrapper — follow same structure):
```
web/src/providers/QueryProvider.tsx
```

**AppHeader location:**
```
web/src/components/AppHeader.tsx
```

**Pages pattern:**
```
web/src/pages/HomePage.tsx
web/src/pages/ScenarioPage.tsx
```

**Router:**
```
web/src/router.tsx
```

**Design tokens / button styles:** Follow existing Tailwind classes in `AppHeader.tsx`, `TapeCreatorPanel.tsx` — use token-contract classes (`bg-accent`, `text-accent-text`, `text-primary`, etc.) not ad hoc hex.

### Regression Guard

- Phase 1 anonymous access: `supabaseFetch` fallback to anon key when `session === null` must remain intact
- `getScenarioBySlug` must also fall back gracefully — currently it hardcodes the anon key, which is fine to keep as a fallback pattern
- Run `npm test` in `web/` before marking this story done — pre-existing color picker test failures (`document is not defined`) are known and pre-existing; any NEW failures are a regression

### Previous Story Intelligence (from Story 1.1)

- `supabaseClient` singleton is at `web/src/lib/supabase.ts` — exports `supabaseClient` (not `supabase`)
- `@supabase/supabase-js` is already installed in `web/package.json`
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are the only client-safe env vars
- `web/src/test-setup.ts` has stub env vars to protect tests — if new env vars are needed in tests, add them there
- Edge Functions now call `extractUserId(req)` from `_shared/auth.ts` — when user is logged in and JWT is injected, these functions will correctly identify the user (no Edge Function changes needed in this story)
- `_shared/cors.ts` already includes `authorization` in `Access-Control-Allow-Headers` — no CORS changes needed

### References

- Epic 1, Story 1.2 — derived from brainstorming decisions in `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` (Theme 1: Identity & Access)
- Story 1.1 completed file: `_bmad-output/implementation-artifacts/1-1-supabase-auth-setup-and-user-schema.md`
- Supabase Auth magic link docs: https://supabase.com/docs/guides/auth/auth-magic-link
- Supabase `onAuthStateChange` docs: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
- Existing Supabase client singleton: `web/src/lib/supabase.ts`
- Existing API client: `web/src/api/client.ts`
- Existing providers pattern: `web/src/providers/QueryProvider.tsx`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-5)

### Completion Notes List

- Created `AuthProvider.tsx` with full `onAuthStateChange` subscription handling INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED events. `useAuth()` hook throws if used outside provider context.
- `AuthProvider` wrapped inside `<QueryProvider>` in `main.tsx` so auth state is available to query hooks per story spec.
- Created `LoginModal.tsx` with `idle/loading/sent/error` states, primary yellow CTA ("Send Magic Link"), ghost Cancel, inline error display (no toast/throw), using design token classes only (bg-accent, text-accent-text, font-display, font-ui, etc.).
- Created `AuthCallbackPage.tsx` using `getSession()` implicit flow pattern; redirects to `/` on success, shows inline error + "Try again" link on failure.
- Registered `/auth/callback` route in `router.tsx`.
- Updated `supabaseFetch` in `client.ts` to call `getSession()` and use `session?.access_token ?? anon` as Bearer token. `apikey` header always uses anon key per Supabase docs.
- Updated `getScenarioBySlug` inline headers with same JWT-or-anon pattern.
- Added `ownerId?: string` to `ScenarioDto` and `authorId?: string` to `TapeDto` in `types.ts` (Story 1.1 note — not present in file, added now).
- Updated `AppHeader.tsx`: shows "Log in" ghost button when logged out, email + "Sign out" when logged in, nothing while loading to prevent layout shift. "Log in" opens `LoginModal`.
- **Manual step required:** Add `http://localhost:5173/auth/callback` and `${VERCEL_PRODUCTION_URL}/auth/callback` to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
- All 17 pre-existing tests pass. No regressions introduced.
- **Code review fixes applied:** AuthCallbackPage rewritten with `onAuthStateChange` fallback + `didNavigate` ref to prevent race condition on magic-link callback. `TOKEN_REFRESHED` now updates both `user` and `session`. `AuthProvider` clears React Query cache on `SIGNED_IN`/`SIGNED_OUT` events. 7 items deferred to `deferred-work.md`.

### File List

- `web/src/providers/AuthProvider.tsx` — new
- `web/src/components/LoginModal.tsx` — new
- `web/src/pages/AuthCallbackPage.tsx` — new
- `web/src/router.tsx` — modified (added `/auth/callback` route)
- `web/src/components/AppHeader.tsx` — modified (login/logout controls)
- `web/src/api/client.ts` — modified (JWT injection in supabaseFetch + getScenarioBySlug)
- `web/src/api/types.ts` — modified (ownerId on ScenarioDto, authorId on TapeDto)
- `web/src/main.tsx` — modified (wrapped with AuthProvider)

## Change Log

| Date | Change |
|------|--------|
| 2026-04-11 | Story file created — magic link login flow (Phase 2, Epic 1, Story 1.2) |
| 2026-04-11 | Implementation complete — AuthProvider, LoginModal, AuthCallbackPage, /auth/callback route, JWT injection in API client, login/logout in AppHeader |
| 2026-04-11 | Code review: fixed AuthCallbackPage race condition, TOKEN_REFRESHED user update, React Query cache invalidation on auth transitions. 7 items deferred. |
