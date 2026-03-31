---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
project_name: 'caution-bmad'
user_name: 'Melissa'
date: '2026-03-29T12:00:00'
lastStep: 8
status: complete
completedAt: '2026-03-29'
prdSyncedAt: '2026-03-30'
prdSyncNote: 'Reconciled with edited PRD — tape edit/delete (FR29–FR32), delete confirmation, security/reliability NFRs.'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The PRD defines **32 functional requirements (FR1–FR32)**. Architecturally they imply:

- **Tape pipeline:** Live text-in → repeated “CAUTION: [text]” pattern, diagonal stripes, industrial typography, user-selected color, length scaling with character count (FR1–FR8).
- **Scenario model:** Named scenarios, vertical tape stack (newest-at-top), tape count per scenario, navigation between library ↔ scenario, tape creation from homepage and from within a scenario (FR9–FR14, FR26–FR28).
- **Library & entry:** Home/scenario library with cards (name + count), new scenario from library, adaptive first-time vs returning flows as described in PRD/UX (FR15–FR18).
- **Sharing & identity:** Shareable URL per scenario; anyone with the link can **view, add, edit, and delete** tapes (same anonymous, link-based capability); **no authentication** anywhere (FR19–FR22, FR29–FR31).
- **Tape lifecycle:** Edit existing tape (text and/or color) from scenario view; delete tape for all viewers; **explicit confirmation before permanent delete** (modal or bottom sheet — UX safety, not auth) (FR29–FR32).
- **Persistence:** Scenarios and tapes stored permanently; adds, edits, and deletes from shared links apply immediately for everyone with the link (FR23–FR25).

**Non-Functional Requirements:**

- **Performance:** Live preview must feel instantaneous (lag = defect); app interactive within **~2s** on typical mobile; shared scenario usable within **~2s**; color picker responsive on touch.
- **Security & privacy:** No PII; slugs **non-guessable** (not sequential IDs); no credentials or payments. **Link possession = full capability** (including edit/delete) per PRD — no per-tape ownership or audit trail in MVP; future tightening (auth, ownership, soft-delete) would be a separate product change.
- **Reliability:** No silent loss of scenarios/tapes; confirmed tapes must save and become visible to others; **edits and deletes** must not leave UI and stored state inconsistent if a mutation fails; poor connectivity must not discard work (inline saving/error patterns per UX).

**Scale & Complexity:**

- **Product/regulatory complexity:** **Low** (personal/social tool, no compliance mandate in PRD).
- **Implementation complexity:** **Moderate** for a small app—dominated by **tape rendering fidelity + frame-to-frame performance** and **clean data/API design** for scenarios, tapes, and slugs.

- **Primary domain:** **Full-stack web application** (client-heavy SPA, backend for persistence and share URLs).
- **Complexity level:** **Low–medium** (low business rules; medium technical risk on rendering and latency).
- **Estimated architectural components (initial):** Client app (routes, tape engine, UI shell), HTTP API, persistence layer, identifier/slug strategy, static asset/fonts—on the order of **5–7** major building blocks (exact stack decided in later steps).

**Delivery sequencing (product constraint):**

The PRD’s **Experience MVP** implies **proving the tape visual (TapeRenderer) before** heavily investing in scenario/library APIs—front-load risk on the rendering spike so the core joke is validated early.

### Technical Constraints & Dependencies

- **SPA** model per PRD; no SSR/SEO requirement.
- **Browser matrix:** Mobile Safari, Chrome Android, desktop Chrome required; Firefox/Safari desktop best effort; no IE/legacy.
- **UX:** **Tailwind**-based shell; **Bebas Neue** + **DM Mono**; dark industrial palette; **WCAG 2.1 AA** target; mobile-first breakpoints (library **1→2 columns** at `sm`).
- **Backend:** Must support **durable storage**, **non-guessable** scenario identifiers in URLs, and operations for list/create/read scenarios and append tapes.

