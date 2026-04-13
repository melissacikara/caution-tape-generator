# Story 1.4: Context-Aware CTAs

Status: done

## Story

As a user,
I want the call-to-action buttons to reflect what I'm actually doing in the app,
so that the tone is consistent and the app feels like it was designed as a system (not generic labels slapped on).

## Acceptance Criteria

1. **Given** I am on the home page tape creator (no scenario context)
   **When** I view the Generate button in the `TapeCreatorPanel` footer
   **Then** the button reads **"ISSUE A WARNING"** instead of "Generate"

2. **Given** I am on a scenario page (`/s/:slug`)
   **When** I view the pinned bottom action button while the add panel is closed
   **Then** the button reads **"ADD TO THE CHAOS"** instead of "Add tape"

3. **Given** I am on a scenario page with the add panel open
   **When** I view the pinned action button
   **Then** it still reads "Close" (no change — closing is a neutral action, not a CTA)

4. **Given** I am inside the add-tape panel on a scenario page, about to submit a tape
   **When** I view the submit button in the add panel
   **Then** the button reads **"ADD TO THE CHAOS"** instead of "Add tape"

5. **Given** I am in the add panel and a submission is in-flight
   **When** the mutation is pending
   **Then** the button reads "Adding…" (no change — loading copy stays neutral/functional)

6. **Given** I tap "ISSUE A WARNING" with empty warning text
   **When** the button fires
   **Then** nothing happens silently — same behavior as current "Generate" with empty input (AC from Story 1.7: no disabled styling, empty tap is a no-op)

7. **Given** I am logged out and tap "ISSUE A WARNING"
   **When** the login gate fires
   **Then** it opens the `LoginModal` as before — CTA rename does not affect gate logic

8. **Given** I am on the home page scenario panel after locking a tape
   **When** I view the "Create scenario & open" and "Add tape & open" buttons
   **Then** those labels remain **unchanged** — they describe navigation actions, not tone-setting CTAs

## Tasks / Subtasks

