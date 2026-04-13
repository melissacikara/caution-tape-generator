# Story 6.4: Save Tape to Camera Roll

Status: done

## Story

As a user who has created a caution tape,
I want a single "Save tape" button that exports the tape as an image to my device,
so that I can share it anywhere or print it out.

## Acceptance Criteria

1. **Given** I have generated a tape (locked state, `state === 'generated'`) on the HomePage tape creator — **When** I tap/click "Save tape" — **Then** an image file of the tape is downloaded to the device (browser `<a download>` trigger on desktop; mobile uses `navigator.share` if available, else falls back to `<a download>`).
2. **Given** the exported image — **When** it is viewed — **Then** it contains the full repeating tape text on the correct background color with diagonal stripes — identical to what `TapeRenderer` renders — the image must NOT be blank or cut off.
3. **Given** the exported image — **When** viewed — **Then** it uses the tape's actual background color (the user's chosen color), correct ink color (computed from luminance), and the Bebas Neue font if loaded, or the system-ui fallback otherwise.
4. **Given** the tape text is very long (e.g. 200+ characters) — **When** the user saves — **Then** the full tape image exports without truncation — the canvas width is computed from the actual rendered content width.
5. **Given** the "Save tape" button — **When** the tape is NOT locked (text is empty or tape has not been generated) — **Then** the button is NOT shown.
6. **Given** the export is initiated — **When** the canvas-to-blob operation completes — **Then** the filename is `caution-tape.png` (or `caution-tape-{timestamp}.png` if the target environment needs uniqueness).
7. **Given** mobile Safari or iOS Chrome — **When** the user taps "Save tape" — **Then** the share sheet opens (via `navigator.share({ files: [File] })`), allowing the user to save to Photos or share directly. If `navigator.share` or `navigator.canShare` is not supported, fall back to the `<a download>` approach.
8. **Given** a canvas export error (rare) — **When** it occurs — **Then** an inline error message replaces the button (not a toast); the user can retry.

## Tasks / Subtasks

- [x] **Create `web/src/tape/exportTapeAsImage.ts`** — pure utility, no React (AC: 1–4, 6, 7)
  - [x] Accept `{ text: string; color: string }` as input
  - [x] Re-implement the `TapeRenderer` visual logic in canvas: compute ink color (same luminance formula), stripe background (`repeating-linear-gradient` approximated via iterative canvas `fillRect` at -45° angle), repeating text
  - [x] Load "Bebas Neue" via `document.fonts.ready` (it is already loaded in the app via `index.css` — no new import needed); render text with `ctx.font = '20px "Bebas Neue", system-ui, sans-serif'`
  - [x] Canvas width: `ctx.measureText(segment.repeat(repeats)).width` + `2 * paddingX`; height: `fontSize + 2 * paddingY` (match `TapeRenderer` vertical padding `py-3` = 12px)
  - [x] Produce a `Blob` (PNG, `canvas.toBlob('image/png')`)
  - [x] Export async function: `exportTapeAsImage(tape: { text: string; color: string }): Promise<void>`
    - [x] Try `navigator.canShare` with a `File` → if yes, use `navigator.share({ files: [file], title: 'Caution Tape' })`
    - [x] Else: create object URL, create `<a download="caution-tape.png">`, click, revoke URL
  - [x] Export type: `export type TapeExportInput = { text: string; color: string }`

- [x] **Add "Save tape" button to `TapeCreatorPanel`** (AC: 1, 5, 8)
  - [x] Import `exportTapeAsImage` from `./exportTapeAsImage`
  - [x] Add `exportError` state: `useState<string | null>(null)`
  - [x] In the `footer` section, when `isLocked` is true, render a "Save tape" button below the Reset button
  - [x] Button click: `void handleSaveTape()`; handler calls `exportTapeAsImage(lockedTape)`, catches errors and sets `exportError`
  - [x] On successful save, clear `exportError`
  - [x] If `exportError` is set, show inline `<p role="alert">` with the error message and a "Try again" retry link/button
  - [x] Clear `exportError` whenever `lockedTape` changes (i.e. on reset)

- [x] **Export from `tape/index.ts`** (if `exportTapeAsImage` needs to be accessible elsewhere — only if needed)
  - [x] For now, the utility is only used inside `TapeCreatorPanel` — NO barrel export needed unless another consumer is added

### Review Findings

