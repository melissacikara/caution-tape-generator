# Story 1.2: Define industrial design tokens and load Bebas Neue and DM Mono

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a user,
I want the UI shell to use the industrial palette and typography defined in the UX spec,
So that the app feels like a serious “warning system,” not a generic template.

## Acceptance Criteria

1. **Given** the UX color and typography tokens (background, surface, accent, text-primary, text-secondary, etc.),
   **When** tokens are applied via Tailwind v4 theme extension (CSS-first `@theme` / design tokens) or equivalent CSS variables wired into Tailwind,
   **Then** structural shell elements use the token contract instead of ad hoc hex for UI chrome,
   **And** Bebas Neue and DM Mono load from Google Fonts with a **single, documented** loading strategy (URL + where it is referenced in the app).

2. **Given** UX-DR2 (epics) and graceful degradation for font failures,
   **When** webfonts are missing, blocked, or slow,
   **Then** **fallback font stacks** preserve readable layout and do not collapse the shell (no zero-height text, no illegible contrast).

## Tasks / Subtasks

- [x] Add **one** Google Fonts entry point for **Bebas Neue** + **DM Mono** (`wght@400;500` for DM Mono per mockups). Prefer the same URL pattern as `ux-design-directions.html`: `https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap`. Document in `web/README.md` why `display=swap` is used. [AC: 1, 2]
- [x] Define **UX-DR1** palette values as Tailwind v4 theme tokens (see Dev Notes table). Use `@import "tailwindcss";` then `@theme { ... }` in the main CSS pipeline (e.g. `src/index.css` or `src/index.css` + imported `*.css` chunk). **Do not** scatter raw hex in components for shell colors after this story. [AC: 1]
- [x] Map **typography roles** per **UX-DR2** / UX spec: display / tape-facing → Bebas Neue stack; UI chrome → DM Mono stack. Expose as `--font-*` theme keys (e.g. `font-display`, `font-ui`) and apply fallbacks: at minimum `system-ui`, `sans-serif` after Bebas; `ui-monospace`, `monospace` after DM Mono. **No italic or decorative weights** for these faces. [AC: 1, 2]
- [x] Replace the Story 1.1 **health / smoke** UI so it **proves tokens**: page background, primary text, secondary text, and one accent usage use token-based utilities (not the temporary `text-emerald-*` demo). Keep the view minimal—no TapeRenderer, no Command Center layout. [AC: 1]
- [x] **Verify** `npm run build` and `npm run lint` pass; manually confirm fonts and colors in dev. [AC: 1, 2]

## Dev Notes

### Scope boundaries (do not do in this story)

- Do **not** implement TapeRenderer, TapeCreatorPanel, AppHeader, scenario library, routing, TanStack Query, or Supabase — later Epic 1 / Epic 2 stories.
- Do **not** add a component library (MUI/Chakra).
- Do **not** change Vite/React/TS versions unless required to fix a blocking issue—pin new deps if you add any.

### Epic UX-DR references (canonical)

| ID | Requirement (from `_bmad-output/planning-artifacts/epics.md`) |
|----|----------------------------------------------------------------|
| **UX-DR1** | Tailwind v4 with custom design tokens for industrial shell: `background` **#111111**, `surface` **#1C1C1C**, `surface-raised` **#252525**, `border` **#2E2E2E**, `text-primary` **#F0F0F0**, `text-secondary` **#888888**, `accent` **#FFD000**, `accent-text` **#111111** — structural UI uses token contract, not ad hoc hex. |
| **UX-DR2** | Load Bebas Neue + DM Mono from Google Fonts; Bebas for tape text and display headings; DM Mono for labels, counts, buttons, metadata; no italic/decorative weights. |

**UX-DR2 / failure case (this story’s AC2):** The epics file states UX-DR2; the story AC adds explicit **fallback** behavior if fonts fail. Implement **font-family fallback stacks** in the same `@theme` font definitions so the shell stays usable without webfonts.

### UX spec — Visual Design Foundation (values)

Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Color System & Typography System.

**Colors (dark industrial shell):**

| Token | Hex | Usage |
|-------|-----|--------|
| `background` | `#111111` | Page background |
| `surface` | `#1C1C1C` | Cards, panels |
| `surface-raised` | `#252525` | Inputs, elevated surfaces |
| `border` | `#2E2E2E` | Dividers, outlines |
| `text-primary` | `#F0F0F0` | Main text |
| `text-secondary` | `#888888` | Labels, metadata |
| `accent` | `#FFD000` | Caution yellow — CTAs, highlights |
| `accent-text` | `#111111` | Text on yellow |