**API / client behavior (mobile-first):**

- Design for **retries and idempotency** (or safe deduplication) on tape creation so flaky networks don’t create duplicate tapes.
- Define **optimistic add** behavior when the server rejects: **rollback** plus inline error, preserve the user’s draft in the creator.

**Operational posture without authentication:**

- Proportionate **rate limiting**, **maximum text length**, and basic abuse controls so shared links are not trivially hammered—aligned with a small trusted-circle product, not public-scale moderation.

**Rendering decision (explicit fork):**

- Choose **DOM/SVG vs canvas** (or hybrid) with clear tradeoffs: **performance**, **maintainability**, and **accessibility** (e.g. canvas requires a parallel accessible text strategy and `aria-label` / non-image-only content).

**Loading and UX contract:**

- Align architecture with **per-route loading behavior** (e.g. skeletons for shared scenario within PRD/UX time targets), not only visual polish—defines client data-fetching and perceived performance.

### Cross-Cutting Concerns Identified

- **Real-time interaction performance** — keystroke-to-preview path is the product.
- **Data integrity & poor network behavior** — persistence promise, optimistic flows, **idempotent** writes, **rollback** on failure.
- **Routing & deep linking** — homepage vs scenario URL with no auth gate.
- **Accessibility** — keyboard, focus, contrast; tape content exposed to AT; **focus management** when opening the tape creator from scenario view (routing/state, not a late UI patch).
- **Security posture without auth** — non-guessable slugs; light **abuse/rate** boundaries; **destructive actions** gated by **confirmation UI** (FR32), not by identity.

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack web:** **SPA** (React + Vite + TypeScript + Tailwind) for the client, plus a **separate HTTP API** for scenarios/tapes (API stack is decided in later steps—not bundled in the Vite starter).

### Starter Options Considered

- **Vite official `react-ts` + Tailwind v4 (`@tailwindcss/vite`):** Aligns with the UX spec (Tailwind, no MUI/Chakra), keeps the client thin and fast to iterate for **TapeRenderer** performance work. Official docs use a **two-step** setup: scaffold Vite, then add Tailwind v4 for Vite.
- **Next.js / full-meta frameworks:** Extra features (SSR, file routing conventions) are **not required** by the PRD; they increase surface area before the tape visual is proven.
- **Heavy full-stack starters (e.g. highly opinionated monolith generators):** Deferred so **Experience MVP** can prioritize the tape spike.

### Selected Starter: Vite (react-ts) + Tailwind CSS v4

**Rationale for Selection:**

- Matches **SPA** and **Tailwind** requirements with **actively maintained** defaults (`npm create vite@latest`).
- **TypeScript + ESLint** baseline from the template; **HMR** supports rapid iteration on live preview.
- **Tailwind v4** + **`@tailwindcss/vite`** is the current documented integration path; **pin exact versions from npm at init time** (they change frequently).

**Initialization (client):**

```bash
npm create vite@latest web -- --template react-ts
cd web
npm install
npm install tailwindcss @tailwindcss/vite
```

Then follow the **current** Tailwind “Vite” guide: add the Vite plugin in `vite.config.ts` and use `@import "tailwindcss";` in your CSS entry (v4 style).

**Architectural Decisions Provided by Starter:**

**Language & Runtime:** TypeScript on the client; modern ESM; Node version per Vite’s current docs (e.g. **Node 20.19+ or 22.12+** as stated on npm for recent Vite).

**Styling Solution:** Tailwind v4 via **`@tailwindcss/vite`** — utility-first, **no** bundled component library (fits “industrial shell + custom tape”).

**Build Tooling:** Vite (dev server, HMR, production build).

**Testing Framework:** Not included by default — add **Vitest** (or your choice) when you define the test story.

**Code Organization:** Standard Vite `src/` layout; routing and feature folders to be added for scenario/tape flows.

**Development Experience:** Fast feedback loop for **keystroke-driven** UI work.