- [x] [Review][Decision] Error state should replace the Save tape button (AC8) — AC8 says "inline error message replaces the button"; currently both the Save tape button and the error alert are rendered simultaneously when an error occurs. Decide: hide the button when `exportError` is set, or keep both visible (product call).
- [x] [Review][Decision] `navigator.share` may trigger on desktop browsers that support Web Share API (AC1) — AC1 says "desktop uses `<a download>`; mobile uses `navigator.share`". The code only branches on `canShare`, not on mobile detection, so desktop Chrome/Edge with Web Share support will open a share dialog rather than downloading. Decide: add a `navigator.maxTouchPoints > 0` or user-agent mobile check, or accept `canShare` as the sole gate.
- [x] [Review][Patch] AbortError / user dismiss from `navigator.share` shown as export error — [exportTapeAsImage.ts]
- [x] [Review][Patch] `setExportError(null)` inside `useEffect` depends on `onLockedTapeChange` ref stability — [TapeCreatorPanel.tsx]
- [x] [Review][Patch] Blob URL not revoked when fallback download path throws after `createObjectURL` — [exportTapeAsImage.ts]
- [x] [Review][Patch] `navigator.share` called without explicit `typeof navigator.share === 'function'` guard — [exportTapeAsImage.ts]
- [x] [Review][Defer] `parseHex` accepts non-hex chars and propagates NaN — pre-existing, copied verbatim from TapeRenderer per spec
- [x] [Review][Defer] Canvas can still be very large for max-length locked text — `repeats` is capped at 64 per spec; browser canvas size limits are a separate concern

- [x] **Write tests** (AC: 2–3, 5)
  - [x] `web/src/tape/exportTapeAsImage.test.ts`
    - [x] Mock `HTMLCanvasElement.prototype.toBlob`
    - [x] Mock `document.fonts.ready` (resolve immediately)
    - [x] Test: calling `exportTapeAsImage` with a valid tape does not throw
    - [x] Test: canvas width grows with text length (longer text → wider canvas)
    - [x] Test: `navigator.share` is called when `navigator.canShare` returns true
    - [x] Test: `<a download>` path fires when `navigator.share` is not available
  - [x] `web/src/tape/TapeCreatorPanel.test.tsx` — extend existing test file
    - [x] Test: "Save tape" button is NOT rendered when tape is not locked
    - [x] Test: "Save tape" button IS rendered when tape is locked
    - [x] Test: clicking "Save tape" calls `exportTapeAsImage` (mock it)
    - [x] Test: on export error, inline error message appears; error clears on reset

---

## Dev Notes

### Why Canvas, Not `html-to-image` / `dom-to-image`

The brainstorming decision was: "Fun, relatively simple." A canvas-based approach:
- Zero new dependencies — project is intentionally lean
- `html-to-image` requires CORS-safe fonts and may not handle `@theme` CSS variables in jsdom/test context
- The tape visual is mathematically simple: diagonal stripes + text — easy to reproduce in canvas
- Canvas gives full control over export dimensions and avoids any CORS issues with the font CDN

Do NOT add `html-to-image`, `dom-to-image`, or `html2canvas` as dependencies. Implement in canvas directly.

### Canvas Implementation Blueprint

The canvas implementation mirrors `TapeRendererInner` logic exactly. Here is the full algorithm:

#### 1. Color Math (copy from TapeRenderer — same functions)

```ts
function parseHex(hex: string): { r: number; g: number; b: number } | null
function relativeLuminance(r, g, b): number
function mixTowardBlack(hex: string, amount: number): string  // amount = 0.38
function inkForTapeBackground(bgHex: string): string  // '#111111' or '#f0f0f0'
function normalizeHex(color: string): string
```

