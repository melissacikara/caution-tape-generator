# Story 2.2: Implement Edge Functions for create-scenario, get-scenario-by-slug, and add-tape (update/delete in Story 2.9)

Status: done

## Story

As a user,
I want the server to validate and persist my scenarios and tapes safely,
So that anonymous sharing works without leaking secrets or accepting garbage payloads.

## Acceptance Criteria

See `_bmad-output/planning-artifacts/epics.md` — Story 2.2 (Zod validation, camelCase/snake_case, standard error shape, add-tape limits + idempotency, get-scenario-by-slug newest-first, 404 on bad slug).

## Tasks / Subtasks

- [x] Edge Function **`create-scenario`** — POST, validated body, returns scenario + slug. [AC]
- [x] Edge Function **`get-scenario-by-slug`** — GET with `?slug=`, returns scenario + tapes ordered newest-first. [AC]
- [x] Edge Function **`add-tape`** — POST, rate limits, max length, idempotency key support. [AC]
- [x] Shared **`_shared/`** — Zod helpers, error mapping, CORS headers. [AC]

## Dev Notes

- **Update/delete:** Implemented in Story 2.9 (`update-tape`, `delete-tape`).

## Dev Agent Record

### Completion Notes List

- REST-like JSON over Supabase Edge; errors use `{ "error": { "code", "message" } }`.

### File List

- `supabase/functions/create-scenario/index.ts`
- `supabase/functions/get-scenario-by-slug/index.ts`
- `supabase/functions/add-tape/index.ts`
- `supabase/functions/_shared/zod.ts`
- `supabase/functions/_shared/errors.ts`
- `supabase/functions/_shared/map.ts`
- `supabase/functions/_shared/cors.ts`

### Change Log

- **2026-03-30:** Backfilled artifact — Story 2.2 implemented in repo; status `done`.