**Note:** Initializing the **client** with the commands above should be treated as the **first implementation story** for the frontend. **Backend** scaffolding is **out of scope** for this template block and should be a separate init decision (service + DB) in subsequent architecture steps.

**Backend (separate from Vite starter):**

Persistence and HTTP mutations are implemented per **Core Architectural Decisions** — **Supabase PostgreSQL** plus **Supabase Edge Functions** (not a Node server inside the Vite repo unless explicitly added later).

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- **Data:** Supabase **PostgreSQL** as the system of record; **Edge Functions** as the **only** server-side entry for mutating and listing scenarios/tapes (no direct client writes to privileged DB roles).
- **Hosting:** **Vercel** for the **Vite/React SPA**; Supabase hosts DB + Edge Functions (stay on **free** tiers until usage forces a change).
- **Identity:** **No end-user authentication** — matches PRD; access control is **possession of non-guessable scenario slug** (read / add / edit / delete tapes) plus **server-side** limits.
- **Client stack:** **Vite** + **React** + **TypeScript** + **Tailwind CSS v4** (`@tailwindcss/vite`) per starter evaluation.

**Important Decisions (Shape Architecture):**

- **API shape:** **HTTPS JSON** over **Supabase Edge Function** endpoints (REST-like resources: e.g. scenario by slug, add tape, **update tape**, **delete tape**, create scenario). Exact paths and payloads defined at implementation; **OpenAPI optional**, not blocking.
- **Validation:** **Zod** (or equivalent) at the Edge Function boundary for payloads; shared types between client and server where practical.
- **Server state:** **TanStack Query** (`@tanstack/react-query`, v5 line on npm) for fetching/mutations, retries, and cache invalidation after tape/scenario changes.
- **Routing:** **React Router** (v7 line on npm) for SPA routes: home/library, scenario by slug, tape creator flows.
- **Tape rendering:** **DOM/SVG vs canvas** remains an **implementation spike** inside the client; accessibility must not be image-only (WCAG per UX).

**Deferred Decisions (Post-MVP):**

- **Supabase Realtime** for live tape list updates — **not** required for MVP (refetch after mutation is enough).
- **Image export** (save/share PNG) — storage bucket and share pipeline **deferred**; may add **Supabase Storage** or client-only export later.
- **Redis / edge cache** — **not** for MVP at friend-scale traffic.
- **Paid tiers** (Vercel Pro, Supabase Pro) — **only** if free-tier limits or reliability become a problem.

### Data Architecture

- **Database:** **Supabase-managed PostgreSQL** (single project; **free tier**).
- **Schema:** Tables for **scenarios** (id, name, **public slug**, timestamps) and **tapes** (id, scenario id, text, color, sort order / **created_at**, **updated_at** for edits). Slug generated with **cryptographically strong randomness** (not sequential IDs).
- **Migrations:** **Supabase** migration workflow (SQL files) **or** **Drizzle** + migrations — choose one at implementation and keep migrations versioned.
- **Access pattern:** **Edge Functions** use the **service role** (or equivalent server secret) to talk to Postgres; **no** service role in the browser.
- **Caching:** **HTTP caching** on safe `GET` responses optional; **no** Redis for MVP.

### Authentication & Security

- **Authentication:** **None** for users — no Supabase Auth flows for friends in MVP.
- **Authorization:** **Scenario slug** is a **capability**; anyone with the link can read, add, update, and delete tapes per PRD; **no** per-user ACL or per-tape ownership in MVP.
- **API keys:** **Anon** key only in the client if required for **Supabase client** usage; **secrets** only in Edge Function env. **Never** ship service-role keys to Vercel client bundles.
- **Abuse / free-tier posture:** **Rate limits** and **max text length** enforced in Edge Functions; **idempotent** tape-create where practical to survive flaky mobile networks.
- **Transport:** **HTTPS** everywhere (Vercel + Supabase defaults).

