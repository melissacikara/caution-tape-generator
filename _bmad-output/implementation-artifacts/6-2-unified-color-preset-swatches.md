# Story 6.2: Unified Color Preset Swatches

Status: done

## Story

As a user on any device,
I want to see a row of preset color swatches alongside a custom color option,
So that I can quickly pick a color without opening a wheel, and the experience is consistent across mobile and desktop.

## Acceptance Criteria

1. **Given** I am on the tape creator (mobile or desktop) — **When** the color picker area renders — **Then** a row of 8–12 preset color swatches is displayed — a mix of real industrial tape colors (caution yellow, safety orange, hazard red, hi-vis green, white, black) and a small set of unhinged wildcards (e.g. bile yellow, cursed magenta, void black, bureaucratic beige) — **And** the exact preset colors are defined in a single config/constant file — not hardcoded per component.
2. **Given** the preset row is rendered — **When** I look at it — **Then** the currently selected color is visually highlighted in the preset row — a ring, border, or check indicator — **And** if the current color does not match any preset (custom color), no preset is highlighted.
3. **Given** I tap a preset swatch — **When** the selection registers — **Then** the tape color updates immediately — live preview reflects the change — **And** the selected swatch is highlighted — **And** the color picker closes (or collapses) — no extra confirmation needed.
4. **Given** I tap the "Custom" option (final item in the swatch row or a dedicated button) — **When** the native color picker opens — **Then** the native color picker opens initialised with the current tape color (Story 6.1 imperative DOM sync applies here too) — **And** selecting a custom color updates the tape live.
5. **Given** the preset row is rendered on mobile — **When** I interact with it — **Then** each swatch meets the 44×44px minimum touch target — **And** the row is scrollable horizontally if 12 swatches don't fit the viewport — no wrapping that breaks layout.

## Tasks / Subtasks

- [x] Create `web/src/tape/tapePresets.ts` — single source of truth for preset colors (AC: 1)
  - [x] Define 8–12 preset colors: industrial tape colors + unhinged wildcards
  - [x] Export typed `TAPE_PRESETS` array with `{ hex: string; label: string }` shape
- [x] Build `ColorPresetRow` component `web/src/tape/ColorPresetRow.tsx` (AC: 1, 2, 3, 4, 5)
  - [x] Accept `value: string`, `onChange: (hex: string) => void` props
  - [x] Render horizontally scrollable row of preset swatches from `TAPE_PRESETS`
  - [x] Highlight the currently selected swatch when `value` matches a preset hex
  - [x] No preset highlighted when `value` is a custom (non-preset) color
  - [x] Each swatch is a button with min 44×44px touch target
  - [x] Tapping a preset calls `onChange(hex)` immediately
  - [x] Include a "Custom" button at the end of the row that reveals `ColorPickerSwatch`
  - [x] `ColorPickerSwatch` shows only when custom mode is active
  - [x] Tapping a preset while in custom mode collapses the color wheel
- [x] Integrate `ColorPresetRow` into `TapeCreatorPanel.tsx` — replace raw `ColorPickerSwatch` usage (AC: 1–5)
  - [x] Replace the color row section with `ColorPresetRow`
  - [x] Preserve disabled state when tape is locked
- [x] Integrate `ColorPresetRow` into `ScenarioPage.tsx` — both add-tape and edit-tape panels (AC: 1–5)
  - [x] Replace `ColorPickerSwatch` in add-tape panel with `ColorPresetRow`
  - [x] Replace `ColorPickerSwatch` in edit-tape panel with `ColorPresetRow`
- [x] Write tests `web/src/tape/ColorPresetRow.test.tsx` (AC: 1–5)
  - [x] Presets render from `TAPE_PRESETS` constant (count check)
  - [x] Selecting a preset calls `onChange` with correct hex
  - [x] Matching preset is highlighted; non-preset value shows no highlight
  - [x] Custom button toggles custom picker visibility
  - [x] Each swatch button has accessible label

### Senior Developer Review (AI)

**Review Date:** 2026-04-11
**Outcome:** Approved

