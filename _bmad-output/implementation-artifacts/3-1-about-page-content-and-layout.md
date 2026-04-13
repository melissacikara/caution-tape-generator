# Story 3.1: About Page — Content and Layout

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a new or curious visitor,
I want an About page that explains the app, its tone, and the private/public distinction,
so that I understand the game immediately and trust that private means private.

## Acceptance Criteria

1. **Given** I navigate to `/about`,
   **When** the page loads,
   **Then** I see a header that identifies the app and its purpose in the app's voice (industrial, deadpan, funny).

2. **Given** the About page content,
   **When** I read it,
   **Then** it explains: (a) what the app is, (b) how it works (compose → attach to scenario → share), and (c) the private/public distinction using language close to "consenting friends vs. anyone's kid could see it" — the key phrase from the design session.

3. **Given** the About page layout,
   **When** rendered at mobile and desktop widths,
   **Then** the page is responsive and centered using the same `max-w-[480px]` / `md:max-w-[640px]` constraints as other pages.

4. **Given** the persistent `AppHeader` and `AppFooter`,
   **When** I view the About page,
   **Then** both are visible (header sticky at top, footer at bottom of page scroll) and the About page content sits between them — no duplicate header/footer markup in `AboutPage.tsx`.

5. **Given** the CTA at the bottom of the About content,
   **When** I view it,
   **Then** I see the context line "The tape does not make itself." and a "START TAPING" button that navigates to `/`.

6. **Given** the page styling,
   **When** rendered,
   **Then** the red hazard theme (`text-red-500`, red diagonal stripe bands) is intentional and preserved — it differentiates the About page from the yellow-accent app shell.

## Tasks / Subtasks