### API & Communication Patterns

- **Style:** **REST-like JSON** over **Edge Functions** (clear, debuggable, works well with TanStack Query). Tape mutations include **PATCH/PUT**-style update and **DELETE** with scenario scope validated server-side (slug + tape id).
- **Errors:** **Stable error shape** (e.g. `{ error: { code, message } }`) and HTTP status codes; client shows **inline** errors per UX (no toast spam).
- **Documentation:** Inline comments + optional OpenAPI later; not blocking for MVP.
- **Client ↔ server:** Browser calls **Edge Function URLs** (or Supabase-invoked routes per chosen pattern); **CORS** configured for the **Vercel production origin** and **local dev** origin.

### Frontend Architecture

- **Structure:** Feature-oriented folders under `src/` (`tape`, `scenario`, `library`, `ui`).
- **State:** **TanStack Query** for server state; **React local state** for tape input, color picker UI, and ephemeral creator UI.
- **Routing:** **React Router** for `/`, `/s/:slug` (or agreed path), library route as designed in UX.
- **Performance:** **Memoization** for tape renderer; **debounce** only if profiling shows need — PRD prefers **no perceptible lag** on keystrokes.
- **Styling:** **Tailwind v4** + design tokens per UX; **Bebas Neue** + **DM Mono** from Google Fonts.

### Infrastructure & Deployment

- **Frontend:** **Vercel** for the SPA — connect Git repo or CLI; **environment variables** for Supabase project URL and **public** anon key only.
- **Backend:** **Supabase** project — Postgres + Edge Functions; secrets in Supabase dashboard.
- **CI/CD:** **Vercel** automatic deploys on push; **Supabase** CLI for migrations/Edge deploys when wired (exact pipeline in implementation).
- **CI:** **Optional** GitHub Actions for lint/test — not blocking MVP.
- **Monitoring:** **Supabase** dashboard + **Vercel** analytics/logs on free tier; **no** paid APM required initially.

### Decision Impact Analysis

**Implementation Sequence:**

1. **Supabase** project + **schema** + **migrations** + **slug** strategy.
2. **Edge Functions** for **create scenario**, **get scenario by slug**, **add tape**, **update tape**, **delete tape** (with limits + idempotency hooks where applicable).
3. **Vite** app + **routing** + **TanStack Query** wiring to Edge Functions.
4. **TapeRenderer** spike (DOM/SVG/canvas) until **performance + a11y** bar is met.
5. **Polish:** optimistic UI (including **rollback** on failed edit/delete), **delete confirmation** flow (FR32), skeleton loading, focus management per UX.

**Cross-Component Dependencies:**

- **Slug format** and **Edge Function** contract drive **React Router** routes and **share links**.
- **TanStack Query** mutation success must **invalidate** (or **update**) scenario/tape queries so the **tape stack** matches PRD “immediate” feel for **add, edit, and delete**.
- **Non-negotiable:** **service role** never in client; **free tier** usage monitored so **egress** and **Function invocations** stay reasonable for friends-only use.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** Areas where agents could diverge — **DB/API naming**, **JSON field casing**, **error payload shape**, **TanStack Query keys**, **route paths vs API paths**, **Edge Function file layout**, **secret handling**.

### Naming Patterns

**Database Naming Conventions (PostgreSQL):**

- **Tables:** plural `snake_case` — e.g. `scenarios`, `tapes`.
- **Columns:** `snake_case` — e.g. `scenario_id`, `created_at`, `public_slug`.
- **Primary keys:** `id` (UUID) unless a strong reason otherwise.
- **Foreign keys:** `{table_singular}_id` — e.g. `scenario_id`.
- **Indexes:** `idx_{table}_{columns}` — e.g. `idx_tapes_scenario_id_created_at`.

**API Naming Conventions (Edge Functions + HTTP):**

