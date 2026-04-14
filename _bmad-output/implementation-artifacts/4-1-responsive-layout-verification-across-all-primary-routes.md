# Story 4.1: Responsive layout verification across all primary routes

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a user,
I want every screen to work on a phone passed around a table,
So that the experience is consistently usable (FR26, UX-DR16).

## Acceptance Criteria

1. **Given** mobile-first layouts,
   **When** I exercise **About** (`/about`), **Library / create** (`/create` — both library grid and tape-creator flows), and **scenario** (`/s/:slug`) at **narrow mobile** (e.g. 375–390px width) and **desktop** (e.g. ≥768px / `md` breakpoint),
   **Then** no view breaks with clipping or overflow in a way that **hides primary actions** (create scenario, add tape, primary CTAs, ghost back / library entry, auth),
   **And** max-width / centering stay consistent with UX-DR16: content containers use **`max-w-[480px]`** by default and **`md:max-w-[640px]`** at `md+`, centered with horizontal padding (`px-4`, `md:px-6` where already applied).

2. **Given** UX-DR16 (no hover-only interactions),
   **When** I use **touch** (or keyboard without hover),
   **Then** no **required** interaction depends solely on `:hover` to be discoverable or actionable — decorative hover (e.g. border/text emphasis) is fine if default state is already usable and focus/tap paths exist.

## Tasks / Subtasks

