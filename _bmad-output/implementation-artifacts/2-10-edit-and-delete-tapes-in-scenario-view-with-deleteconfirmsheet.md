# Story 2.10: Edit and delete tapes in scenario view with DeleteConfirmSheet

Status: done

## Story

As a contributor,
I want to fix typos or remove a tape from the stack,
So that the group can curate jokes in the moment (FR29–FR32, UX-DR19, UX-DR20).

## Acceptance Criteria

See `epics.md` — Story 2.10 (edit overlay with prefill + save; delete opens `DeleteConfirmSheet` before API; optimistic update/delete with rollback; FR31 parity; focus baseline for dialog).

## Tasks / Subtasks

- [x] **`updateMutation` / `deleteMutation`** in `ScenarioPage` — optimistic cache updates, rollback on error. [AC]
- [x] **`DeleteConfirmSheet`** — confirm before `deleteTape` API call (FR32). [AC]
- [x] Per-tape **Edit** / **Delete** actions on persisted rows only. [AC]

## Dev Agent Record

### File List

- `web/src/pages/ScenarioPage.tsx`
- `web/src/components/DeleteConfirmSheet.tsx`
- `web/src/api/client.ts` (`updateTape`, `deleteTape`)

### Change Log

- **2026-03-30:** Backfilled artifact — Story 2.10 implemented; status `done`.
