# Story 2.8: Wire CORS, environment variables, and deployment-facing configuration

Status: done

## Story

As a developer,
I want Edge Functions callable from Vercel and localhost,
So that contributors and creators can use real devices during development and production.

## Acceptance Criteria

See `epics.md` — Story 2.8 (allowed origins for prod + local dev; `.env.example` documents `VITE_*` only; logs via Supabase/Vercel).

## Tasks / Subtasks

- [x] **`supabase/functions/_shared/cors.ts`** — origin allowlist for Edge responses. [AC]
- [x] **`web/.env.example`** — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` documented. [AC]

## Dev Agent Record

### File List

- `supabase/functions/_shared/cors.ts`
- `web/.env.example`

### Change Log

- **2026-03-30:** Backfilled artifact — Story 2.8 implemented; status `done`.