- [x] **Task 1: Define verification matrix** (AC: #1)
  - [x] List routes and substates: `/about`; `/create` with `view=library` and `view=create` (empty vs known slugs if needed); `/s/:slug` with panels closed, add-tape open, edit open, delete confirm, report flow if time permits
  - [x] For each, record viewport widths to test (mobile + `md+`)

- [x] **Task 2: Fix responsive / overflow issues** (AC: #1)
  - [x] Inspect header (`AppHeader`), main shells (`HomePage`, `AboutPage`, `ScenarioPage`), `ScenarioLibrary` grid (`grid-cols-1` → `sm:grid-cols-2`), tape creator (`TapeCreatorPanel`), and modals/sheets for horizontal overflow, fixed widths, or missing `min-w-0` on flex children
  - [x] Align any drift from `max-w-[480px] md:max-w-[640px]` + `mx-auto` / `flex justify-center` patterns used on `AboutPage`, `HomePage`, and `ScenarioPage`
  - [x] Ensure `AppLayout` root `overflow-x-hidden` is not masking bugs — fix sources of overflow rather than relying on clipping alone

- [x] **Task 3: Hover-only audit** (AC: #2)
  - [x] Search for `hover:` usage; confirm no control is **only** usable with hover (e.g. no `group-hover` revealing sole affordance without focus/active equivalent)
  - [x] Document any intentional “nice-to-have” hover polish vs required interaction paths

- [x] **Task 4: Regression tests** (AC: #1–#2)
  - [x] Add or extend **Vitest** tests where they catch real layout contracts (e.g. snapshot of key class strings is brittle — prefer testing that primary wrappers include expected max-width tokens, or small structural tests on `ScenarioLibrary` grid classes)
  - [x] Run `cd web && npm test` — all tests pass (61 after review close-out)

## Dev Notes

### Scope

This story is **verification and corrective layout polish** for FR26 / UX-DR16 on existing Phase 2 routes. It is **not** Epic 4 performance (4.2), reliability (4.3), full a11y audit (4.4), or security review (4.5).

### Primary routes (current router)

All routes live in `web/src/router.tsx` only [Source: `web/src/router.tsx`].

| User-facing surface | Path | Main components |
|---------------------|------|-----------------|
| About (front door) | `/about` | `AboutPage` |
| Library + tape creator | `/create` | `HomePage`, `ScenarioLibrary`, `TapeCreatorPanel` |
| Scenario view | `/s/:slug` | `ScenarioPage` |

Optional sanity: `NotFoundPage`, `AuthCallbackPage` — quick pass if issues spill from shared layout.

### UX tokens (must stay consistent)

- **Max width:** `max-w-[480px]` default; `md:max-w-[640px]` at `md+` [Source: `_bmad-output/planning-artifacts/epics.md` UX-DR16; `ux-design-specification.md` responsive table]
- **Library grid:** 1 column mobile; 2 columns from `sm` — already `grid-cols-1 sm:grid-cols-2` in `ScenarioLibrary` [Source: `web/src/components/ScenarioLibrary.tsx`]
- **Tap targets:** Project standard `min-h-[44px]` on interactive elements [Source: `_bmad-output/project-context.md` — Tailwind rules]. If verification finds controls under 44px that are primary actions, fix in this story; minor tertiary controls may be noted for4.4 if scope explodes.

### Files likely to touch

- `web/src/pages/HomePage.tsx` — main wrapper `max-w-[480px] md:max-w-[640px]`
- `web/src/pages/AboutPage.tsx` — article wrapper
- `web/src/pages/ScenarioPage.tsx` — multiple `max-w-*` blocks; scroll regions (`overflow-y-auto`, `max-h-[min(70svh,28rem)]`); tape strip `overflow-x-auto`
- `web/src/components/AppHeader.tsx` — `max-w-[480px] md:max-w-[640px]` inner bar; watch long email truncation
- `web/src/layout/AppLayout.tsx` — full-height column, `overflow-x-hidden`
- `web/src/components/ScenarioLibrary.tsx` — grid and card links
- `web/src/tape/TapeCreatorPanel.tsx` — full-width controls on small screens

### Architecture compliance

- **No new global state stores**; layout fixes only [Source: `project-context.md`]
- **Tailwind v4:** semantic tokens from `@theme` in `web/src/index.css` — no raw hex in JSX for theme colors
- **React Router:** no new route files outside `router.tsx`

### Testing standards

- Co-locate tests: `*.test.tsx` next to source [Source: `project-context.md`]
- `npm test` in `web/` runs `vitest run`
- Prefer behavioral / structural assertions over pixel snapshots

### Previous story intelligence (Epic 3)

- Story **3-3** established logo → `/about`, Library → `/create` with `state={{ library: true }}`, and warned not to conflate with future library redesign [Source: `_bmad-output/implementation-artifacts/3-3-navigation-header-update.md`]
- **Do not** change header navigation semantics in this story unless required to fix a responsive bug

### Sprint alignment note

`Sprint-status.yaml` was **out of date**: it listed an old “Library Redesign” Epic 4. Planning source of truth is `_bmad-output/planning-artifacts/epics.md` — Epic 4 is **Polished, resilient, inclusive experience**. This story key matches that epic’s Story 4.1.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4, Story 4.1]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — responsive breakpoints, max-width]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR26]
- [Source: `_bmad-output/project-context.md` — stack, Tailwind, testing, file structure]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (2026-04-13)

### Debug Log References

No blockers encountered.

### Completion Notes List

- **Task 1 (Verification Matrix):** Defined matrix covering `/about`, `/create` (view=library + view=create), `/s/:slug` (panels closed / add open / edit open / delete confirm) at 375px and 768px+ viewports.
- **Task 2 (Overflow fix):** Identified `AppHeader` logo overflow on narrow viewports — "⚠ Caution Tape Generator" in Bebas Neue `text-base` plus a full nav row exceeded the 343px available at 375px. Fixed by adding `flex-1 min-w-0 truncate` to the logo link (allows graceful shrink with ellipsis) and `shrink-0 gap-3 md:gap-5` to the nav (always fully visible, tighter gap on mobile). All other pages (`AboutPage`, `HomePage`, `ScenarioPage`) already had correct `max-w-[480px] md:max-w-[640px]` + `mx-auto` patterns. `AppLayout` `overflow-x-hidden` confirmed present — logo fix removes the underlying cause it was masking.
- **Task 3 (Hover-only audit):** Audited all 15 `hover:` usages across 8 files. Every hover state is purely decorative (color/border emphasis). All interactive elements have visible default state, tap targets, and `focus-visible:` rings. No required interaction is gated behind hover. `AuthCallbackPage` "Try again" link lacks an explicit `focus-visible:` ring style but falls outside primary routes and is a pre-existing minor issue; noted for 4.4.
- **Task 4 (Tests):** Created `AppHeader.test.tsx` (11 tests — logo href, responsive flex classes, nav shrink-0, gap classes, anonymous auth + login modal, **signed-in** email truncation, nav contract, `signOut`) and `ScenarioLibrary.test.tsx` (8 tests — grid structure, link hrefs, tap targets, loading/error/empty states). All **61** tests pass with no regressions.

### File List

- `web/src/components/AppHeader.tsx` — modified: `flex-1 min-w-0 truncate` on logo link; `shrink-0 gap-3 md:gap-5` on nav
- `web/src/components/AppHeader.test.tsx` — created/extended: structural + behavioral tests (includes signed-in header coverage after code review)
- `web/src/components/ScenarioLibrary.test.tsx` — created: 8 structural + behavioral tests

### Change Log

- 2026-04-13: Responsive layout verification pass (story 4-1). Fixed AppHeader logo overflow on narrow mobile viewports. Verified no hover-only interactions. Added AppHeader and ScenarioLibrary test coverage.
- 2026-04-13: Code review close-out — added signed-in `AppHeader` Vitest coverage (`vi.hoisted` auth stub); story marked **done**.

### Review Findings

- [x] [Review][Patch] Signed-in `AppHeader` regression tests — applied in `AppHeader.test.tsx` (hoisted auth mock; email + Sign out + nav gap contract + `signOut` click).
