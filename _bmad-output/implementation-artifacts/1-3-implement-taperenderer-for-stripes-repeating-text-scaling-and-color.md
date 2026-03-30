# Story 1.3: Implement TapeRenderer for stripes, repeating text, scaling, and color

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a user,
I want my warning text to look like real caution tape,
So that the joke lands because the format looks official.

## Acceptance Criteria

1. **Given** `text` and `color` inputs,
   **When** text is non-empty,
   **Then** the tape shows diagonal stripes, repeating **“CAUTION: [text]”** with the **PRD separator** between repeats (`⚠` per FR4 / UX spec),
   **And** industrial all-caps typography (**Bebas Neue** via `font-display`),
   **And** the tape uses the selected **color** (stripe field + readable text contrast),
   **And** tape **length scales visibly** with character count (FR5).

2. **Given** empty input,
   **When** the component is in **`empty`** state,
   **Then** preview shows an appropriate **empty / placeholder** treatment (UX-DR15: muted placeholder or empty preview region — not fake tape content).

3. **Given** UX-DR3 / accessibility,
   **When** the implementation uses canvas or non-text rendering,
   **Then** assistive technology receives the tape message (e.g. `aria-label` on a single surface, or real text in the DOM — **not** image-only with no accessible name).

## Tasks / Subtasks

- [x] Add **`TapeRenderer`** under `web/src/tape/TapeRenderer.tsx` (feature folder per architecture). Props at minimum: `text: string`, `color: string` (hex), `state?: 'empty' | 'live' | 'generated'` (default derived from `text.trim()` for empty vs non-empty). [AC: 1–3]
- [x] **Non-empty:** Diagonal **repeating-linear-gradient** stripes using `color` + a darker mix for alternate stripe; repeating **text nodes** reading `CAUTION: {TEXT} ⚠` (uppercase) in a horizontal row; **min-width / width** scales with `text.length` (FR5). [AC: 1]
- [x] **Empty:** Muted bordered / dashed preview region consistent with tokens — **no** repeating CAUTION string. [AC: 2]
- [x] **A11y:** Prefer **visible text** in the DOM for the repeating label; if any purely decorative layer exists, mark it `aria-hidden`; ensure container has a clear accessible name (`aria-label` with full phrase) if needed so SR users get the tape message. [AC: 3]
- [x] **Demo only in `App.tsx`:** Minimal controls (e.g. local `useState` + `<input type="text">` + `<input type="color">` or default hex) to prove the component — **do not** build **TapeCreatorPanel** (Story 1.4). [AC: 1]
- [x] **Verify** `npm run build` and `npm run lint`. [AC: 1–3]

## Dev Notes

### Scope boundaries

- **Do not** build TapeCreatorPanel, AppHeader, routing, or color picker product UI beyond a **minimal** `<input type="color">` if needed for testing.
- **Do not** add TanStack Query, Supabase, or backend.

### Product rules (canonical)

| Source | Rule |
|--------|------|
| **FR4** | Repeating pattern includes **`⚠`** between segments, e.g. `CAUTION: [text] ⚠ CAUTION: [text] ⚠` |
| **FR5** | Tape rendered **length** scales with **character count** of input text |
| **UX spec** | Tape anatomy: diagonal stripe layer + repeating `CAUTION: [text] ⚠` in **Bebas Neue** all-caps |
| **UX-DR15** | Live preview empty → muted placeholder or empty preview region |
| **UX-DR3** | If non-text-only technique is used, expose tape string to AT |

### Architecture compliance

- Feature folder: **`web/src/tape/`** [Source: `architecture.md` — Frontend Architecture]
- Styling: Tailwind + tokens; **tape field colors** may use **inline CSS variables** from the `color` prop (dynamic user picks) — avoid hardcoded **shell** hex where shell tokens apply [Source: UX-DR1]

### Previous story intelligence

- **`font-display`**, **`font-ui`**, and **`@theme`** colors exist in `src/index.css`.
- Use **`font-display`** for tape lettering; default tape **chrome** can follow UX (yellow default `#FFD000` aligns with `accent` token).

### Testing

- Manual + build/lint; Vitest optional.

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.3, FR4, FR5, UX-DR3, UX-DR15]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR4, FR5]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — TapeRenderer anatomy]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Frontend Architecture]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

_None._

### Completion Notes List

- Added `TapeRenderer` with diagonal stripe background (repeating linear gradient), repeating `CAUTION: [TEXT] ⚠` segments, `font-display`, dynamic `minWidth` in `ch` for FR5, `mixTowardBlack` for alternate stripe, luminance-based ink color.
- Empty: dashed `border-border` / `bg-surface-raised` + muted copy (UX-DR15).
- A11y: `role="img"` + `aria-label` on non-empty tape; decorative stripe + repeating row `aria-hidden` to avoid repetitive announcements.
- `App.tsx`: minimal text + color inputs for demo only (not TapeCreatorPanel).
- `npm run build` and `npm run lint` pass.

### File List

- `web/src/tape/TapeRenderer.tsx`
- `web/src/tape/index.ts`
- `web/src/App.tsx`

### Change Log

- **2026-03-30:** Story 1.3 — TapeRenderer + minimal demo in App.
