# Story 1.5: Add ColorPickerSwatch with spectrum selection and labeled value

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a user,
I want to pick any tape color before I lock in a tape,
So that the warning matches the vibe I want (FR3).

## Acceptance Criteria

1. **Given** UX-DR5,
   **When** I use the color control,
   **Then** I can choose a **full-spectrum** color (MVP: **native `<input type="color">`**; document follow-up for a refined HSL UI in `web/README.md`),
   **And** the **selected value is shown as text** next to the swatch (**not** color-only feedback).

2. **Given** I change color,
   **When** the value updates,
   **Then** **`TapeRenderer`** reflects the new color **immediately** (FR8),
   **And** the interactive swatch meets **minimum ~44×44px** touch target (UX-DR16).

## Tasks / Subtasks

- [x] Add **`ColorPickerSwatch`** in `web/src/tape/ColorPickerSwatch.tsx` (or `web/src/tape/`). Controlled API: `value` (hex string), `onChange` (next hex). [AC: 1, 2]
- [x] **UI:** Visible **swatch** (shows current color) + **monospace / `font-ui` text** with hex (e.g. `#RRGGBB`); native color input provides full spectrum; **≥44×44px** hit area. [AC: 1, 2]
- [x] **`TapeCreatorPanel`:** Replace the ad-hoc color row with **`ColorPickerSwatch`**; keep **`TapeRenderer`** wired so color updates live (FR8). [AC: 2]
- [x] **`web/README.md`:** Short note that MVP uses the native color input; optional Phase 3 HSL picker follow-up. [AC: 1]
- [x] Export from `web/src/tape/index.ts`; run **`npm run build`** and **`npm run lint`**. [AC: 1, 2]

## Dev Notes

- **Scope:** No AppHeader (1.6), no Generate lock (1.7), no backend.
- **Source:** UX-DR5, FR3, FR8, epics Story 1.5.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Added `ColorPickerSwatch`: native `input type="color"` (full spectrum per browser), visible swatch via background + transparent input overlay, **hex shown in uppercase** next to swatch (`aria-live="polite"`), **44×44px** minimum target, focus ring on `focus-within`.
- `TapeCreatorPanel` uses `ColorPickerSwatch` instead of raw inputs; `TapeRenderer` still receives `tapeColor` state (FR8).
- `README.md`: MVP vs future HSL picker note.
- `npm run build` and `npm run lint` pass.

### File List

- `web/src/tape/ColorPickerSwatch.tsx`
- `web/src/tape/TapeCreatorPanel.tsx`
- `web/src/tape/index.ts`
- `web/README.md`

### Change Log

- **2026-03-30:** Story 1.5 — ColorPickerSwatch + TapeCreatorPanel wiring + README.