- **URLs:** **kebab-case** path segments where applicable; **plural** resource nouns — e.g. `/scenarios`, `/scenarios/:slug/tapes`.
- **Route params:** `:slug` in docs; implementation uses consistent param names (`slug`, not `id`, for public scenario key).
- **JSON body/response fields:** **camelCase** at the HTTP boundary (transform from/to `snake_case` in SQL layer inside Edge Functions).
- **Query params:** **camelCase** — e.g. `?cursor=`, `?limit=`.

**Code Naming Conventions (Client — React/TS):**

- **React components:** **PascalCase** — `TapeRenderer`, `ScenarioLibrary`.
- **Component files:** match export — `TapeRenderer.tsx`.
- **Hooks:** `use` prefix + **camelCase** — `useScenario`, `useTapeCreator`.
- **Utilities:** **camelCase** files — `slug.ts`, `formatTapeCount.ts`.
- **Constants:** **UPPER_SNAKE** or **camelCase** object namespaces — `ROUTES.HOME` if using a routes map.

**Code Naming Conventions (Edge Functions — TypeScript/Deno):**

- **Files:** **kebab-case** for function entry files: `create-scenario.ts`, `get-scenario-by-slug.ts`.
- **Handlers:** **camelCase** `handler` export or default export per Supabase convention used in repo.

### Structure Patterns

**Project Organization (single repo recommended):**

```
web/                 # Vite app (deploy to Vercel)
  src/
    features/        # scenario | tape | library — feature-first
    components/      # shared presentational only
    lib/             # api client, query keys, zod schemas
supabase/
  functions/         # Edge Functions
  migrations/        # SQL migrations
```

- **Tests:** **Co-located** `*.test.ts` or `*.test.tsx` next to the file under test (Vitest).
- **Zod schemas:** `web/src/lib/schemas/` — single source for request validation (duplicate or share into Edge if no monorepo package yet).

**Static assets:** `web/public/` or Google Fonts via CSS — avoid duplicating font loading logic.

**Environment files:** `.env.local` (gitignored) for Vite; **never** commit secrets. **Vercel** dashboard for production env. Only **`VITE_*`** for values that may appear in the client bundle.

### Format Patterns

**API Response Formats:**

- **Success (200/201):** **Direct JSON body** — no `{ data: { ... } }` wrapper unless a list needs pagination metadata, e.g. `{ items: [...], nextCursor: null }`.
- **Errors:** **Always** `{ "error": { "code": "STRING_CODE", "message": "human readable" } }` with appropriate **4xx/5xx** status. **No** stack traces in production responses.

**Data Exchange Formats:**

- **Dates:** **ISO 8601** strings in UTC — e.g. `"2026-03-29T20:15:00.000Z"`.
- **Booleans:** JSON `true`/`false`.
- **Nulls:** Use `null` for absent optional fields; avoid omitting vs null inconsistency within the same resource type.

**TanStack Query Keys:**

- **Factory pattern** — e.g. `queryKeys.scenarios.all`, `queryKeys.scenario(slug)`.
- **Invalidate** parent lists when a scenario’s tapes change.

### Communication Patterns

**Event System Patterns:**

- **No global event bus** for MVP — use **React state** + **TanStack Query** cache updates.
- **DOM events:** standard React patterns only.

**State Management Patterns:**

- **Server state:** TanStack Query only — **no** duplicating server lists in global client store.
- **UI state:** `useState` / `useReducer` local to feature; lift only when two distant components need it.
- **Immutability:** follow React norms — **no** mutating query cache directly; use `queryClient.setQueryData` / invalidation.

### Process Patterns

**Error Handling Patterns:**

- **Mutations:** surface **inline** error string from `error.message` mapped from API `{ error.message }`; keep creator open on failure (per UX). **Edit/delete failures** must **revert optimistic updates** and keep list/server state aligned (per PRD reliability).
- **Query errors:** scenario view shows **inline** retry affordance; no blocking modal for MVP.
- **React Error Boundary:** optional at route level for unexpected render errors — **not** for expected API errors.

