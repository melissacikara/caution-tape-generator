# Story 2.1: Create database schema for scenarios and tapes with non-guessable public slugs

Status: review

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a developer,
I want durable tables and indexes for scenarios and tapes,
So that persistence and share links are correct from day one (FR23, NFR6).

## Acceptance Criteria

1. **Given** architecture naming rules,
   **When** migrations run on a fresh database,
   **Then** **`scenarios`** and **`tapes`** exist with **snake_case** columns, **UUID** PKs, **FK** from `tapes` to `scenarios`, and **indexes** for list-by-scenario ordering,
   **And** **`public_slug`** (or equivalent) is populated using **cryptographically strong randomness**, not sequential IDs.

2. **Given** a tape row,
   **When** stored,
   **Then** **color** and **tape text** fields support **maximum lengths** aligned with the API layer (Story 2.2).

## Tasks / Subtasks

- [x] Add **`supabase/migrations/`** migration creating **`scenarios`** and **`tapes`** per `architecture.md` naming. [AC: 1]
- [x] **`public_slug`:** `UNIQUE`, **non-sequential** default (e.g. `replace(gen_random_uuid()::text, '-')`). [AC: 1]
- [x] **`tapes`:** `scenario_id` FK, **`idx_tapes_scenario_id_created_at`**, `ON DELETE CASCADE`. [AC: 1]
- [x] **`CHECK`** constraints on name / `tape_text` / `color` lengths (coordinate with Story 2.2). [AC: 2]
- [x] **RLS** enabled on both tables (deny-by-default until policies/Epics evolve). [AC: 1]
- [x] **`supabase/README.md`:** how to apply migrations + pointer to Story 2.2 limits. [AC: 2]

## Dev Notes

- **Sources:** `architecture.md` (Data Architecture, Naming Patterns), epics Story 2.1.
- **No** Edge Functions in this story (Story 2.2).

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Migration `20260330160000_create_scenarios_and_tapes.sql`: `scenarios` (id, name, public_slug default random, timestamps), `tapes` (id, scenario_id, tape_text, color, created_at), indexes, RLS enabled, CHECK lengths.
- `supabase/README.md`: apply via Supabase CLI / SQL editor.

### File List

- `supabase/migrations/20260330160000_create_scenarios_and_tapes.sql`
- `supabase/README.md`

### Change Log

- **2026-03-30:** Story 2.1 — initial schema migration + Supabase README.
