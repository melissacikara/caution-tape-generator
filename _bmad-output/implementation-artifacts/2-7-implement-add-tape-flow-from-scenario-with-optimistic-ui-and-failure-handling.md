# Story 2.7: Implement add-tape flow from scenario with optimistic UI and failure handling

Status: done

## Story

As a contributor,
I want my tape to appear immediately while saving,
So that the group moment is not killed by latency — but I must not lose work if save fails (FR11, FR12, FR21, FR25, NFR9, NFR10, UX-DR12).

## Acceptance Criteria

See `epics.md` — Story 2.7 (overlay add flow, optimistic tape, invalidation, inline error, draft preserved, idempotency key).

## Tasks / Subtasks

- [x] **`useMutation` (add)** — `onMutate` optimistic row, `onError` rollback, `onSettled` invalidate. [AC]
- [x] Inline error string from `ApiError`; creator stays open on failure. [AC]

## Dev Agent Record

### File List

- `web/src/pages/ScenarioPage.tsx` (`addMutation`, add panel)

### Change Log

- **2026-03-30:** Backfilled artifact — Story 2.7 implemented; status `done`.
