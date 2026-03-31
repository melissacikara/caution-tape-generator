# Story 2.4: Configure routing for home and scenario by slug with scenario loading UX

Status: done

## Story

As a user,
I want shared links to open the scenario directly,
So that contributors land in the game with zero ceremony (FR20, UX-DR14).

## Acceptance Criteria

See `epics.md` — Story 2.4 (SPA routes `/`, `/s/:slug`, catch-all; scenario loading skeletons; inline retry on error — implemented in `ScenarioPage`).

## Tasks / Subtasks

- [x] **`web/src/router.tsx`** — `createBrowserRouter`, `AppLayout`, `HomePage`, `ScenarioPage`, `NotFoundPage`. [AC]
- [x] **`web/src/main.tsx`** — `RouterProvider`. [AC]
- [x] **`ScenarioPage`** — pending skeleton, error + Retry. [AC]

## Dev Notes

- Paths are inline in `router.tsx` (no separate `paths.ts`); acceptable for MVP.

## Dev Agent Record

### File List

- `web/src/router.tsx`
- `web/src/main.tsx`
- `web/src/layout/AppLayout.tsx`
- `web/src/pages/ScenarioPage.tsx`
- `web/src/pages/NotFoundPage.tsx`

### Change Log

- **2026-03-30:** Backfilled artifact — Story 2.4 implemented; status `done`.
