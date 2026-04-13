# Story 3.2: Homepage Route Serves About Page

Status: done

## Story

As a first-time visitor,
I want navigating to the root URL (`/`) to open the About page,
so that I understand what the app is before being thrown into the tape creator.

## Acceptance Criteria

1. **Given** any user navigates to `/` (the root URL),
   **When** the page loads,
   **Then** the browser is redirected to `/about` (the About page), and the URL in the address bar updates to `/about`.

2. **Given** the tape creator / scenario library,
   **When** I need to access it directly,
   **Then** it is available at the new route `/create` (the old `HomePage` component moves to this path).

3. **Given** the "START TAPING" button at the bottom of the About page,
   **When** I activate it,
   **Then** it navigates to `/create` (not `/` — which now redirects back to `/about`, creating a loop).

4. **Given** the AppHeader wordmark logo (⚠ Caution Tape Generator),
   **When** I click it,
   **Then** it navigates to `/create` with `state={{ home: true }}` so the tape creator view activates — the same adaptive behavior as before, just at the new path.

5. **Given** the AppHeader "Library" link,
   **When** I click it,
   **Then** it navigates to `/create` with `state={{ library: true }}` so the library grid view activates for users with known scenarios — same behavior as before, just at the new path.

6. **Given** all existing routes (`/about`, `/auth/callback`, `/s/:slug`, `*` NotFound),
   **When** navigated to,
   **Then** they continue to work exactly as before — no regressions.

7. **Given** the full test suite (`cd web && npm test`),
   **When** run after this story,
   **Then** all tests pass.

## Tasks / Subtasks

