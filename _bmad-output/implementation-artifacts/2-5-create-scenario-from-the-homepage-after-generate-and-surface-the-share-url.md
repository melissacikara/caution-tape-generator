# Story 2.5: Create scenario from the homepage after Generate and surface the share URL

Status: done

## Story

As an instigator,
I want to name my scenario and get a link I can drop in chat,
So that friends can join immediately (FR9, FR19, FR2, FR27 flow).

## Acceptance Criteria

See `epics.md` — Story 2.5 (name scenario, create via Edge, navigate to `/s/:slug`, share URL visible, first tape persisted, no auth).

## Tasks / Subtasks

- [x] **`HomePage`** — locked tape + “add to scenario” flow, `createScenario` + `addTape`, navigation to scenario route, share URL UX. [AC]

## Dev Agent Record

### File List

- `web/src/pages/HomePage.tsx`
- `web/src/api/client.ts` (consumer)

### Change Log

- **2026-03-30:** Backfilled artifact — Story 2.5 implemented; status `done`.