**Typography roles:**

- **Bebas Neue** — display / tape / strong headings (all-caps feel).
- **DM Mono** — UI chrome, `wght` 400/500 as in `ux-design-directions.html`.

**Reference implementation (fonts link + CSS variables):** `_bmad-output/planning-artifacts/ux-design-directions.html` (lines 7–20: Google Fonts link + `:root` variables).

### Architecture compliance

- **Styling:** Tailwind **v4** via **`@tailwindcss/vite`**; extend design via **CSS `@theme`** (or documented equivalent), not a parallel ad hoc styling system. [Source: `architecture.md` — Frontend Architecture, Styling]
- **Fonts:** **Bebas Neue** + **DM Mono** from Google Fonts. [Source: `architecture.md` — Frontend Architecture]
- **App root:** All work under **`web/`**. [Source: `architecture.md` — Starter / Vercel]

### Tailwind v4 implementation guardrails

1. Keep **`@import "tailwindcss";`** as the v4 entry; add **`@theme { ... }`** after it (or in a file imported immediately after Tailwind) so tokens compile correctly.
2. Map UX color tokens to **`--color-*`** names that produce ergonomic utilities. Avoid ambiguous names like `--color-text` if it conflicts with Tailwind’s `text` plugin; a practical pattern is:
   - `--color-background`, `--color-surface`, `--color-surface-raised`, `--color-border`, `--color-accent`, `--color-accent-text`
   - For text: e.g. `--color-foreground` / `--color-muted` **documented as** mapping to UX `text-primary` / `text-secondary`, **or** use explicit names such that utilities read clearly (`text-foreground`, `text-muted`).
3. Map fonts with **`--font-display`** and **`--font-ui`** (or similarly named) per [Tailwind v4 theme docs](https://tailwindcss.com/docs/theme).
4. **Body / root:** Apply `background` + default text color + default `font-family` (DM Mono for UI shell) on `html` or `body` via token utilities or a thin layer in `index.css` so future routes inherit the industrial base without repeating classes.

### Previous story intelligence (Story 1.1)

- **`web/`** exists with Vite + React + TS + Tailwind v4 + `@tailwindcss/vite`; **`src/index.css`** already imports Tailwind.
- **Pinned dependencies** — extend carefully; follow the repo’s exact-version convention when adding packages.
- Health view currently may use **demo** utilities (e.g. emerald); **this story replaces that with real tokens** to satisfy UX-DR1.

### Testing requirements

- **Vitest** not required unless you already added it; **manual** visual check + **`npm run build`** + **`npm run lint`** are sufficient for this story.

### Project context reference

- No `project-context.md` in repo; use this story + `epics.md`, `ux-design-specification.md`, `architecture.md`.

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.2, UX-DR1, UX-DR2]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Visual Design Foundation, Technology Stack]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Frontend Architecture]
- [Source: `_bmad-output/planning-artifacts/ux-design-directions.html` — font link + variable naming reference]
- Tailwind CSS: [Theme (Tailwind v4)](https://tailwindcss.com/docs/theme)

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

_None._

### Completion Notes List

- Added Google Fonts link + `preconnect` in `index.html` (single URL for Bebas Neue + DM Mono 400/500).
- `src/index.css`: `@theme` with UX-DR1 hex as `--color-*` (`foreground`/`muted` = text-primary/text-secondary); `--font-display` / `--font-ui` with system fallbacks; `@layer base` on `html` for default shell.
- `App.tsx`: minimal health panel using `bg-background` (via html), `bg-surface`, `border-border`, `text-foreground`, `text-muted`, `bg-accent` / `text-accent-text`, `font-display` / `font-ui` — no raw hex in JSX.
- `README.md`: documents font URL, `index.html` reference, and `display=swap` rationale.
- `npm run build` and `npm run lint` pass.

### File List

- `web/index.html`
- `web/README.md`
- `web/src/index.css`
- `web/src/App.tsx`

### Change Log

- **2026-03-30:** Story 1.2 — Industrial design tokens (`@theme`), Google Fonts + fallbacks, token-based health UI.
