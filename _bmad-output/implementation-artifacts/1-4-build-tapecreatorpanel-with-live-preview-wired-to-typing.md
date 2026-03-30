# Story 1.4: Build TapeCreatorPanel with live preview wired to typing

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a user,
I want to type and see the tape update continuously,
So that the experience feels instant and intuitive (FR1).

## Acceptance Criteria

1. **Given** Direction B structure,
   **When** I view the homepage tape creator,
   **Then** I see labeled **“Warning Text”** and **“Live Preview”** sections with **bordered panels** per UX-DR4,
   **And** a real `<input>` with **`aria-label`** for caution tape text sits in the **Warning Text** block with the styled **“CAUTION:”** prefix (accent, display type) **before** the field.

2. **Given** I am typing,
   **When** each keystroke occurs,
   **Then** **`TapeRenderer`** updates **without** a submit button (live binding),
   **And** there is **no placeholder** on the tape input that breaks the **“CAUTION: + cursor”** moment (omit `placeholder` or use empty string only).

## Tasks / Subtasks

- [x] Add **`TapeCreatorPanel`** in `web/src/tape/TapeCreatorPanel.tsx` (or `web/src/tape/` alongside `TapeRenderer`). [AC: 1]
- [x] **Warning Text:** Section title exactly **“Warning Text”** (`font-ui`); bordered panel (`border-border`, `bg-surface-raised` or equivalent tokens); row layout **“CAUTION:”** (accent, `font-display`, uppercase) + **`<input type="text">`** with `aria-label` per epic (e.g. “Caution tape warning text”); **no** instructional placeholder. [AC: 1, 2]
- [x] **Live Preview:** Section title **“Live Preview”**; bordered panel containing **`TapeRenderer`** fed from the same text state as the input. [AC: 1, 2]
- [x] **Color for preview:** Use default tape color **`#FFD000`** internally, **or** a minimal native `<input type="color">` only if needed for continuity with Story 1.3 — **do not** build **ColorPickerSwatch** (Story 1.5). [AC: 2]
- [x] **`App.tsx`:** Render **`TapeCreatorPanel`** as the main home content (remove ad-hoc duplicate inputs from Story 1.3 demo). [AC: 1]
- [x] **Verify** `npm run build` and `npm run lint`. [AC: 1, 2]

## Dev Notes

### Scope boundaries

- **Do not** add **Generate** / **locked tape** behavior — Story 1.7.
- **Do not** add **ColorPickerSwatch** product UI — Story 1.5.
- **Do not** add **AppHeader**, routing, or backend.

### References

- UX-DR4 (epics): Command Center — labeled Warning Text + Live Preview; real input + aria-label; color swatch row appears in full UX — **minimal color control** acceptable until 1.5.
- NFR1: No perceptible lag as defect threshold — keep render path simple (controlled input → `TapeRenderer`).

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

_None._

### Completion Notes List

- Added `TapeCreatorPanel` with **Warning Text** + **Live Preview** sections, bordered panels, `CAUTION:` + controlled `<input>` (`aria-label="Caution tape warning text"`), no placeholder.
- Live preview: `TapeRenderer` bound to same `warningText` state; minimal native color input (44×44px min) for Story 1.3 continuity until Story 1.5.
- `App.tsx` renders only `TapeCreatorPanel` in a max-width shell (`max-w-[640px]` per UX).
- `npm run build` and `npm run lint` pass.

### File List

- `web/src/tape/TapeCreatorPanel.tsx`
- `web/src/tape/index.ts`
- `web/src/App.tsx`

### Change Log

- **2026-03-30:** Story 1.4 — TapeCreatorPanel + App wiring.
