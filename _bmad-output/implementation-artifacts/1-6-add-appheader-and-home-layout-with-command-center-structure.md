# Story 1.6: Add AppHeader and home layout with Command Center structure

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a user,
I want a slim header that orients me without breaking the bit,
So that I always know I’m in the app and can reach the library when it exists (FR27).

## Acceptance Criteria

1. **Given** UX-DR6,
   **When** I load the home route,
   **Then** I see the **wordmark** on the left and a **Library** link on the right (link may route to **`/`** until Epic 3 library exists, but **must not 404**),
   **And** content uses centered **max-width** per UX: **`max-w-[480px]`** default, **`md:max-w-[640px]`**.

2. **Given** the navigation rule,
   **When** I use the Library link,
   **Then** pre-library MVP: **`/`** resolves to the home app (tape creator) — **no broken route**; Epic 3 can swap to a real library path later.

## Tasks / Subtasks

- [x] Add **`AppHeader`** (`web/src/components/AppHeader.tsx`): wordmark (accent, `font-display`), **Library** `<a href="/">`. [AC: 1, 2]
- [x] **`App.tsx`:** Shell = header + main; main column **`max-w-[480px] md:max-w-[640px]`** centered, `TapeCreatorPanel` inside. [AC: 1]
- [x] Document Library link behavior in component comment (pre–Epic 3). [AC: 2]
- [x] **`npm run build`** + **`npm run lint`**. [AC: 1]

## Dev Notes

- **Scope:** No React Router required; **no 404** on `/` for Vite SPA.
- **References:** UX-DR6, UX spec max-width table, epics Story 1.6.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Added `AppHeader` (sticky, 52px, border-b); wordmark `⚠ Caution Tape Gen`; Library → `/`.
- Home layout: `max-w-[480px] md:max-w-[640px]` with horizontal padding; matches UX-DR16 / spec.

### File List

- `web/src/components/AppHeader.tsx`
- `web/src/App.tsx`

### Change Log

- **2026-03-30:** Story 1.6 — AppHeader + Command Center width shell.

### Review Findings

- [x] [Review][Patch] Align `AppHeader` file comment with story AC2 — Explicitly state pre-library MVP behavior and that Epic 3 may replace the Library target with a dedicated library route (current comment describes adaptive home but omits “Epic 3 / pre-library” wording requested in tasks). [`web/src/components/AppHeader.tsx`]

- [x] [Review][Defer] Story file list references `web/src/App.tsx` — deferred, pre-existing — Implementation uses `AppLayout.tsx`, `router.tsx`, and `HomePage.tsx` instead; update the story file list when convenient for traceability (not a runtime defect).
