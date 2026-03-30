# Story 1.7: Implement Generate, locked tape state, and Reset

Status: review

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a user,
I want to deliberately “lock in” my tape after previewing,
So that I can separate creative confirmation from later sharing actions (local confirmation before Epic 2 persistence).

## Acceptance Criteria

1. **Given** UX-DR11,
   **When** Generate is available,
   **Then** there is **one primary** full-width yellow action (**min ~44px** height) in the footer zone for this step,
   **And** tapping **Generate** with **empty** input does **nothing silently** (no disabled styling).

2. **Given** I tap **Generate** with non-empty text,
   **When** generation completes,
   **Then** the tape enters a **locked / generated** state **distinct** from live typing,
   **And** a **secondary Reset** clears the flow **without** confirmation modals.

3. **Given** Epic 2 is not shipped,
   **When** this story ships,
   **Then** **“Add to scenario”** is **not** shown as a working action (no fake persistence).

## Tasks / Subtasks

- [x] **`TapeCreatorPanel`:** Footer with **Generate** (primary `bg-accent` / `text-accent-text`, full width, ≥44px height) and **Reset** (secondary bordered muted). Empty Generate → no-op. [AC: 1]
- [x] **Lock state:** On Generate with text, snapshot text + color; **`TapeRenderer`** receives `state="generated"` and distinct styling; **disable** editing inputs + color until Reset. [AC: 2]
- [x] **`TapeRenderer`:** Visual distinction for `state === 'generated'` (e.g. accent ring). [AC: 2]
- [x] **`ColorPickerSwatch`:** Support **`disabled`** when tape is locked. [AC: 2]
- [x] **No** “Add to scenario” CTA (stub removed / hidden). [AC: 3]
- [x] **`npm run build`** + **`npm run lint`**. [AC: 1–3]

## Dev Notes

- **References:** UX-DR11, epics Story 1.7, FR2 (local only until Epic 2).

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- **Generate:** full-width primary (`min-h-[44px]`); empty `warningText` → handler returns immediately (no `disabled` on button).
- **Lock:** `lockedTape` snapshot; preview uses locked text/color; `TapeRenderer` `state="generated"` + **accent ring** + updated `aria-label`.
- **While locked:** text input + `ColorPickerSwatch` **disabled**; **Generate** hidden; **Reset** clears lock + draft + default color (no modal).
- **Reset** always visible (secondary); when editing, clears draft to defaults.
- No “Add to scenario” button (Epic 2).

### File List

- `web/src/tape/TapeCreatorPanel.tsx`
- `web/src/tape/TapeRenderer.tsx`
- `web/src/tape/ColorPickerSwatch.tsx`

### Change Log

- **2026-03-30:** Story 1.7 — Generate, locked preview, Reset, `disabled` swatch, generated ring on tape.
