# Story 1.1: Scaffold the web client with Vite, React, TypeScript, and Tailwind v4

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a developer,
I want the project bootstrapped with the approved starter (Vite `react-ts` + Tailwind v4 via `@tailwindcss/vite`),
So that all feature work builds on a consistent, documented foundation.

## Acceptance Criteria

1. **Given** a clean `web/` app root per architecture, **when** the project is installed and `npm run dev` is executed, **then** the app serves a health page without errors and Tailwind utilities apply, **and** package versions are pinned per team convention and `README` or `package.json` documents the Node version expectation.

2. **Given** the Tailwind v4 Vite integration, **when** global styles import Tailwind per current docs, **then** utility classes render correctly in a smoke component.

## Tasks / Subtasks

- [x] Create `web/` at repo root with Vite `react-ts` template (`npm create vite@latest web -- --template react-ts`). [AC: 1]
  - [x] Run `npm install` in `web/` and verify dev server starts.
- [x] Add Tailwind CSS v4 with `@tailwindcss/vite` per current Tailwind “Vite” guide. [AC: 1, 2]
  - [x] `npm install tailwindcss @tailwindcss/vite` (pin exact versions in `package.json` at install time).
  - [x] Register `tailwindcss()` in `vite.config.ts` plugins array.
  - [x] In the main CSS entry (e.g. `src/index.css`), use `@import "tailwindcss";` (v4 style — not the legacy `@tailwind` directives alone).
- [x] Replace the default page with a minimal **health** view: visible heading + one element using Tailwind utilities (e.g. `text-2xl font-bold text-emerald-500`) to prove CSS pipeline. [AC: 1, 2]
- [x] Document Node engine expectation: align with Vite’s published requirement (e.g. **Node 20.19+ or 22.12+** as on npm for the Vite version you pin) — use `engines` in `package.json` and/or `README.md` in `web/`. [AC: 1]
- [x] Confirm `npm run build` succeeds with no errors. [AC: 1]

## Dev Notes

### Scope boundaries (do not do in this story)

- Do **not** add React Router, TanStack Query, Supabase client, or Edge Function wiring — those belong to Epic 2+.
- Do **not** implement design tokens, fonts, TapeRenderer, or Command Center UI — Epic 1 stories 1.2–1.7.
- Backend scaffolding (Supabase, migrations) is **out of scope** for this story; architecture treats client init as the first frontend story.

### Architecture compliance

- **App root:** Client lives under **`web/`** at the repository root; Vercel will deploy this SPA from `web/` later. [Source: `_bmad-output/planning-artifacts/architecture.md` — Starter Template Evaluation, Infrastructure]
- **Stack:** Vite + React + TypeScript + **Tailwind CSS v4** via **`@tailwindcss/vite`** — no MUI/Chakra; utility-first shell for future industrial UI. [Source: architecture.md — Core Architectural Decisions, Frontend Architecture]
- **Version pinning:** Pin **exact** versions for `vite`, `react`, `react-dom`, `typescript`, `tailwindcss`, `@tailwindcss/vite`, and related devDependencies at init time — versions drift; record what you shipped. [Source: `_bmad-output/planning-artifacts/epics.md` — Additional Requirements, architecture.md — Selected Starter]
- **ESM / HMR:** Use the stock Vite template layout; standard `src/` tree — feature folders (`tape`, `scenario`, etc.) come in later stories. [Source: architecture.md — Frontend Architecture]

### Technical requirements

1. **Bootstrap:** `npm create vite@latest web -- --template react-ts` then `cd web && npm install`. [Source: architecture.md — Initialization commands]
2. **Tailwind v4:** Install `tailwindcss` and `@tailwindcss/vite`; add the Vite plugin; CSS entry uses `@import "tailwindcss";`. Prefer official https://tailwindcss.com/docs/installation/vite (or current equivalent) if steps differ slightly — follow **current** docs at implementation time.
3. **Health page:** Must demonstrate Tailwind classes **render** (not only that the dev server runs). A single styled `<p>` or `<div>` is enough.
4. **Scripts:** `npm run dev`, `npm run build`, `npm run preview` (optional) — all should work; fix any strict TS/template issues before marking done.

### Library / framework requirements

| Package / tool | Requirement |
|----------------|-------------|
| `vite` | Version pinned; config includes `@tailwindcss/vite` plugin |
| `tailwindcss` | v4 line; paired with `@tailwindcss/vite` |
| `@tailwindcss/vite` | Official Vite plugin path for Tailwind v4 (recommended over legacy PostCSS-only v3 setup for new projects) |
| Node | Document supported range matching the pinned Vite major (see npm `engines` field for Vite) |

### File structure requirements

- **`web/package.json`** — scripts and pinned dependencies; `engines` for Node optional but recommended.
- **`web/vite.config.ts`** — `plugins: [react(), tailwindcss()]` (order per React plugin + Tailwind docs).
- **`web/src/index.css`** (or the CSS file imported by `main.tsx`) — contains `@import "tailwindcss";`.
- **`web/README.md`** (or root README section) — how to run `npm install`, `npm run dev`, `npm run build`, and Node version.

### Testing requirements

- Vitest is **not** required for this story; architecture notes testing is not in the default starter — add when a test story is scheduled. **Manual verification:** dev server, visible Tailwind styling, production build.

### Latest technical specifics (Tailwind v4 + Vite)

- **Integration:** `@tailwindcss/vite` is the documented way to run Tailwind v4 with Vite; CSS uses `@import "tailwindcss";` in the global stylesheet.
- **Drift:** Re-check npm and Tailwind docs at implementation time for breaking changes; adjust plugin import path if the package re-exports change.
- **Do not** mix Tailwind v3 PostCSS-only instructions with this project unless you are deliberately downgrading (not allowed).

### Project context reference

- No `project-context.md` found in the repo; this story and planning artifacts (`epics.md`, `architecture.md`, `prd.md`) are the source of truth.

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.1]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Starter Template Evaluation, Core Architectural Decisions, Frontend Architecture]
- [Source: `_bmad-output/planning-artifacts/prd.md` — Technical Success, MVP scope]
- Tailwind CSS: [Installing Tailwind CSS with Vite](https://tailwindcss.com/docs/installation/vite) (verify current steps)

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

_None._

### Completion Notes List

- Scaffolded `web/` with Vite `react-ts`, installed Tailwind **4.2.2** and **@tailwindcss/vite** **4.2.2**, registered `tailwindcss()` after `@vitejs/plugin-react` in `vite.config.ts`.
- Global styles: `src/index.css` uses `@import 'tailwindcss';`; health UI in `App.tsx` uses `text-2xl font-bold text-emerald-500` plus layout utilities.
- Pinned exact versions for `vite` **8.0.3**, `react` / `react-dom` **19.2.4**, `typescript` **5.9.3**, and related devDependencies; `engines.node` matches Vite 8: `^20.19.0 || >=22.12.0`.
- Documented run commands and Node expectation in `web/README.md`.
- **Verification:** `npm run build` and `npm run lint` succeed. Manual: `npm run dev` shows health page with Tailwind styling (per story — Vitest not required).

### File List

- `web/package.json`
- `web/package-lock.json`
- `web/README.md`
- `web/index.html`
- `web/vite.config.ts`
- `web/src/index.css`
- `web/src/App.tsx`
- `web/src/App.css` (removed)

### Change Log

- **2026-03-29:** Story 1.1 — Added `web/` Vite React TS app with Tailwind v4 (`@tailwindcss/vite`), health view, pinned deps, Node `engines`, and `web/README.md`.