**Loading State Patterns:**

- **Queries:** use TanStack Query `isPending` / `isFetching` — **skeleton** for scenario load per UX; **no** full-screen spinner on first paint for tape creator.
- **Mutations:** **optimistic** where specified in architecture; otherwise **subtle** “Saving…” after 1s threshold per UX.

### Enforcement Guidelines

**All AI Agents MUST:**

- Keep **service role** and DB passwords **only** in Supabase/Edge secrets — **never** in Vite source or `VITE_*` vars.
- Use **camelCase JSON** at HTTP boundaries and **snake_case** in SQL.
- **Invalidate** or **update** TanStack Query cache after successful scenario/tape mutations.
- Respect **WCAG** notes for **TapeRenderer** (no image-only text).

**Pattern Enforcement:**

- **PR review** / **lint rules** for env usage; **Zod** parse at Edge Function entry.
- **Violations:** fix before merge; update this doc if a pattern changes.

### Pattern Examples

**Good Examples:**

- Table `tapes`, column `scenario_id`, API response `{ "text": "...", "createdAt": "..." }`.
- `queryKeys.scenario(slug)` used for both scenario detail and tape list where appropriate.

**Anti-Patterns:**

- Exposing **Supabase service role** in frontend code.
- **Mixed casing** (`user_id` in JSON and `userId` in same response) without a defined mapping layer.
- **Bypassing** Edge Functions with direct table writes from the browser using elevated keys.

## Project Structure & Boundaries

### Complete Project Directory Structure

```
caution-bmad/
├── README.md
├── .gitignore
├── .env.example                    # Document VITE_* and non-secret vars only
├── web/                            # Vite SPA → Vercel (set app root to web/ in Vercel)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── eslint.config.js            # or eslint.config.mjs — match Vite template
│   ├── index.html
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/
│   │   │   ├── index.tsx           # route table / lazy routes
│   │   │   └── paths.ts            # single source for path patterns / :slug
│   │   ├── features/
│   │   │   ├── tape/
│   │   │   │   ├── components/     # TapeRenderer, TapeCreatorPanel, ColorPickerSwatch
│   │   │   │   ├── hooks/
│   │   │   │   └── *.test.tsx
│   │   │   ├── scenario/
│   │   │   │   ├── components/     # TapeStack, PinnedAddButton, edit/delete, DeleteConfirmSheet
│   │   │   │   ├── hooks/
│   │   │   │   └── *.test.tsx
│   │   │   └── library/
│   │   │       ├── components/     # ScenarioCard, ScenarioLibrary
│   │   │       └── *.test.tsx
│   │   ├── components/
│   │   │   └── layout/             # AppHeader, shells
│   │   ├── lib/
│   │   │   ├── api-client.ts       # fetch wrapper → Edge Function base URL
│   │   │   ├── query-keys.ts
│   │   │   ├── query-client.ts
│   │   │   └── schemas/            # Zod — tape, scenario DTOs
│   │   └── styles/
│   │       └── index.css           # @import "tailwindcss"; + tokens
│   └── vitest.config.ts            # when Vitest added
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── YYYYMMDDHHMMSS_init.sql
│   └── functions/
│       ├── _shared/                # optional: zod, cors helpers, db client
│       ├── create-scenario/
│       │   └── index.ts
│       ├── get-scenario-by-slug/
│       │   └── index.ts
│       ├── add-tape/
│       │   └── index.ts
│       ├── update-tape/
│       │   └── index.ts
│       ├── delete-tape/
│       │   └── index.ts
│       └── list-scenarios/         # GET library — add when implementing FR15–FR18
│           └── index.ts
└── _bmad-output/
    └── planning-artifacts/
        └── architecture.md
```

### Architectural Boundaries

**API Boundaries:**