- [x] **Task 1: Update Generate button in `TapeCreatorPanel`** (AC: #1, #6, #7)
  - [x] In `web/src/tape/TapeCreatorPanel.tsx`, change the button label from `'Generate'` to `'ISSUE A WARNING'`
  - [x] No logic changes — only the string label changes; all gate/empty-input behavior is unchanged

- [x] **Task 2: Update pinned add button label in `ScenarioPage`** (AC: #2, #3)
  - [x] In `web/src/pages/ScenarioPage.tsx`, locate the pinned bottom button (around line 688)
  - [x] Change `'Add tape'` (the closed state label) to `'ADD TO THE CHAOS'`
  - [x] Keep `'Close'` label unchanged (AC: #3)

- [x] **Task 3: Update the submit button inside the add-tape panel** (AC: #4, #5)
  - [x] In `web/src/pages/ScenarioPage.tsx`, locate the add-tape submit button (around line 659)
  - [x] Change the `'Add tape'` label to `'ADD TO THE CHAOS'`
  - [x] Keep `'Adding…'` pending copy unchanged (AC: #5)

- [x] **Task 4: Verify no other "Generate" or "Add tape" labels exist** (AC: comprehensive)
  - [x] Search codebase for string `'Generate'` in JSX — confirm no other primary-action instances remain
  - [x] Search codebase for string `'Add tape'` in JSX — confirm all instances updated
  - [x] Confirm `'Create scenario & open'` and `'Add tape & open'` in `HomePage.tsx` are **untouched** (AC: #8)

- [x] **Task 5: Run test suite** (regression guard)
  - [x] Run `cd web && npm test` — no new failures

## Dev Notes

### What This Story Is and Is Not

**IS:**
- A pure copy/label change on 3 specific buttons: Generate, Add tape (pinned), Add tape (submit)
- Tone-setting — makes the CTA copy on-brand with the brainstorming decision (#7 from Phase 2 brainstorming)

**IS NOT:**
- Any logic change, state change, or behavior change
- A change to: loading states ("Adding…"), navigation buttons ("Create scenario & open", "Add tape & open"), secondary actions ("Reset", "Close", "Edit", "Delete", "Copy link")
- A change to any Edge Function, API, or backend
- A change to any test assertion (tests don't assert button labels in these components)

### Exact Files to Touch

| File | Change |
|------|--------|
| `web/src/tape/TapeCreatorPanel.tsx` | Line ~126: `'Generate'` → `'ISSUE A WARNING'` |
| `web/src/pages/ScenarioPage.tsx` | Line ~659: `'Add tape'` (submit) → `'ADD TO THE CHAOS'` |
| `web/src/pages/ScenarioPage.tsx` | Line ~688: `'Add tape'` (pinned CTA) → `'ADD TO THE CHAOS'` |

**DO NOT touch:**
- `web/src/pages/HomePage.tsx` — "Create scenario & open", "Add tape & open" are navigation labels, not tone CTAs
- Any loading/pending states ("Adding…", "Creating…")
- The "Close" label on the pinned button when add panel is open
- Any other button in the app

### Current Code — Exact Strings to Find and Replace

**TapeCreatorPanel.tsx** (Generate button, footer section):
```tsx
// BEFORE — around line 126
          Generate
// AFTER
          ISSUE A WARNING
```

**ScenarioPage.tsx** (add-tape submit button, inside add panel):
```tsx
// BEFORE — around line 659
                  {addMutation.isPending ? 'Adding…' : 'Add tape'}
// AFTER
                  {addMutation.isPending ? 'Adding…' : 'ADD TO THE CHAOS'}
```

**ScenarioPage.tsx** (pinned bottom CTA):
```tsx
// BEFORE — around line 688
                {addOpen ? 'Close' : 'Add tape'}
// AFTER
                {addOpen ? 'Close' : 'ADD TO THE CHAOS'}
```

### Typography Note

The new labels use all-caps by convention of the app's industrial tone. However, `TapeCreatorPanel`'s Generate button uses `font-ui text-sm font-medium` (DM Mono, not Bebas Neue). All-caps on DM Mono is intentional — matches existing "Warning Text", "Tape color", etc. section labels. No additional CSS changes needed; `text-sm` keeps the button compact even with the longer label.

For `ScenarioPage`, the pinned button already uses `uppercase tracking-wide font-ui text-sm font-semibold` — `ADD TO THE CHAOS` fits naturally in this style.

### Regression Guard

The following must remain unaffected:
- Live tape preview updates as user types (no changes to input handling)
- Login gate behavior on Generate / Add tape (logic untouched)
- Empty-input Generate no-op behavior (logic untouched)
- "Create scenario & open" and "Add tape & open" buttons in `HomePage`
- Edit, Delete, Reset, Close, Copy link buttons everywhere
- All 17+ pre-existing tests (none assert these specific label strings)

### Source: Brainstorming Decision

From `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md`:

> **Context-Aware CTAs (#7):** "ISSUE A WARNING" on the home page. "ADD TO THE CHAOS" inside someone else's scenario. Copy does the tone-setting before a single feature is explained.

This is the authoritative source for the exact copy.

### Previous Story Context (Story 1.3)

Story 1.3 added `useLoginGate` to gate Generate and Add tape actions. This story changes only the displayed label — the gate wiring at those call sites is already in place and must not be touched. Specifically:

- `TapeCreatorPanel.tsx`: `handleGenerate()` already checks `if (user === null) { openLoginGate(); return }` before locking tape
- `ScenarioPage.tsx`: pinned button handler already checks `else if (user === null) { openLoginGate() }` before `openAddPanel()`

Both gates survive the label change since the logic is in `onClick`/`handleGenerate`, not in the label JSX.

### Testing Requirements

- Run: `cd web && npm test` (vitest run)
- No new test files needed — this is a pure string change with no testable logic
- Pre-existing failures: `document is not defined` in color picker tests — pre-existing, not a regression

## References

- Phase 2 brainstorming source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Theme 1 / Idea #7
- `web/src/tape/TapeCreatorPanel.tsx` — Generate button (~line 126)
- `web/src/pages/ScenarioPage.tsx` — add submit (~line 659), pinned CTA (~line 688)
- Story 1.3 completion: `_bmad-output/implementation-artifacts/1-3-login-gate-on-tape-and-scenario-creation.md` — login gate wiring already in place at these call sites
- UX-DR11: no disabled states on Generate; empty tap is a no-op

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Pure string label changes on 3 buttons: TapeCreatorPanel Generate → "ISSUE A WARNING"; ScenarioPage add-panel submit "Add tape" → "ADD TO THE CHAOS"; ScenarioPage pinned CTA "Add tape" → "ADD TO THE CHAOS"
- No logic, behavior, or test changes required
- All 17 pre-existing tests pass (2 test files) — zero regressions
- HomePage "Add tape & open" and "Create scenario & open" left untouched per AC #8
- "Close", "Adding…", "Reset", and all other button labels untouched

### File List

- web/src/tape/TapeCreatorPanel.tsx
- web/src/pages/ScenarioPage.tsx

### Change Log

- 2026-04-11: Story 1-4 implemented — renamed Generate to "ISSUE A WARNING" and both "Add tape" CTAs to "ADD TO THE CHAOS"
