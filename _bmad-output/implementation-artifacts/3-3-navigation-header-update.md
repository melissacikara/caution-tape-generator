# Story 3.3: Navigation Header Update

Status: done

## Story

As a user,
I want the app header to reflect the new site structure where the About page is the front door,
so that clicking the logo takes me home (to the About page) and I can still spot an explicit About entry in the nav when I want a labeled link.

## Acceptance Criteria

1. **Given** the AppHeader wordmark logo (`⚠ Caution Tape Generator`),
   **When** I click it from any page,
   **Then** I navigate to `/about` — the app's front door after story 3-2 — not to the tape creator.

2. **Given** the AppHeader `nav`,
   **When** rendered,
   **Then** there is an **About** text link to `/about` using the same muted + focus styling as Library (not special “danger” red styling). The logo also links to `/about`; both are intentional — the text link improves discoverability for users who look for a literal “About” label (product decision B, 2026-04-12).

3. **Given** the AppHeader Library link,
   **When** I click it,
   **Then** it navigates to `/create` with `state={{ library: true }}` — unchanged behavior from story 3-2.

4. **Given** all existing Auth links (Log in / Sign out),
   **When** rendered or clicked,
   **Then** they behave exactly as before — no regressions.

5. **Given** the full test suite (`cd web && npm test`),
   **When** run after this story,
   **Then** all tests pass.

## Tasks / Subtasks