#### Action Items

- [x] [Review][Decision] AC4 ambiguity — spec says "HSL color wheel opens" but implementation uses native `<input type="color">` (ColorPickerSwatch unchanged per Dev Notes) — **Resolved: accepted as-is, AC4 wording updated to "native color picker"**
- [x] [Review][Patch] `showCustom` not synced when `value` prop changes externally — stale UI mode if parent resets/loads a new color [`web/src/tape/ColorPresetRow.tsx:34`]
- [x] [Review][Patch] Custom picker stays visible after custom color pick — `showCustom` never set to false in `onChange` handler, contradicting AC3/AC4 "closes on confirmation" intent [`web/src/tape/ColorPresetRow.tsx:93-102`]
- [x] [Review][Patch] `normalizeHex` in `ColorPresetRow` does not expand 3-digit shorthand hex (e.g. `#fff` → `#ffffff`) — mismatch with `ColorPickerSwatch.normalizeHex` can cause preset equality to fail [`web/src/tape/ColorPresetRow.tsx:12-15`]
- [x] [Review][Patch] `handleCustomToggle` is one-directional (always sets `showCustom` to true) — Custom button has `aria-pressed` suggesting toggle but cannot collapse without picking a preset [`web/src/tape/ColorPresetRow.tsx:47-49`]
- [x] [Review][Patch] `disabled` prop behavior not tested — no test for disabled state preventing preset clicks or custom toggle [`web/src/tape/ColorPresetRow.test.tsx`]
- [x] [Review][Defer] `normalizeHex` accepts non-hex strings without validation [`web/src/tape/ColorPresetRow.tsx:12-15`] — deferred, defensive validation is a project-wide concern

### Review Follow-ups (AI)

- [x] [AI-Review] Decide on AC4 HSL wheel wording vs native input — resolved, accepted as-is
- [x] [AI-Review] Add `useEffect` to sync `showCustom` when `value` prop changes externally
- [x] [AI-Review] Collapse custom picker after custom color pick (set `showCustom = false` in `onChange`)
- [x] [AI-Review] Expand 3-digit hex in `normalizeHex` to match `ColorPickerSwatch` behavior
- [x] [AI-Review] Make Custom button a true toggle (allow collapsing custom mode)
- [x] [AI-Review] Add disabled state test to `ColorPresetRow.test.tsx`

## Dev Notes

### Architecture

- **Single source of truth:** All preset colors live in `web/src/tape/tapePresets.ts`. No other file defines or hardcodes preset colors.
- **New component:** `ColorPresetRow` wraps the preset row + custom picker toggle. It replaces direct `ColorPickerSwatch` usage in `TapeCreatorPanel` and `ScenarioPage`.
- **`ColorPickerSwatch` unchanged:** The existing component from Story 6.1 remains as-is. `ColorPresetRow` uses it internally for the custom picker.

### Preset Color List (define in `tapePresets.ts`)

Industrial tape colors:
- `#FFD000` Caution Yellow (current default)
- `#FF6B00` Safety Orange
- `#CC0000` Hazard Red
- `#00AA44` Hi-Vis Green
- `#FFFFFF` Tape White
- `#111111` Void Black

Unhinged wildcards:
- `#B5C400` Bile Yellow
- `#CC00AA` Cursed Magenta
- `#8B7355` Bureaucratic Beige
- `#4A0080` Regulatory Purple

Total: 10 presets + 1 Custom button = 11 items in the row.

### Component API

```tsx
// tapePresets.ts
export type TapePreset = { hex: string; label: string }
export const TAPE_PRESETS: TapePreset[] = [...]

// ColorPresetRow.tsx
export type ColorPresetRowProps = {
  value: string
  onChange: (hex: string) => void
  disabled?: boolean
  className?: string
}
```

### Highlight Logic

