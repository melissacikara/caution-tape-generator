# Story 2.6: Build scenario view with TapeStack, tape count, and pinned ADD

Status: done

## Story

As a contributor,
I want to scroll tapes and always see how to add another,
So that the in-room flow stays obvious (FR10, FR13, FR28, UX-DR9, UX-DR10).

## Acceptance Criteria

See `epics.md` — Story 2.6 (vertical stack newest-at-top, tape count, pinned bottom ADD, empty state, touch targets).

## Tasks / Subtasks

- [x] **`ScenarioPage`** — `<ul>` tape stack with `TapeRenderer` rows; header shows tape count. [AC]
- [x] Fixed bottom zone — ADD / add-tape panel + primary control (pinned). [AC]

## Dev Agent Record

### File List

- `web/src/pages/ScenarioPage.tsx`
- `web/src/tape/TapeRenderer.tsx`

### Change Log

- **2026-03-30:** Backfilled artifact — Story 2.6 implemented; status `done`.