These are pure functions — copy them verbatim from `TapeRenderer.tsx` into `exportTapeAsImage.ts`. Do NOT import from TapeRenderer (that file re-exports the component; don't create a circular dependency). The duplication is intentional — the utility must be independently testable.

#### 2. Text Content (same formula as TapeRendererInner)

```ts
const upper = text.trim().toUpperCase()
const segment = `CAUTION: ${upper} ⚠ `
const repeats = Math.min(64, Math.max(18, 14 + upper.length * 3))
```

#### 3. Canvas Sizing

```ts
const fontSize = 20  // px (matches TapeRenderer: text-xl ≈ 20px)
const paddingX = 12  // px (matches px-3 = 12px)
const paddingY = 12  // px (matches py-3 = 12px)

// Wait for fonts before measuring
await document.fonts.ready

const ctx = canvas.getContext('2d')!
ctx.font = `${fontSize}px "Bebas Neue", system-ui, sans-serif`
const segmentWidth = ctx.measureText(segment).width
const totalWidth = segmentWidth * repeats + paddingX * 2
const totalHeight = fontSize + paddingY * 2
canvas.width = Math.ceil(totalWidth)
canvas.height = Math.ceil(totalHeight)
```

#### 4. Drawing Order

```
1. Fill entire canvas with stripeA (base tape color)
2. Draw diagonal stripes in stripeB using iterative rotated fillRect
3. Draw text row: iterate repeats, ctx.fillText each segment
```

**Diagonal stripe algorithm** (replicates `repeating-linear-gradient(-45deg)` at 11px / 22px):

```ts
// Stripe pitch = 22px; stripe width = 11px; angle = -45deg
const pitch = 22
const w = canvas.width
const h = canvas.height
ctx.save()
ctx.fillStyle = stripeA
ctx.fillRect(0, 0, w, h)

ctx.fillStyle = stripeB
// Walk diagonal lines across the canvas
for (let i = -(h + w); i < w + h; i += pitch) {
  ctx.save()
  ctx.translate(i, 0)
  ctx.rotate((-45 * Math.PI) / 180)
  ctx.fillRect(0, -h, 11, h * 3)  // tall enough to cover rotated extent
  ctx.restore()
}
ctx.restore()
```

**Text drawing:**

```ts
ctx.fillStyle = ink
ctx.font = `${fontSize}px "Bebas Neue", system-ui, sans-serif`
ctx.textBaseline = 'top'
let x = paddingX
for (let i = 0; i < repeats; i++) {
  ctx.fillText(segment, x, paddingY)
  x += ctx.measureText(segment).width
}
```

#### 5. Blob + Share / Download

```ts
const blob = await new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((b) => {
    if (b) resolve(b)
    else reject(new Error('Canvas export failed'))
  }, 'image/png')
})

const file = new File([blob], 'caution-tape.png', { type: 'image/png' })

if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
  await navigator.share({ files: [file], title: 'Caution Tape' })
} else {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'caution-tape.png'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

### TapeCreatorPanel Button Placement

The "Save tape" button appears **below the Reset button** in the locked footer. Locked footer becomes:

```
[ ISSUE A WARNING ]   ← hidden when locked
[ Save tape       ]   ← new, only shown when locked
[ Reset           ]   ← always shown when any state is active
```

The button must follow existing styles:
- Minimum tap target: `min-h-[44px]`
- Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background`
- Use `font-ui text-sm` — not `font-display`
- Style it as a secondary/accent-outlined button (distinct from the primary yellow "ISSUE A WARNING"):
  ```
  className="min-h-[44px] w-full border border-accent bg-transparent px-4 py-3 font-ui text-sm text-accent transition-colors hover:bg-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  ```

### Error Handling (Inline, No Toasts)

Per project-context.md: "Surface inline per UX spec (no toasts for MVP)."

If `exportTapeAsImage` throws, show:
```tsx
{exportError ? (
  <p role="alert" className="font-ui text-xs text-red-400">
    {exportError}{' '}
    <button type="button" onClick={handleSaveTape} className="underline">
      Try again
    </button>
  </p>
) : null}
```

### Async Event Handler Pattern

Per project-context.md: "Async in event handlers: `void asyncFn()` — never make event handler props `async`."

```ts
const handleSaveTape = async () => {
  if (!lockedTape) return
  setExportError(null)
  try {
    await exportTapeAsImage(lockedTape)
  } catch (err) {
    setExportError(err instanceof Error ? err.message : 'Export failed')
  }
}

// In JSX:
onClick={() => void handleSaveTape()}
```

### Files to Create / Edit

- **CREATE:** `web/src/tape/exportTapeAsImage.ts` — canvas export utility
- **EDIT:** `web/src/tape/TapeCreatorPanel.tsx` — add Save tape button + error display
- **CREATE:** `web/src/tape/exportTapeAsImage.test.ts` — unit tests for canvas utility
- **EDIT:** `web/src/tape/TapeCreatorPanel.test.tsx` — extend with Save tape button tests

### Do NOT Touch

- `web/src/tape/TapeRenderer.tsx` — no changes needed; export is a separate code path
- `web/src/pages/ScenarioPage.tsx` — "Save tape" is only on the HomePage creator (brainstorming: "One tap, instant gratification" when you've just made the tape). Not required on ScenarioPage in this story.
- `web/src/tape/index.ts` — no new barrel exports needed (only TapeCreatorPanel imports the utility)
- Any Edge Function or Supabase files — this is purely frontend
- `web/vite.config.ts` or `web/package.json` — no new dependencies
- Design tokens in `index.css` — no changes

### Not in Scope (Explicitly Deferred)

- PDF / print-quality export → Phase 3 (confirmed in brainstorming decision #16)
- "Save tape" button on `ScenarioPage` tape stack — this story scopes to the tape creator only
- High-DPI / `devicePixelRatio` scaling — nice-to-have, out of scope for Phase 2

### Previous Story Learnings (6-1 through 6-3)

- **From 6-1:** `aria-label` conflicts with test queries — be specific with aria labels, use `getByLabelText`
- **From 6-2/6-3:** `vi.clearAllMocks()` in `beforeEach`; `vi.mock('../path')` at module level
- **From 6-3:** `TapeCreatorPanel.test.tsx` now exists — add new tests to the existing file, do NOT recreate it
- **From 6-3:** The `textarea` (not `input`) is used for tape text in `ScenarioPage`; `TapeCreatorPanel` still uses `<input type="text">` — important to distinguish for test queries
- **From 6-3:** `TapeRenderer` is `memo`-wrapped; stripe background is on the inner text row (not an absolute overlay) — the canvas implementation must reproduce this (stripes behind text, not on a separate layer)
- **Pattern established:** `getByLabelText` over `document.querySelector`; test DOM classes directly for CSS-only features

### Testing Constraints

- `HTMLCanvasElement` in jsdom does not implement a real canvas — `getContext('2d')` returns `null` or a stub. Mock `HTMLCanvasElement.prototype.getContext` to return a stub ctx object.
- `canvas.toBlob` is not implemented in jsdom — mock it: `vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(new Blob()))`
- `document.fonts.ready` is not fully implemented in jsdom — mock as `vi.spyOn(document.fonts, 'ready', 'get').mockReturnValue(Promise.resolve(document.fonts))` or simply wrap in `try/catch`; alternatively, mock the entire `exportTapeAsImage` module in `TapeCreatorPanel.test.tsx` to avoid canvas issues entirely
- **Preferred test strategy:** In `TapeCreatorPanel.test.tsx`, mock the entire `./exportTapeAsImage` module (`vi.mock('./exportTapeAsImage')`), so the button behavior tests don't need a real canvas. In `exportTapeAsImage.test.ts`, mock the canvas and font APIs directly.

### Recent Git Context

- `8f2761e` — story 6.3 landed (TapeRenderer overflow fix, maxLength enforcement). Current working tree has Epic 1 auth changes uncommitted.
- The `phase2` branch is the active branch — all work goes here.
- No tape-export functionality exists anywhere in the codebase — this is new code.

### Definition of Done

- [ ] Canvas export utility `exportTapeAsImage.ts` created — no new npm dependencies
- [ ] "Save tape" button appears in `TapeCreatorPanel` only when tape is locked
- [ ] Button triggers canvas export: `navigator.share` on mobile if available, `<a download>` fallback on desktop
- [ ] Inline error shown on export failure; error clears on reset
- [ ] No `max-h`, no toast, async event handler follows `void` pattern
- [ ] All existing tests still pass
- [ ] New tests cover: button visibility, export call, error display, share vs download branching
- [ ] `npm run build` in `web/` exits 0

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- `document.fonts` is `undefined` in jsdom — used optional chaining `document.fonts?.ready` in utility; mocked with `Object.defineProperty` in tests as `document.fonts` can't be spied on when absent.

### Completion Notes List

- Created `exportTapeAsImage.ts`: pure canvas utility, no new dependencies. Copies color math from `TapeRenderer.tsx` verbatim (intentional duplication per story spec). Uses `document.fonts?.ready` (optional chain for jsdom compatibility). Implements diagonal stripes via iterative rotated `fillRect` at -45°. Share/download branching via `navigator.canShare`/`navigator.share` → `<a download>` fallback.
- Updated `TapeCreatorPanel.tsx`: added `exportError` state, `handleSaveTape` async handler, "Save tape" button (visible only when locked), inline `role="alert"` error with "Try again" button. `exportError` cleared on reset and whenever `lockedTape` changes.
- All 38 tests pass; `npm run build` exits 0; no linter errors.

### File List

- `web/src/tape/exportTapeAsImage.ts` — CREATED
- `web/src/tape/exportTapeAsImage.test.ts` — CREATED
- `web/src/tape/TapeCreatorPanel.tsx` — MODIFIED
- `web/src/tape/TapeCreatorPanel.test.tsx` — MODIFIED

## Change Log

- 2026-04-11: Story file created for 6.4 Save Tape to Camera Roll
- 2026-04-11: Story implemented — canvas export utility + Save tape button + tests (all ACs satisfied)