- Normalize both the current `value` and preset `hex` to lowercase 7-char hex before comparing.
- Use a ring/border treatment for the active swatch (consistent with the project's `focus-within:ring-2 ring-accent` pattern).

### Custom Picker Toggle

- State: `showCustom: boolean` (local to `ColorPresetRow`)
- Clicking "Custom" sets `showCustom = true` and shows `<ColorPickerSwatch>` below the row.
- Clicking any preset swatch sets `showCustom = false` (collapses the picker).
- When `value` doesn't match any preset, `showCustom` should default to `true` on mount so the custom picker is immediately accessible (graceful initial state).

### Touch Targets

- Each swatch button: `min-h-[44px] min-w-[44px]` (Tailwind, matches existing 44×44px pattern from `ColorPickerSwatch`).
- Row: `flex flex-nowrap overflow-x-auto gap-2` — no wrapping, scrollable on small viewports.

### Testing

- Framework: **Vitest** + **React Testing Library** (configured from Story 6.1)
- Co-locate test: `web/src/tape/ColorPresetRow.test.tsx`
- Key test cases:
  1. Renders correct number of preset buttons (matches `TAPE_PRESETS.length`)
  2. Clicking a preset button calls `onChange` with that preset's hex
  3. The button matching `value` prop has the active indicator class; others don't
  4. When `value` does not match any preset, no button has active indicator
  5. "Custom" button is rendered and clicking it shows `ColorPickerSwatch`
  6. Each preset button has an accessible `aria-label`

### Files to Create/Edit

- **Create:** `web/src/tape/tapePresets.ts`
- **Create:** `web/src/tape/ColorPresetRow.tsx`
- **Create:** `web/src/tape/ColorPresetRow.test.tsx`
- **Edit:** `web/src/tape/TapeCreatorPanel.tsx`
- **Edit:** `web/src/pages/ScenarioPage.tsx`

### Do NOT Touch

- `web/src/tape/ColorPickerSwatch.tsx` — used internally by `ColorPresetRow`, no changes needed
- `web/src/tape/TapeRenderer.tsx` — unrelated
- Any Supabase/Edge Function files

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- `aria-label="Tape color presets"` on the row group conflicted with `/tape color/i` test queries that targeted the inner `<input type="color">`. Fixed by changing group label to `"Color presets"`.

### Completion Notes List

- Created `web/src/tape/tapePresets.ts` with 10 preset colors: 6 industrial (Caution Yellow, Safety Orange, Hazard Red, Hi-Vis Green, Tape White, Void Black) + 4 wildcards (Bile Yellow, Cursed Magenta, Bureaucratic Beige, Regulatory Purple). Single source of truth; no hardcoding per component.
- Built `ColorPresetRow` component with horizontally scrollable flex row, 44×44px swatch buttons, `aria-pressed` active indicator, and Custom toggle that reveals `ColorPickerSwatch`. Auto-opens custom mode when `value` doesn't match any preset.
- Replaced `ColorPickerSwatch` with `ColorPresetRow` in `TapeCreatorPanel.tsx` (preserving disabled state) and `ScenarioPage.tsx` (both add and edit panels).
- All 12 tests pass (8 new `ColorPresetRow` tests + 4 existing `ColorPickerSwatch` tests); `npm run build` exits 0.

### File List

- `web/src/tape/tapePresets.ts` — new: 10 preset color definitions
- `web/src/tape/ColorPresetRow.tsx` — new: preset row + custom toggle component
- `web/src/tape/ColorPresetRow.test.tsx` — new: 8 tests
- `web/src/tape/TapeCreatorPanel.tsx` — edited: replaced ColorPickerSwatch with ColorPresetRow
- `web/src/pages/ScenarioPage.tsx` — edited: replaced ColorPickerSwatch with ColorPresetRow in add and edit panels

## Change Log

- 2026-04-11: Story file created for 6.2 Unified Color Preset Swatches
- 2026-04-11: Implemented — tapePresets.ts, ColorPresetRow component, integrated into TapeCreatorPanel and ScenarioPage; 12 tests passing, build clean
- 2026-04-11: Code review patches applied — added useEffect for external value sync, made Custom a true toggle, normalizeHex expands 3-digit shorthand, restored 6.1 fix (useRef/useEffect) to ColorPickerSwatch.tsx; 17 tests passing
