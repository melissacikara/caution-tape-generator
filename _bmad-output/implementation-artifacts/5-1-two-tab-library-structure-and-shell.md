# Story 5.1: Two-tab library structure and shell

Status: done

## Story

As a user,
I want the Library to have a Public tab and a Private tab,
So that I can browse community scenarios or focus on my own collection (brainstorm #9).

## Acceptance Criteria

1. **Given** any user (logged in or out),
   **When** I navigate to `/library`,
   **Then** I see two tabs: **Public** and **Private**,
   **And** the Public tab is the default and active on load.

2. **Given** a logged-out user,
   **When** I click the Private tab,
   **Then** I see a friendly prompt to log in or create an account — no error state.

3. **Given** a logged-in user,
   **When** I click the Private tab,
   **Then** I see my personal collection shell (bucket content populated in stories 5.3–5.5).

4. **Given** the Library header nav link,
   **When** I click it from any page,
   **Then** I navigate to `/library` (not `/create` with state — that pattern is superseded by this route).

5. **Given** the `/library` route,
   **When** it is registered and the Library nav link points to it,
   **Then** the existing `/create` route continues to work as the tape creator without regression.

## Tasks / Subtasks

- [x] **Task 1: Create `LibraryPage` component** (AC: 1, 2, 3)
  - [x] Create `web/src/pages/LibraryPage.tsx` — named export `LibraryPage`
  - [x] Render page header ("Library" or equivalent display heading)
  - [x] Render two tab buttons: `Public` and `Private`
  - [x] Tab state: `useState<'public' | 'private'>('public')` + `startTransition` on switch (consistent with `HomePage`)
  - [x] Public tab content: stub/empty state with on-brand copy — actual feed wired in story 5.2
  - [x] Private tab (logged-out): inline friendly prompt + "Log in" button that opens login modal via `openLoginGate()`
  - [x] Private tab (logged-in, auth loading): show nothing / spinner until `loading` resolves
  - [x] Private tab (logged-in): empty shell div (stories 5.3–5.5 add bucket sections here)
  - [x] Render `LoginModal` conditionally via `isLoginGateOpen` (same pattern as `HomePage`)

- [x] **Task 2: Register `/library` route** (AC: 4, 5)
  - [x] Add lazy import for `LibraryPage` in `web/src/router.tsx`
  - [x] Add `{ path: '/library', element: <LibraryPage /> }` to the router children array

- [x] **Task 3: Update `AppHeader` Library nav link** (AC: 4, 5)
  - [x] Change `<Link to="/create" state={{ library: true }}>Library</Link>` → `<Link to="/library">Library</Link>`
  - [x] Remove the `state` prop entirely (the state-based library-view toggle in `HomePage` is not part of this route)

- [x] **Task 4: Update `AppHeader` test** (AC: 4)
  - [x] In `web/src/components/AppHeader.test.tsx`, update line ~82 assertion from `href="/create"` to `href="/library"`

- [x] **Task 5: Tests for `LibraryPage`** (AC: 1, 2, 3)
  - [x] Create `web/src/pages/LibraryPage.test.tsx` co-located next to `LibraryPage.tsx`
  - [x] Test: Public tab renders and is active by default
  - [x] Test: Private tab button switches to private view
  - [x] Test (logged out): Private tab shows login prompt, not an error
  - [x] Test (logged in): Private tab shows personal collection shell (no login prompt)

- [x] **Task 6: Regression** (AC: 5)
  - [x] Run `npm test` in `web/` — all existing tests must pass (including the updated `AppHeader` test)

## Dev Notes

### What This Story Is and Is Not

**Is:** Shell + routing. Public tab = empty state (feed wired in 5.2). Private tab = login prompt for logged-out or empty authenticated shell (buckets wired in 5.3–5.5). Tab switching. Route registration. Header nav update.

**Is not:** Fetching public scenarios (5.2), My Scenarios bucket (5.3), Invited bucket (5.4), Following bucket (5.5).

### File Locations

- **New file:** `web/src/pages/LibraryPage.tsx` — follows the flat `pages/` convention (same as `HomePage`, `AboutPage`, `ScenarioPage`)
- **Modified:** `web/src/router.tsx` — add lazy import + route entry
- **Modified:** `web/src/components/AppHeader.tsx` — update Library link target
- **Modified:** `web/src/components/AppHeader.test.tsx` — update href assertion

Do **not** create a `features/library/` directory for this story — the page component goes in `pages/`. If a sub-component is needed (e.g. `LibraryTabBar`), co-locate as a sibling file in `pages/` or keep it inline for the shell story.

### Existing `HomePage` Library-State Logic

`HomePage` at `/create` currently has `view: 'library' | 'create'` local state that responds to `location.state.library`. After this story, the AppHeader no longer sends that state, so the library-view branch in `HomePage` becomes dead code — but **do not touch `HomePage`** in this story. It continues to function as the tape creator; the library-view branch will be cleaned up in a future story. No regression from leaving it in place.

### Routing Pattern (router.tsx)

Follow the existing lazy-import pattern exactly:

```tsx
const LibraryPage = lazy(async () => {
  const m = await import('./pages/LibraryPage')
  return { default: m.LibraryPage }
})
```

Add the route entry after the `/create` entry in the children array:

```tsx
{ path: '/library', element: <LibraryPage /> },
```

The `Suspense` boundary is already in `AppLayout` around `<Outlet />` — no additional Suspense needed.

### Tab State Pattern

Use `startTransition` when switching tabs — same pattern as `HomePage.setView`:

```tsx
const [activeTab, setActiveTab] = useState<'public' | 'private'>('public')

function switchTab(tab: 'public' | 'private') {
  startTransition(() => setActiveTab(tab))
}
```

### Auth Pattern in `LibraryPage`

```tsx
const { user, loading } = useAuth()
const { isLoginGateOpen, openLoginGate, closeLoginGate } = useLoginGate()
```

- `user === null && !loading` → logged out
- `loading` → auth resolving (show nothing or skeleton in private tab)
- `user !== null` → logged in

`useLoginGate()` guards internally: `openLoginGate()` is a no-op if user is already logged in or auth is loading.

### Logged-out Private Tab Prompt

This is a **friendly informational state** — not an error, not a redirect. Keep it on-brand and simple:

```
⚠ Your private collection lives here.
Log in to see your scenarios, invites, and followed boards.
[Log in button → openLoginGate()]
```

The "Log in" button calls `openLoginGate()` and renders `<LoginModal onClose={closeLoginGate} />` when `isLoginGateOpen` is true. Follow the exact pattern from `HomePage` — the modal is rendered at the page root, not inside the tab content.

### Styling Patterns (Tailwind v4 — Semantic Tokens Only)

All semantic tokens from `@theme` in `web/src/index.css`:
- `bg-background`, `bg-surface`, `bg-surface-raised`, `border-border`
- `text-foreground`, `text-muted`, `text-accent-text`, `text-accent`  
- `bg-accent` for primary actions
- `font-display` + `uppercase tracking-wide` for headings (Bebas Neue)
- `font-ui` for labels, buttons, meta copy (DM Mono)

Tab bar: two adjacent buttons, active tab visually distinct. Suggested pattern (align with existing button hierarchy):
- Active tab: `bg-surface-raised border-b-2 border-accent text-foreground`
- Inactive tab: `text-muted hover:text-foreground`
- Both tabs: `min-h-[44px]` (touch target), `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`
- No disabled styling on either tab — both are always tappable

Max-width centering: `w-full max-w-[480px] md:max-w-[640px]` inside a `flex justify-center px-4 py-8` main — same layout wrapper as `ScenarioPage` and `HomePage`.

### AppHeader Test Update

The existing test at line ~82 in `AppHeader.test.tsx` asserts:

```ts
expect(screen.getByRole('link', { name: /library/i })).toHaveAttribute('href', '/create')
```

Update this assertion to:

```ts
expect(screen.getByRole('link', { name: /library/i })).toHaveAttribute('href', '/library')
```

The `state` prop on the link is also removed — no assertion needed for it since `@testing-library` does not check Link state by default.

### Public Tab Empty State (Stub for 5.2)

The Public tab in this shell story will show an empty state. Keep it on-brand and clearly a placeholder so it looks intentional:

```
No public scenarios yet. Check back soon.
```

Or leave a comment `{/* Story 5.2: public feed renders here */}`. Either is fine — just don't render a spinner or error state since there is no data fetch in 5.1.

### Project Structure Notes

- Named imports only — no default exports from `LibraryPage.tsx` (the lazy wrapper in `router.tsx` is the exception per existing pattern)
- `useId()` not needed for this shell story (no form inputs in 5.1)
- No new TanStack Query keys needed for 5.1 (no data fetching)

### Testing Standards

- Co-locate test at `web/src/pages/LibraryPage.test.tsx`
- Mock `AuthProvider` with `vi.mock` at module level (same pattern as `AppHeader.test.tsx` and `HomePage.test.tsx`)
- Wrap renders in `MemoryRouter` (same pattern as all existing page tests)
- Mock `LoginModal` to a simple `role="dialog"` stub (same pattern as existing tests)
- Do NOT mock `useLoginGate` — test real behavior driven by mocked `useAuth` state
- Run: `npm test` in `web/` → `vitest run`

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.1]
- [Source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Decision #9 (Two-Tab Library), #11 (Three Buckets)]
- [Source: `web/src/router.tsx` — lazy-import pattern]
- [Source: `web/src/pages/HomePage.tsx` — `startTransition` tab-switch, auth pattern, `useLoginGate` usage]
- [Source: `web/src/components/AppHeader.tsx` — Library link (to update)]
- [Source: `web/src/components/AppHeader.test.tsx` — test to update (line ~82)]
- [Source: `_bmad-output/project-context.md` — stack, routing rules, Tailwind v4 tokens, testing standards]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (Cursor)

### Debug Log References

None — implementation proceeded without blockers.

### Completion Notes List

- Created `LibraryPage` with ARIA tablist/tab/tabpanel roles, `startTransition` for tab switches, semantic Tailwind v4 tokens throughout.
- Public tab: on-brand stub copy ("No public scenarios yet. Check back soon.") with a comment marking where story 5.2 will wire the feed.
- Private tab (logged-out): friendly prompt with ⚠ icon text + "Log in" button wired to `openLoginGate()`. `LoginModal` rendered conditionally at page root (not inside tab panel) following `HomePage` pattern.
- Private tab (auth loading): renders nothing — no spinner, no prompt, no error.
- Private tab (logged-in): empty shell `<div>` with comment for stories 5.3–5.5.
- `useLoginGate` used as-is (not mocked in tests) — behaviour driven by mocked `useAuth`.
- `/library` route registered in `router.tsx` with lazy import matching existing pattern.
- `AppHeader` Library link changed from `to="/create" state={{ library: true }}` to `to="/library"` (state removed).
- `AppHeader.test.tsx` assertion updated from `href="/create"` to `href="/library"`.
- 8 new tests added in `LibraryPage.test.tsx` covering all ACs (default public tab, tab switching, logged-out prompt, logged-in shell, auth-loading shell, login modal open).
- Full regression: **78 tests pass, 11 test files, 0 failures.**

### File List

- `web/src/pages/LibraryPage.tsx` (new)
- `web/src/pages/LibraryPage.test.tsx` (new)
- `web/src/router.tsx` (modified — added lazy import + `/library` route)
- `web/src/components/AppHeader.tsx` (modified — Library link updated to `/library`, state removed)
- `web/src/components/AppHeader.test.tsx` (modified — href assertion updated to `/library`)

## Senior Developer Review (AI)

**Date:** 2026-04-13
**Outcome:** Changes Requested
**Layers run:** Blind Hunter ✅ · Edge Case Hunter ✅ · Acceptance Auditor ✅

### Action Items

- [x] [Review][Patch] Add modal-close test to `LibraryPage.test.tsx` [`web/src/pages/LibraryPage.test.tsx`]
- [x] [Review][Defer] `router.tsx` includes lazy-import conversion of pre-existing pages from prior stories — `web/src/router.tsx` — deferred, pre-existing
- [x] [Review][Defer] `AppHeader.tsx` diff includes responsive layout additions from story 4-1 — `web/src/components/AppHeader.tsx` — deferred, pre-existing

## Change Log

- 2026-04-13: Story 5.1 implemented — two-tab Library shell, `/library` route, AppHeader nav update, 8 new tests, full regression clean (78/78).
- 2026-04-13: Code review complete — 1 patch (low: missing modal-close test), 2 deferred (pre-existing diffs from prior stories), 6 dismissed.
