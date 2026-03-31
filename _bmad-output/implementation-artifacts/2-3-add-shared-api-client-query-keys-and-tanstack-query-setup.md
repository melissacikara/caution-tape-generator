# Story 2.3: Add shared API client, query keys, and TanStack Query setup

Status: done

## Story

As a developer,
I want one fetch layer and query key factories,
So that all features share retries, parsing, and cache invalidation rules.

## Acceptance Criteria

See `epics.md` — Story 2.3 (typed DTOs, `ApiError` from `{ error.message }`, query key factory, no service role in client bundle).

## Tasks / Subtasks

- [x] **`web/src/api/client.ts`** — `createScenario`, `getScenarioBySlug`, `addTape`, `updateTape`, `deleteTape`, `listScenarios`; Supabase anon invoke. [AC]
- [x] **`web/src/api/types.ts`** — Request/response DTO types. [AC]
- [x] **`web/src/api/queryKeys.ts`** — `scenarioKeys` factory. [AC]
- [x] **`web/src/providers/QueryProvider.tsx`** — TanStack Query client. [AC]

## Dev Agent Record

### File List

- `web/src/api/client.ts`
- `web/src/api/types.ts`
- `web/src/api/queryKeys.ts`
- `web/src/providers/QueryProvider.tsx`

### Change Log

- **2026-03-30:** Backfilled artifact — Story 2.3 implemented; status `done`.