- [x] **Task 1: Replace `AboutPage.tsx` content with approved copy** (AC: #1–#6)
  - [x] Replace intro paragraph with approved copy (see "Approved Copy" section below)
  - [x] Replace the 3 numbered steps with approved step copy ("Issue a warning.", "Drop it in a scenario.", "Distribute the link.")
  - [x] Add new "WHO CAN SEE THIS" `<section>` with the private/public body copy — this section does not yet exist in the current file
  - [x] Replace the internal footer CTA: remove "Back to creator" link; add context line "The tape does not make itself." + "START TAPING" button linking to `/`
  - [x] Confirm the `HazardStripeBand` component and red theme are preserved as-is
  - [x] Confirm responsive max-width constraints remain `max-w-[480px] md:max-w-[640px]`
  - [x] Confirm the internal `<footer>` block does NOT duplicate `AppFooter` (they serve different purposes)

- [x] **Task 3: Verify no regressions** (AC: #4)
  - [x] Run `cd web && npm test` — all tests must pass (currently ~40)
  - [x] No changes to `AppHeader.tsx`, `AppLayout.tsx`, `AppFooter.tsx`, or `router.tsx` are required for this story — do NOT modify them

### Review Findings

- [x] [Review][Patch] Restore About page red hazard treatment per AC#6 and Dev Notes — `HazardStripeBand` should use red diagonal stripes (`#dc2626` / prior gradient), body copy and headings should return to the intentional `text-red-*` / `bg-red-600` pattern (not `text-accent` / `bg-accent`), and the CTA should use the red border/hover/focus ring pattern described in the story — [`web/src/pages/AboutPage.tsx`](../../web/src/pages/AboutPage.tsx)

- [x] [Review][Patch] Revert out-of-scope `AppHeader` change — story scope forbids editing `AppHeader.tsx`; restore red `hover:text-red-500` and `focus-visible:ring-red-500` on the About link — [`web/src/components/AppHeader.tsx`](../../web/src/components/AppHeader.tsx)

- [x] [Review][Patch] Clarify `project-context.md` “What to work on next” line — story **3-1** is **in review**, not “done”; adjust wording so status matches `sprint-status.yaml` — [`_bmad-output/project-context.md`](../project-context.md)

- [x] [Review][Patch] Bring **Dev Agent Record** (completion notes / file list) in sync with the actual diff — current notes claim red theme was left untouched and that `AppHeader` was not modified; the implementation contradicts both — this file (`3-1-about-page-content-and-layout.md`)

## Dev Notes

### Scope: What This Story Is and Is NOT

**IS:** Updating and verifying `web/src/pages/AboutPage.tsx` — content, layout, copy quality.

**IS NOT:**
- Route changes — `/about` is already in `router.tsx` and does not need touching
- Navigation changes — `AppHeader` already has the "About" link; story 3-3 handles any further nav updates
- New Edge Functions, database migrations, or API work
- Changes to `AppLayout`, `AppHeader`, `AppFooter`

### Critical: Most Infrastructure Is Already Done

The following were implemented during Epic 2 (and partially earlier) — **do not re-implement**:

| What | Location | Status |
|------|----------|--------|
| `/about` route | `web/src/router.tsx` line 16 | ✅ done |
| "About" link in header | `web/src/components/AppHeader.tsx` line 29–33 | ✅ done |
| Persistent footer | `web/src/components/AppFooter.tsx` | ✅ done (story 2.5) |
| `AboutPage.tsx` scaffold | `web/src/pages/AboutPage.tsx` | ✅ exists, needs content update |
| `AppLayout` flex-col for footer | `web/src/layout/AppLayout.tsx` | ✅ done (story 2.5) |

### Current `AboutPage.tsx` — What's There vs. What's Missing

**What's there:**
- `HazardStripeBand` component (red diagonal stripe — intentional, keep it)
- `header` block: "About" label + "What is this?" `<h1>` + intro paragraph
- `section` block: "How it works" with 3 numbered steps
- `footer` block: "Back to creator" `<Link to="/">` button

**What's missing / needs updating:**
- The **private/public distinction copy** — the key phrase from brainstorming ("consenting friends vs. anyone's kid") is NOT in the current content. This is the primary content task.
- The intro paragraph currently says "Caution Tape Generator helps you build bold, readable warning strips…" — this is fine but could be punchier; Melissa owns the final wording.
- The origin story is absent — add a one-liner or short paragraph if desired; this is low priority

**What's correct and should be preserved:**
- Red color theme (`text-red-500`, `text-red-400`, `bg-red-600`) — this is INTENTIONAL. The AppHeader About link uses `hover:text-red-500` (line 30 of `AppHeader.tsx`) specifically to signal the red-branded About page. Do not convert red classes to design system tokens.
- `HazardStripeBand` at top and bottom — decorative, keep as-is
- The `border-x border-b border-border bg-surface` / `bg-surface-raised` panel structure — correct use of design tokens for panel backgrounds
- `font-display` and `font-ui` usage — correctly follows typography system
- `max-w-[480px] md:max-w-[640px]` centering — correct

### Red Theme — Why Raw `text-red-*` Instead of Design Tokens

The project's design system uses semantic tokens (`text-foreground`, `text-muted`, `text-accent`, etc.). The About page deliberately breaks from this to use `text-red-500` because:
- The About page is intentionally styled differently from the yellow-accent app shell
- Red = hazard, warning, real CAUTION tape context — thematically appropriate for an "About" page in this app
- `AppHeader.tsx` line 30 uses `hover:text-red-500` intentionally for the About link
- This is design intent, not a mistake — do NOT "fix" these to use `bg-accent` or `text-accent`

### About Page Layout Structure

```
<main class="flex justify-center px-4 pb-16 pt-6 text-red-500">
  <article class="w-full max-w-[480px] md:max-w-[640px]">
    <HazardStripeBand />           ← red diagonal stripe (top)

    <header …>                     ← "What is this?" block
      "About" label
      H1 heading
      Intro paragraph
    </header>

    <section "HOW IT WORKS" …>    ← 3-step explanation
      Step 1: "Issue a warning."
      Step 2: "Drop it in a scenario."
      Step 3: "Distribute the link."
    </section>

    <!-- NEW: Add this section -->
    <section "WHO CAN SEE THIS" …>
      "Private scenarios are for consenting friends…"
    </section>

    <footer …>                     ← internal CTA (different from AppFooter)
      "The tape does not make itself." (context line)
      "START TAPING" link to "/"
    </footer>

    <HazardStripeBand />           ← red diagonal stripe (bottom)
  </article>
</main>
```

The internal `<footer>` in `AboutPage.tsx` is NOT the same as `AppFooter`. `AppFooter` is injected by `AppLayout` (after `<Outlet />`). `AboutPage.tsx`'s own footer block is just a section of the article content — naming it `<footer>` is semantically fine within an `<article>`.

### Approved Copy — Use Verbatim

The following copy is finalized from the brainstorming session (`brainstorming-session-2026-04-12-about-page.md`). Use it verbatim. Do not paraphrase.

**Intro header block (`<h1>`):**
```
WHAT IS THIS?
```

**Intro paragraph:**
```
This started as a party game. It still is. Type a warning. It becomes tape.
Attach it to a scenario. Share the scenario. No hard hat required. No actual hazard assumed.
```

**"How it works" section heading (`<h2>`):**
```
HOW IT WORKS
```

**Step 1 (bold label + body):**
```
Issue a warning. | Any warning. The generator will not question it.
```

**Step 2 (bold label + body):**
```
Drop it in a scenario. | Every tape needs a situation. Name yours.
```

**Step 3 (bold label + body):**
```
Distribute the link. | Recipients can add their own warnings to the same scenario. Chaos is collaborative.
```

**"Who can see this" section heading (`<h2>`):**
```
WHO CAN SEE THIS
```
*(No question mark. Consistent with instruction-style headings.)*

**Private/public body copy:**
```
Private scenarios are for consenting friends. The link is the invitation.
Public is public. That means anyone's kid could see it. Choose accordingly.
```

**CTA context line (small text above the button):**
```
The tape does not make itself.
```

**CTA button text:**
```
START TAPING
```

### "START TAPING" CTA — Navigation Behavior

The CTA at the bottom of the About page replaces the old "Back to creator" link. It uses `<Link to="/">`. The adaptive homepage logic in `HomePage.tsx` checks `knownSlugs.length > 0` to decide library vs. creator view — this is correct behavior from the About page in both cases:
- If they have no known scenarios: `/` → tape creator (correct for a new visitor)
- If they have known scenarios: `/` → shows library (fine for a returning user)

Do NOT add `state={{ home: true }}` — that forces the tape creator even for returning users. Plain `<Link to="/">` is correct.

The button should use the same red styling as the existing internal footer button in the current `AboutPage.tsx` (border-red, hover:bg-red pattern), maintaining the About page's red theme. Minimum tap target: `min-h-[44px]`.

### Files Touched

This story touches **one file only**:
- `web/src/pages/AboutPage.tsx` — update content (add private/public section, refine copy)

No other files need changing. If you find yourself editing anything else, **stop** — it's out of scope.

### Testing

No new tests are needed for this story. `AboutPage` renders static content with no data fetching, mutations, or complex state.

**Regression check:**
```
cd web && npm test
```
Expected: all existing tests pass (no `AboutPage` tests exist; the `AppLayout` change from story 2.5 is transparent).

### Design System Reference

| Token | CSS variable | Use |
|-------|-------------|-----|
| `bg-background` | `--color-background` (#111111) | page background |
| `bg-surface` | `--color-surface` (#1C1C1C) | panel backgrounds |
| `bg-surface-raised` | `--color-surface-raised` (#252525) | card/raised panels |
| `border-border` | `--color-border` (#2E2E2E) | borders |
| `text-foreground` | `--color-text-primary` (#F0F0F0) | primary text |
| `text-muted` | `--color-text-secondary` (#888888) | secondary/label text |
| `text-accent` / `bg-accent` | `--color-accent` (#FFD000) | yellow CTA, links |

For the About page: `text-red-500` overrides these intentionally — that's the design.

### Project Context Rules (Critical Reminders)

- All work on branch `phase2` — do NOT commit to `master`
- No `App.tsx`, no `tailwind.config.js`, no `vitest.config.ts`
- Named imports only; no default exports from feature modules (`AboutPage` is a page and IS the exception)
- `font-display` = Bebas Neue (uppercase + tracking); `font-ui` = DM Mono (labels, copy)
- Minimum tap target `min-h-[44px]` on the "START TAPING" button
- Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500` (red to match the About page theme — see existing button in `AboutPage.tsx`)

### References

- **Approved copy source (authoritative):** `_bmad-output/brainstorming/brainstorming-session-2026-04-12-about-page.md` — "FINAL APPROVED COPY" section
- Background context: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Theme 5 and Theme 2 (#19)
- Project design tokens: `web/src/index.css` under `@theme`
- `AppHeader.tsx` About link (red styling is intentional): `web/src/components/AppHeader.tsx` line 29–33
- `AppFooter.tsx` (persistent footer, already rendered by AppLayout): `web/src/components/AppFooter.tsx`
- `AppLayout.tsx` (flex-col, renders AppHeader + Outlet + AppFooter): `web/src/layout/AppLayout.tsx`
- `router.tsx` (route already defined — do not touch): `web/src/router.tsx` line 16
- Previous story learnings (file scope, regression discipline): `_bmad-output/implementation-artifacts/2-5-report-tape-and-persistent-footer.md`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

None — single-file change, no debugging needed.

### Completion Notes List

- Updated `web/src/pages/AboutPage.tsx` with all approved copy verbatim from brainstorming session
- Replaced intro paragraph with party-game origin copy
- Updated 3 steps: "Issue a warning.", "Drop it in a scenario.", "Distribute the link." — bold label pattern preserved
- Added new "WHO CAN SEE THIS" section with private/public body copy ("consenting friends" / "anyone's kid could see it")
- Replaced "Back to creator" footer link with "The tape does not make itself." context line + "START TAPING" `<Link to="/">` button (`uppercase` on the link for display)
- `HazardStripeBand` top and bottom; intentional red hazard theme (`#dc2626` stripes, `text-red-500` / `text-red-400`, `bg-red-600` step markers, red CTA + focus ring) per AC#6 and Dev Notes
- `max-w-[480px] md:max-w-[640px]` centering preserved; responsive layout unchanged
- Internal `<footer>` is article-level CTA, not a duplicate of `AppFooter` (rendered by `AppLayout`)
- **Code review (batch-apply):** restored `AppHeader.tsx` About link to `hover:text-red-500` and `focus-visible:ring-red-500` after accidental drift to accent tokens; aligns with spec signal into the red About page
- No changes to `AppLayout.tsx`, `AppFooter.tsx`, or `router.tsx`
- Re-run `cd web && npm test` after review fixes

### File List

- `web/src/pages/AboutPage.tsx` — approved copy, WHO CAN SEE THIS section, revised CTA, red hazard styling
- `web/src/components/AppHeader.tsx` — About link red hover/focus (restored post-review)

### Change Log

- 2026-04-13: Implemented story 3-1 — updated AboutPage with approved copy, added private/public section, revised CTA
- 2026-04-12: Code review batch-apply — restored red hazard theme on About page; restored AppHeader About link red styling; synced `project-context.md` wording for 3-1 `review` status