- [x] **Task 1: Update AppHeader logo link** (AC: #1)
  - [x] Change logo `to="/create"` → `to="/about"`
  - [x] Remove `state={{ home: true }}` from the logo `<Link>` (that state targeted `HomePage`'s adaptive logic at `/`; logo no longer points to `/create`)
  - [x] Update the JSDoc comment at the top of the component to reflect new routing rationale

- [x] **Task 2: Keep the "About" nav link with standard header styling** (AC: #2)
  - [x] Retain `<Link to="/about">About</Link>` in `<nav>` next to Library
  - [x] Use the same muted text + accent focus ring pattern as the Library link (no red hover/focus-only treatment on About)
  - [x] Confirm the Library link and auth buttons/spans remain untouched

- [x] **Task 3: Regression check** (AC: #3, #4, #5)
  - [x] Run `cd web && npm test` — all tests must pass
  - [x] Manually verify: logo click → `/about`; About link → `/about`; Library link → `/create` with library view; Log in / Sign out unchanged; no visual regressions in header layout

## Dev Notes

### Scope: Exactly What This Story Is and Is NOT

**IS:**
- Changing the logo's `to` prop from `/create` to `/about`
- Removing `state={{ home: true }}` from the logo link
- Keeping the "About" `<Link>` in the nav with standard (muted + accent focus) styling alongside the logo
- Updating the JSDoc comment

**IS NOT:**
- Any changes to `HomePage.tsx`, `AboutPage.tsx`, `router.tsx`, `AppFooter.tsx`, or `AppLayout.tsx`
- Adding active/current-route styling to nav items (deferred — nav is minimal, no complexity warranted now)
- Adding a "Create" link or any new nav items
- Library redesign or any Epic 4 work

### Why These Changes

After story 3-2, the root URL `/` redirects to `/about`. The About page is now the front door of the app. However, the logo still points to `/create` (the tape creator) with `state={{ home: true }}`. This means clicking the app's brand mark does NOT take you home — it takes you to the tape creator.

The fix is straightforward:
- **Logo = home** → logo should go to `/about` (the front door)
- **Explicit About label** → keep the About nav link to `/about` as well (duplicate destination is acceptable; Melissa prefers discoverability over strict de-duplication)

This keeps the header aligned with UX-DR6’s slim bar (wordmark left, Library right) while still offering a clear text affordance for “About.”

### File: `AppHeader.tsx` — Exact Changes

**Before (post story 3-2):**
```tsx
/**
 * UX-DR6: slim header — wordmark (Bebas / accent) left, Library link right.
 * Logo uses `home` state so `/` always switches to the tape creator even when already on home.
 * Library uses `library` state so `/` switches to the scenario grid when applicable.
 */
export function AppHeader() {
  // ...
  return (
    <>
      <header ...>
        <div ...>
          <Link
            to="/create"
            state={{ home: true }}
            className="font-display ..."
          >
            ⚠ Caution Tape Generator
          </Link>
          <nav aria-label="Main" className="flex items-center gap-5">
            <Link
              to="/about"
              className="font-ui text-sm text-muted ..."
            >
              About
            </Link>
            <Link
              to="/create"
              state={{ library: true }}
              className="font-ui text-sm text-muted ..."
            >
              Library
            </Link>
            {/* ... auth buttons ... */}
          </nav>
        </div>
      </header>
      {/* ... LoginModal ... */}
    </>
  )
}
```

**After:**
```tsx
/**
 * UX-DR6: slim header — wordmark (Bebas / accent) left, Library link right.
 * Logo links to /about — the front door since story 3-2 made / redirect there.
 * Library uses `library` state so /create switches to the scenario grid when applicable.
 */
export function AppHeader() {
  // ...
  return (
    <>
      <header ...>
        <div ...>
          <Link
            to="/about"
            className="font-display ..."
          >
            ⚠ Caution Tape Generator
          </Link>
          <nav aria-label="Main" className="flex items-center gap-5">
            <Link
              to="/about"
              className="font-ui text-sm text-muted ..."
            >
              About
            </Link>
            <Link
              to="/create"
              state={{ library: true }}
              className="font-ui text-sm text-muted ..."
            >
              Library
            </Link>
            {/* ... auth buttons unchanged ... */}
          </nav>
        </div>
      </header>
      {/* ... LoginModal unchanged ... */}
    </>
  )
}
```

### Current `AppHeader.tsx` — Full Reference

Shipped shape after story 3-3 (logo → `/about`, About + Library in nav):

```tsx
import { useState } from 'react'
import { Link } from 'react-router'

import { LoginModal } from './LoginModal'
import { useAuth } from '../providers/AuthProvider'

/**
 * UX-DR6: slim header — wordmark (Bebas / accent) left, Library link right.
 * Logo links to /about — the front door since story 3-2 made / redirect there.
 * Library uses `library` state so /create switches to the scenario grid when applicable.
 */
export function AppHeader() {
  const { user, loading, signOut } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="mx-auto flex h-[52px] w-full max-w-[480px] items-center justify-between gap-4 px-4 md:max-w-[640px] md:px-6">
          <Link
            to="/about"
            className="font-display text-base uppercase tracking-[0.12em] text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            ⚠ Caution Tape Generator
          </Link>
          <nav aria-label="Main" className="flex items-center gap-5">
            <Link
              to="/about"
              className="font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              About
            </Link>
            <Link
              to="/create"
              state={{ library: true }}
              className="font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Library
            </Link>

            {!loading && user === null ? (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="cursor-pointer font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Log in
              </button>
            ) : null}

            {!loading && user !== null ? (
              <div className="flex items-center gap-3">
                <span
                  className="max-w-[120px] truncate font-ui text-xs text-muted"
                  title={user.email ?? undefined}
                >
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="cursor-pointer font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </nav>
        </div>
      </header>

      {loginOpen ? <LoginModal onClose={() => setLoginOpen(false)} /> : null}
    </>
  )
}
```

### `state={{ home: true }}` — Why It's Removed

`state={{ home: true }}` was used by `HomePage.tsx` to force the tape-creator view even when the user has known scenarios. That state is read via `useEffect` on `location.state`. Removing this state from the logo link is correct because:

1. The logo no longer navigates to `/create` (it goes to `/about`)
2. Even if it did, forcing tape-creator view from a logo click is questionable UX after the front door changed
3. `HomePage.tsx` still reads `location.state` correctly from the Library link click (`library: true`)

No changes are needed in `HomePage.tsx` — it continues to handle `library: true` from the Library nav link unchanged.

### About link styling

The About link uses the same muted + accent focus treatment as Library (no red-only hover/focus). That keeps the bar visually consistent while still allowing logo + About to share `/about`.

### Testing

No new tests are needed. The existing test suite (5 test files, all in `web/src/tape/`) does not test routing or page components — no tests reference `AppHeader.tsx`.

**Regression check:**
```
cd web && npm test
```
Expected: all 40 tests pass.

### Complete Inventory of Logo and "About" Link Usages

| Location | Before 3-3 | After 3-3 |
|----------|-----------|----------|
| `AppHeader.tsx` logo | `to="/create"` + `state={{ home: true }}` | `to="/about"` (no state) |
| `AppHeader.tsx` About link | `<Link to="/about">About</Link>` | **kept** (standard muted styling) |
| `AppHeader.tsx` Library link | `to="/create"` + `state={{ library: true }}` | **unchanged** |

Search for `home: true` in the header: it should no longer appear on the logo after 3-3.

### Project Context Rules (Critical Reminders)

- Work on branch `phase2` — do NOT commit to `master`
- React Router 7.1.1 — `Link` is imported from `'react-router'` (not `'react-router-dom'`)
- Do NOT create `App.tsx`, `tailwind.config.js`, or `vitest.config.ts`
- Named imports only; `AppHeader` is a shared component (not a page), so no default export
- Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background` on the logo (already present — preserve it)
- Minimum tap target: `min-h-[44px]` — the header is `h-[52px]`, so logo and Library link naturally meet this

### References

- `web/src/components/AppHeader.tsx` — the only file changed
- Story 3-2 Dev Notes (IS NOT: "Navigation header restructuring — that is story 3-3"): `_bmad-output/implementation-artifacts/3-2-homepage-route-serves-about-page.md`
- Story 3-1 Dev Notes (IS NOT: "story 3-3 handles any further nav updates"): `_bmad-output/implementation-artifacts/3-1-about-page-content-and-layout.md`
- UX-DR6 ("wordmark left, Library link right"): `_bmad-output/planning-artifacts/ux-design-specification.md` line 417
- Router state after story 3-2: `web/src/router.tsx` — `/` → redirect to `/about`, `/create` → `HomePage`
- `HomePage.tsx` adaptive state logic (library: true still works): `web/src/pages/HomePage.tsx`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

_None._

### Completion Notes List

- ✅ Task 1: Updated logo `<Link>` in `AppHeader.tsx` — changed `to="/create"` → `to="/about"`, removed `state={{ home: true }}`, updated JSDoc to reflect new routing rationale.
- ✅ Task 2: Kept the About nav link alongside the logo (both to `/about`); styling matches Library per revised AC #2 (product decision B, 2026-04-12).
- ✅ Task 3: Full test suite run — 5 test files, 40 tests, all passed. No regressions introduced.

### File List

- `web/src/components/AppHeader.tsx`

### Change Log

- 2026-04-13: Story 3-3 implemented — logo links to `/about`; About nav link retained with standard header styling (explicit About label + logo both to `/about`).
- 2026-04-12: Code review resolution **B** — AC #2 and tasks updated to codify keeping the About link; story doc aligned with implementation.

### Review Findings

**2026-04-12 — bmad-code-review** (Blind Hunter + Edge Case Hunter + Acceptance Auditor)

- [x] [Review][Decision] Standalone **About** link vs AC2 — **Resolved (B):** AC #2 and tasks now require keeping the About text link with standard styling; story and Change Log aligned with `AppHeader.tsx`.
