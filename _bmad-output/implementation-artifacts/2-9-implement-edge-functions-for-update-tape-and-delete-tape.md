# Story 2.9: Implement Edge Functions for update-tape and delete-tape

Status: done

## Story

As a contributor,
I want the server to apply tape edits and removals safely,
So that anyone with the scenario link can change content without breaking anonymous sharing rules (FR29, FR30, FR31, NFR12).

## Acceptance Criteria

See `epics.md` — Story 2.9 (validated payloads, same anon trust model as add-tape, delete removes row for subsequent reads, NFR14-friendly errors).

## Tasks / Subtasks

- [x] Edge Function **`update-tape`** — POST, scenario slug + tape id, text/color limits aligned with add-tape. [AC]
- [x] Edge Function **`delete-tape`** — POST, scenario slug + tape id, cascade consistency. [AC]

## Dev Agent Record

### File List

- `supabase/functions/update-tape/index.ts`
- `supabase/functions/delete-tape/index.ts`
- `supabase/functions/_shared/` (shared validation / errors)

### Change Log

- **2026-03-30:** Backfilled artifact — Story 2.9 implemented; status `done`.