- **Browser →** only **HTTPS** to **Supabase Edge Function** URLs for scenario/tape operations (single consistent style: **all** scenario/tape traffic through Edge Functions for validation and limits).
- **Edge Functions →** Postgres via **service role** / server client **only** inside `supabase/functions/**`.
- **No** browser → Postgres **service role** path.

**Component Boundaries:**

- **`features/tape`:** creation UI + **TapeRenderer**; no direct scenario list fetching (use hooks that call `lib/api-client`).
- **`features/scenario`:** tape stack + add flow + **edit/delete** (with **delete confirmation** before API call); depends on **scenario slug** from router.
- **`features/library`:** scenario grid; depends on **list-scenarios** Edge Function.
- **`components/layout`:** header/navigation; no business logic beyond links.

**Service Boundaries:**

- **`lib/api-client.ts`:** single place for base URL, `fetch`, error parsing to `{ error: { code, message } }`.
- **TanStack Query:** all server reads/writes go through hooks in `features/*/hooks` using `api-client` + `query-keys`.

**Data Boundaries:**

- **Schema truth:** `supabase/migrations/*.sql`.
- **Runtime access:** Edge Functions only for writes; reads via Edge GET handlers returning DTOs with **camelCase** JSON.

### Requirements to Structure Mapping

**FR categories → locations**

| FR area (PRD) | Primary location |
|---------------|------------------|
| Tape creation & preview (FR1–FR5) | `web/src/features/tape/` |
| Tape rendering (FR6–FR8) | `web/src/features/tape/components/TapeRenderer.tsx` |
| Scenario management (FR9–FR14) | `web/src/features/scenario/` + Edge `get-scenario-by-slug`, `add-tape` |
| Scenario library (FR15–FR18) | `web/src/features/library/` + Edge `list-scenarios` |
| Sharing & anonymous access (FR19–FR22) | `web/src/routes/` (deep link) + slug generation in Edge `create-scenario` |
| Tape editing & deletion (FR29–FR32) | `web/src/features/scenario/` (edit UI, **delete confirmation**) + Edge `update-tape`, `delete-tape` |
| Persistence (FR23–FR25) | `supabase/migrations/` + Edge mutations |
| Layout & navigation (FR26–FR28) | `web/src/components/layout/`, `routes/` |

**Cross-cutting:**

- **Query keys / cache:** `web/src/lib/query-keys.ts`
- **Validation (Zod):** `web/src/lib/schemas/` + optional `_shared/` in Edge
- **Rate limits / max length:** Edge Functions only

### Integration Points

**Internal communication:** React Router passes **slug** into scenario feature; features use **TanStack Query** for data; **no** prop-drilling of fetchers.

**External integrations:** **Supabase** (DB + Edge); **Vercel** (static + env); **Google Fonts** (UX).

**Data flow:** User input → **tape UI state** → **Generate** → mutation **add-tape** or **create-scenario** → Edge → Postgres → **invalidate** queries → UI updates. **Edit/delete:** confirmation (delete) → **update-tape** / **delete-tape** → same invalidation rules; **rollback** optimistic state on failure.

### File Organization Patterns

**Configuration:** `web/vite.config.ts`, `web/tsconfig*.json`, `supabase/config.toml`.

**Source:** Feature-first under `web/src/features`; shared UI only in `components/`.

**Tests:** Co-located `*.test.ts(x)` next to source; Edge Function unit tests optional under `supabase/functions/**/*.test.ts` if Deno test is used.

**Assets:** `web/public/` for static files; fonts via CSS `@import` from Google Fonts per UX.

### Development Workflow Integration

**Dev:** `npm run dev` in `web/`; **Supabase CLI** linked project or `supabase start` for local DB/Edge when configured.

**Build:** `npm run build` in `web/` → `dist/` for Vercel.

**Deploy:** Vercel serves `web` output; Supabase Dashboard or CLI deploys **migrations** and **functions** separately.

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**