- [x] **Task 1: Update `router.tsx` — root redirect + new `/create` route** (AC: #1, #2, #6)
  - [x] Import `Navigate` from `'react-router'`
  - [x] Change the `path: '/'` route from `element: <HomePage />` to `element: <Navigate to="/about" replace />`
  - [x] Add new route `{ path: '/create', element: <HomePage /> }` alongside the existing routes
  - [x] Keep all other routes unchanged: `/about`, `/auth/callback`, `/s/:slug`, `*`

- [x] **Task 2: Update `AboutPage.tsx` — fix START TAPING link** (AC: #3)
  - [x] Find the "START TAPING" `<Link>` at the bottom of the `<article>` (internal CTA footer)
  - [x] Change `to="/"` → `to="/create"`
  - [x] No other changes to `AboutPage.tsx` — all content, styling, and layout are out of scope

- [x] **Task 3: Update `AppHeader.tsx` — fix Logo and Library link paths** (AC: #4, #5)
  - [x] Logo: change `to="/"` → `to="/create"` (keep `state={{ home: true }}` unchanged)
  - [x] Library: change `to="/"` → `to="/create"` (keep `state={{ library: true }}` unchanged)
  - [x] About link stays as `to="/about"` — no change needed
  - [x] Auth (Log in / Sign out) buttons are unchanged

- [x] **Task 4: Fix `ScenarioPage.tsx` — post-delete navigation** (AC: #6)
  - [x] Find `navigate('/')` at the bottom of `deleteScenarioMutation.onSuccess` (line ~270)
  - [x] Change to `navigate('/create', { state: { library: true } })` so after deleting a scenario the user lands on the library/creator — not the About page

- [x] **Task 5: Fix `AuthCallbackPage.tsx` — post-auth navigation** (AC: #6)
  - [x] Find `void navigate('/')` inside `handleSuccess()` (line ~19)
  - [x] Change to `void navigate('/create')` so after a successful magic-link sign-in the user lands on the tape creator / library — not the About page
  - [x] The error-state `<Link to="/">` (line ~67) can stay as `/` — the redirect to `/about` is acceptable for an auth error recovery path

- [x] **Task 6: Regression check** (AC: #7)
  - [x] Run `cd web && npm test` — all tests must pass
  - [x] Manually verify: `/` redirects to `/about`, `/create` shows the tape creator, `/about` shows About page, `/s/:slug` still works, `AppHeader` logo + Library navigate correctly, delete-scenario from ScenarioPage lands on library at `/create`

## Dev Notes

### Scope: Exactly What This Story Is and Is NOT

**IS:**
- Changing what the root URL `/` renders (redirect to `/about`)
- Adding `/create` as the new route for the tape creator / scenario library
- Updating 3 links that pointed to `/` (AppHeader logo, AppHeader Library, AboutPage CTA)

**IS NOT:**
- Any changes to `HomePage.tsx` logic — it moves to a new URL but its code is untouched
- Any changes to `AboutPage.tsx` content or styling — only the `to` prop of the CTA Link changes
- Library redesign, new routes beyond `/create`, or any Epic 4 work
- Navigation header restructuring — that is story 3-3

### Why This Change

The About page (story 3-1) is now the correct front door: it explains the game, establishes tone, and provides a "START TAPING" CTA. Throwing new users into the tape creator without context is the old behavior. The About page content (party-game origin, "WHO CAN SEE THIS" private/public framing) is specifically designed to be the first thing a new visitor sees.

### Critical: The Root Redirect Creates a Loop If CTA Is Not Fixed

This is the most important thing to get right:

| Current | After story 3-2 |
|---------|-----------------|
| `/` → `HomePage` (tape creator) | `/` → redirect to `/about` |
| `/about` → `AboutPage` | `/about` → `AboutPage` (unchanged) |
| — | `/create` → `HomePage` (tape creator) |

**The About page's START TAPING button currently does `<Link to="/">`.**

If this is not changed to `<Link to="/create">`, a user who clicks "START TAPING" will be immediately bounced back to `/about` — an infinite loop. Fix this in Task 2.

The Dev Notes in story 3-1 said "Do NOT add `state={{ home: true }}`". That guidance was written when `/` was the adaptive homepage and the state flag was the signal to force tape-creator view. **With story 3-2, `/` no longer points to `HomePage` at all**, so that note is obsolete. The `to="/create"` link (with no state) is correct: landing on `/create` without state shows the tape creator for users with no known scenarios, and the library for users with known scenarios (adaptive behavior unchanged).

### File: `router.tsx` — Exact Change

```tsx
// Before:
import { createBrowserRouter } from 'react-router'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/about', element: <AboutPage /> },
      ...
    ],
  },
])

// After:
import { createBrowserRouter, Navigate } from 'react-router'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Navigate to="/about" replace /> },
      { path: '/create', element: <HomePage /> },
      { path: '/about', element: <AboutPage /> },
      ...
    ],
  },
])
```

The `replace` prop on `Navigate` ensures the redirect does not pollute browser history (pressing Back from `/about` won't loop back to `/`).

### File: `AboutPage.tsx` — Exact Change

Find the internal `<footer>` at the bottom of the `<article>`. The "START TAPING" link:
```tsx
// Before:
<Link to="/">START TAPING</Link>

// After:
<Link to="/create">START TAPING</Link>
```
No other change to this file.

### File: `AppHeader.tsx` — Exact Changes

```tsx
// Logo (line ~20-24):
// Before: <Link to="/" state={{ home: true }}>
// After:  <Link to="/create" state={{ home: true }}>

// Library link (line ~34-38):
// Before: <Link to="/" state={{ library: true }}>
// After:  <Link to="/create" state={{ library: true }}>
```

The `state` objects are unchanged — `HomePage` reads these states via `useEffect` on `location.state` and sets view accordingly. Moving the route to `/create` does not break this logic.

### `HomePage.tsx` — NOT Changed

The `HomePage` component's internal logic is identical. It still:
- Reads `location.state` for `{ home: true }` / `{ library: true }` signals
- Shows library grid when `knownSlugs.length > 0 && view === 'library'`
- Shows tape creator when `!hasKnownScenarios || view === 'create'`
- Uses `navigate()` to clear state after reading: `navigate(location.pathname, { replace: true, state: {} })`

This all still works at `/create`. `location.pathname` will be `/create` so the navigate-to-clear also correctly navigates to `/create`.

### Complete Inventory of `navigate('/')` and `to="/"` in the Codebase

After this story, `/` redirects to `/about`. Every existing usage of `/` as a destination must be evaluated:

| File | Line | Current | Action |
|------|------|---------|--------|
| `AppHeader.tsx` | ~21 | Logo `to="/"` | **Fix → `to="/create"`** (Task 3) |
| `AppHeader.tsx` | ~35 | Library `to="/"` | **Fix → `to="/create"`** (Task 3) |
| `AboutPage.tsx` | ~107 | START TAPING `to="/"` | **Fix → `to="/create"`** (Task 2) |
| `ScenarioPage.tsx` | 270 | Delete-scenario `navigate('/')` | **Fix → `navigate('/create', { state: { library: true } })`** (Task 4) |
| `AuthCallbackPage.tsx` | 19 | Post-auth `navigate('/')` | **Fix → `navigate('/create')`** (Task 5) |
| `AuthCallbackPage.tsx` | ~67 | Error `<Link to="/">` | Leave as `/` — redirecting to About is fine for an error recovery path |
| `NotFoundPage.tsx` | ~11 | 404 `<Link to="/">` | Leave as `/` — redirecting to About is fine as the "home" for 404 |

### Testing

No new tests needed. The existing test suite (4 test files, all in `web/src/tape/`) does not test routing or page components — no tests reference `router.tsx`, `AppHeader.tsx`, or `HomePage.tsx`.

**Regression check:**
```
cd web && npm test
```
Expected: all ~40 tests pass.

### Project Context Rules (Critical Reminders)

- Work on branch `phase2` — do NOT commit to `master`
- Do NOT create `App.tsx`, `tailwind.config.js`, or `vitest.config.ts`
- All imports in `router.tsx` must use named imports
- React Router 7.1.1 — `Navigate` is a named export from `'react-router'`, not `'react-router-dom'`
- `<Navigate replace />` is the correct idiom for permanent redirects (no history entry)

### References

- `web/src/router.tsx` — add Navigate redirect + new /create route
- `web/src/pages/AboutPage.tsx` — START TAPING CTA: `to="/"` → `to="/create"`
- `web/src/components/AppHeader.tsx` — Logo + Library: `to="/"` → `to="/create"`
- `web/src/pages/HomePage.tsx` — moves to `/create`, code unchanged
- `web/src/pages/ScenarioPage.tsx` — post-delete `navigate('/')` → `navigate('/create', { state: { library: true } })`
- `web/src/pages/AuthCallbackPage.tsx` — post-auth `navigate('/')` → `navigate('/create')`
- Story 3-1 Dev Notes (obsolete guidance): the "Do NOT add state={{ home: true }}" instruction no longer applies after this story changes the root route
- Brainstorming session design intent: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Theme 2 (#8, "One Homepage for Everyone") and Theme 1 (context-aware CTAs)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

_No issues encountered._

### Completion Notes List

- Updated `router.tsx`: added `Navigate` import, replaced `{ path: '/', element: <HomePage /> }` with a `<Navigate to="/about" replace />` redirect, and added `{ path: '/create', element: <HomePage /> }` route. All other routes preserved unchanged.
- Updated `AboutPage.tsx`: changed the START TAPING CTA link from `to="/"` to `to="/create"` — prevents the redirect loop. No other changes to content, styling, or layout.
- Updated `AppHeader.tsx`: changed both the wordmark logo link (`state={{ home: true }}`) and the Library nav link (`state={{ library: true }}`) from `to="/"` to `to="/create"`. State objects and all styling unchanged.
- Updated `ScenarioPage.tsx`: changed post-delete navigation from `navigate('/')` to `navigate('/create', { state: { library: true } })` so users land on the library after deleting a scenario.
- Updated `AuthCallbackPage.tsx`: changed post-auth navigation from `void navigate('/')` to `void navigate('/create')` so users land on the tape creator after signing in. Error-recovery `<Link to="/">` left as-is (redirect to About is acceptable).
- All 40 existing tests pass — 5 test files, no regressions.

### File List

- `web/src/router.tsx`
- `web/src/pages/AboutPage.tsx`
- `web/src/components/AppHeader.tsx`
- `web/src/pages/ScenarioPage.tsx`
- `web/src/pages/AuthCallbackPage.tsx`

## Change Log

- 2026-04-13: Implemented story 3-2 — root `/` now redirects to `/about` via `<Navigate replace />`, tape creator moved to `/create`, all internal `/` navigation links updated to `/create`. All 40 tests pass.

### Review Findings

**2026-04-12 — bmad-code-review**

- No `patch`, `decision-needed`, or `defer` items for implementation. Verified: `router.tsx` root redirect with `replace`, `/create` → `HomePage`, About CTA → `/create`, `ScenarioPage` post-delete and `AuthCallbackPage` post-auth → `/create`, 40/40 tests passing.
- **Note:** AC4 and AC5 (logo and Library to `/create` with `home` / `library` state) describe the header after story 3-2 only. Story 3-3 intentionally changes the logo target to `/about`; evaluate header against story 3-3 after that work.