- **Vercel (static SPA) + Supabase (DB + Edge)** avoids shipping server secrets to the client while keeping hosting on free tiers.
- **TanStack Query + REST-like Edge JSON** fits optimistic updates and retry semantics from project context analysis.
- **camelCase JSON / snake_case SQL** with transforms in Edge aligns patterns with Postgres and TypeScript norms.
- **No conflicting choice:** Next.js was set aside; structure uses `web/` + `supabase/` consistently.

**Pattern Consistency:**

- Naming, error shape, and query-key factory support the documented decisions.
- Loading/error process patterns match UX (inline, skeletons, no toast spam for MVP).

**Structure Alignment:**

- Feature folders match FR groupings; Edge function set covers create/read scenario, add tape, and **list** for library.

### Requirements Coverage Validation

**Functional requirements:**

- **Tape through library and sharing:** Mapped in **Requirements to Structure Mapping**; FR15–FR18 covered by **`list-scenarios`** + `features/library`.
- **Edit/delete (FR29–FR32):** Covered by **`update-tape`** / **`delete-tape`** Edge handlers, scenario feature UI, and **delete confirmation** before calling delete (FR32).
- **Gaps:** None identified that block starting implementation; **exact** REST paths and DTO fields are finalized in API implementation.

**Non-functional requirements:**

- **Performance:** Addressed by tape spike priority, Edge-only writes with validation, TanStack caching.
- **Security:** Non-guessable slugs (implementation detail in Edge), no service role in client, rate/length limits in Edge.
- **Reliability:** Idempotency/retry called out in decisions and patterns; **edit/delete consistency** (no orphaned optimistic state) reflected in process patterns.

### Implementation Readiness Validation

**Decision completeness:** Critical stack choices documented; **exact semver** pinned at scaffold time (not duplicated here).

**Structure completeness:** Concrete tree for `web/` and `supabase/`; integration points named.

**Pattern completeness:** Conflict-prone areas (casing, secrets, query invalidation) have explicit rules and anti-patterns.

### Gap Analysis Results

| Priority | Gap | Resolution |
|----------|-----|------------|
| **Important** | **List scenarios** Edge handler sketched but not fully specified in Core Decisions | Add during first library story; follow same error/JSON patterns. |
| **Important** | **CORS** allowed origins for local vs Vercel | Configure in Edge `_shared` when wiring `fetch`. |
| **Nice-to-have** | OpenAPI | Deferred per Core Decisions. |
| **Nice-to-have** | E2E test folder | Add when Playwright/Cypress is chosen. |

### Validation Issues Addressed

- **Library API** was implicit in early Edge list; **structure includes `list-scenarios/`** so FR15–FR18 have a home.

### Architecture Completeness Checklist

**Requirements analysis**

- [x] Project context analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural decisions**

- [x] Critical decisions documented (versions pinned at install)
- [x] Technology stack specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project structure**

- [x] Directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements-to-structure mapping complete

### Architecture Readiness Assessment

**Overall status:** **READY FOR IMPLEMENTATION**

**Confidence level:** **High** for MVP scope; **medium** for operational tuning (free-tier limits) — monitor in Supabase/Vercel dashboards.

**Key strengths:** Clear split client/server; strong consistency rules for agents; PRD-aligned sequencing (tape first).

**Areas for future enhancement:** Realtime updates, image export, OpenAPI, paid tier only if needed.

### Implementation Handoff

**AI agent guidelines:**

- Follow this document for stack, boundaries, and patterns.
- Do not introduce **direct** privileged DB access from the browser.

**First implementation priority:**

1. `npm create vite@latest web -- --template react-ts` then Tailwind v4 per Starter Template Evaluation.
2. Supabase project: migrations for `scenarios` / `tapes`, then Edge Functions (`create-scenario`, `get-scenario-by-slug`, `add-tape`, `update-tape`, `delete-tape`, `list-scenarios`).
3. **TapeRenderer** spike before polishing library UX.
