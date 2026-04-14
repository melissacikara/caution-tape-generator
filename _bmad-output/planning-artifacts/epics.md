---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
workflowComplete: true
completedAt: '2026-03-29'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# caution-bmad - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for caution-bmad, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

```
FR1: Users can type text into a tape creator and see a live tape preview update in real time as they type
FR2: Users can confirm a tape to add it to a scenario
FR3: Users can select a tape color using a full-spectrum color picker before confirming
FR4: The system renders tape text in a continuous repeating pattern (e.g. CAUTION: [text] ⚠ CAUTION: [text] ⚠)
FR5: The system scales the tape's rendered length proportionally to the character length of the input text
FR6: The system displays all tapes with a diagonal stripe pattern
FR7: The system displays tape text in bold, industrial all-caps typography
FR8: The system applies the user's selected color to the tape's visual appearance
FR9: Users can create a new named scenario
FR10: Users can view all tapes in a scenario as a vertically scrollable list
FR11: Users can access the tape creator from within a scenario view
FR12: Users can add a tape to a scenario from within that scenario's view
FR13: The system displays the total tape count for each scenario
FR14: Users can navigate back to the scenario library from any scenario view
FR15: Users can view all scenarios on the home screen
FR16: The system displays each scenario as a card showing its name and tape count — the count is a provocation to click, not just information
FR17: Users can navigate to a specific scenario from the library
FR18: Users can initiate creation of a new scenario from the home screen
FR19: The system generates a unique shareable URL for each scenario
FR20: Users can access a scenario via its shareable URL without creating an account
FR21: Users can add tapes to any scenario they access via a shareable URL
FR22: The system does not require authentication for any action anywhere in the app
FR23: The system permanently stores all scenarios and their tapes
FR24: Users can return to a scenario at any future time and find all tapes intact
FR25: Tapes added by any user via a shared link are persisted to the scenario immediately
FR26: The system presents a fully functional, mobile-responsive layout across all views
FR27: The homepage prominently presents the tape creator as the primary element
FR28: The ADD button remains pinned and visible while scrolling through a scenario's tape stack
FR29: Users can edit an existing tape from the scenario view (including changing text and/or color) and see the updated tape in the stack immediately after saving
FR30: Users can delete a tape from a scenario; the tape is removed for everyone with access to that scenario
FR31: Edit and delete are available to anyone who can open the scenario via its shareable URL — the same anonymous, link-based access model as viewing and adding tapes (no per-tape owner or role in MVP)
FR32: Before a tape is permanently deleted, the system requires an explicit confirmation step (e.g. modal or bottom sheet). Confirmation reduces accidental loss; it is not authentication and does not restrict who may delete (still anyone with the scenario link)
```

### NonFunctional Requirements

Authoritative detail: `prd.md` § Non-Functional Requirements. Summary below for epic traceability.

```
NFR1: Tape preview renders in real time as the user types — perceptible lag between keystroke and visual update is a defect
NFR2: App loads and is interactive within 2 seconds on a standard mobile connection
NFR3: Shared scenario link opens and displays existing tapes within 2 seconds on mobile
NFR4: Color picker responds to touch input without delay
NFR5: No personally identifiable information is collected or stored — users are fully anonymous
NFR6: Scenario URLs use non-guessable slugs (not sequential IDs) to prevent casual enumeration
NFR7: No authentication credentials, payment data, or sensitive user data is handled at any point
NFR8: Scenarios and tapes are never lost — persistence is the core product promise
NFR9: A confirmed tape is immediately saved and visible to anyone with the scenario link
NFR10: The app handles poor mobile connections gracefully — a failed tape submission must not result in data loss
NFR11: Destructive actions use confirmation (see FR32) so a stray tap does not remove a tape; copy stays short and in voice with the rest of the app
NFR12: Link possession implies full edit/delete for any holder of the scenario URL; no per-tape author, audit trail, or permission tier in MVP
NFR13: Future tightening (e.g. ownership-based edit/delete, soft-delete/undo) would require explicit product scope — not assumed for MVP
NFR14: Edits and deletes take effect immediately for everyone with the scenario link; a failed edit or delete must not leave the UI and stored state inconsistent
```

### Additional Requirements

```
- **Starter template (Epic 1 / first frontend story):** Scaffold client with Vite `react-ts` template (`npm create vite@latest web -- --template react-ts`), add Tailwind CSS v4 via `@tailwindcss/vite` per current docs; pin exact package versions at init; Node version per Vite/npm requirements (e.g. 20.19+ or 22.12+ as applicable).
- **Backend:** Supabase PostgreSQL as system of record; Supabase Edge Functions as the only server-side entry for listing scenarios, creating scenarios, reading scenario by slug, adding tapes, **updating tapes, and deleting tapes** — no direct browser writes with privileged DB roles.
- **Hosting:** Vercel for the Vite/React SPA (`web/`); Supabase hosts DB and Edge Functions; remain on free tiers until usage forces a change.
- **Identity:** No end-user authentication; access control is possession of non-guessable scenario slug plus server-side limits (rate limit, max text length).
- **Client stack:** React, TypeScript, Tailwind v4, React Router (v7 line) for `/`, library, `/s/:slug` (or agreed paths), TanStack Query for server state, retries, cache invalidation after mutations.
- **Data model:** Tables `scenarios` (id, name, public slug, timestamps) and `tapes` (id, scenario id, text, color, sort order / created_at); slugs generated with cryptographically strong randomness (not sequential IDs); migrations via Supabase SQL or Drizzle — choose one and version migrations.
- **API:** HTTPS JSON to Edge Function URLs; camelCase at HTTP boundary; transform to/from snake_case in SQL layer inside Edge Functions; stable error payload `{ "error": { "code", "message" } }` with appropriate HTTP status; Zod (or equivalent) validation at Edge boundary.
- **Security:** Service role / secrets only in Supabase Edge env — never ship service-role keys to Vercel client bundles; anon/public keys only in client as required; HTTPS everywhere.
- **Network / reliability:** Design tape-create for retries and idempotency (or safe deduplication) for flaky mobile networks; optimistic add with rollback and inline error on server rejection; preserve user draft in creator on failure (per UX).
- **CORS:** Configure allowed origins for Vercel production and local development in Edge `_shared` when wiring fetch.
- **Tape rendering:** Choose DOM/SVG vs canvas (or hybrid) with tradeoffs for performance, maintainability, and accessibility — canvas requires parallel accessible text strategy (e.g. aria-label / non-image-only content).
- **Observability:** Supabase dashboard + Vercel logs/analytics on free tier for MVP; optional GitHub Actions for lint/test — not blocking.
- **Naming consistency:** PostgreSQL tables/columns snake_case; JSON HTTP fields camelCase; Edge function entry files kebab-case; TanStack Query key factory pattern; plural resource nouns in URLs where applicable.
- **Implementation sequence (architecture):** (1) Supabase project + schema + migrations + slug strategy, (2) Edge Functions for create scenario, get by slug, add tape, **update tape, delete tape**, list scenarios, (3) Vite app + routing + TanStack Query to Edge, (4) TapeRenderer spike until performance and a11y bar met, (5) Polish: optimistic UI, skeleton loading, focus management per UX, **edit/delete mutations with rollback**.
- **Deferred post-MVP:** Supabase Realtime for live list updates; image export pipeline; Redis; paid tiers only if needed.
```

### UX Design Requirements

```
UX-DR1: Implement Tailwind CSS v4 with custom design tokens for the industrial shell (e.g. background #111111, surface #1C1C1C, surface-raised #252525, border #2E2E2E, text-primary #F0F0F0, text-secondary #888888, accent #FFD000, accent-text #111111) — structural UI uses token contract, not ad hoc hex.
UX-DR2: Load Bebas Neue and DM Mono from Google Fonts; use Bebas Neue for tape text and display headings; DM Mono for labels, counts, buttons, metadata — no italic/decorative weights per spec.
UX-DR3: Implement TapeRenderer: diagonal stripe layer + repeating CAUTION text pattern; states empty / live / generated; tape length scales with character count; if canvas is used, expose tape text to assistive technology (e.g. aria-label) — not image-only.
UX-DR4: Implement TapeCreatorPanel per Direction B (Command Center): labeled "Warning Text" block with CAUTION prefix in accent + inline input + blink cursor; color swatch row; labeled "Live Preview" panel containing TapeRenderer; footer with primary Generate and secondary actions (e.g. Reset); real `<input>` with aria-label for caution tape text.
UX-DR5: Implement ColorPickerSwatch: full-spectrum selection; show selected color as text value alongside swatch (not color-only); touch-first; MVP may use basic color input with Phase 3 refined HSL picker.
UX-DR6: Implement AppHeader: wordmark (e.g. ⚠ CAUTION TAPE GEN) left, Library link right — slim persistent header on all screens.
UX-DR7: Implement ScenarioCard: bordered card, scenario name (Bebas Neue), provocative tape-count line (DM Mono); full card is one focusable link; hover/focus border highlight.
UX-DR8: Implement ScenarioLibrary: page header with scenario summary, responsive grid (1 column mobile → 2 columns at `sm`), New Scenario action; empty library shows tape creator (adaptive homepage).
UX-DR9: Implement TapeStack: vertical scroll, ordered list of tapes newest-at-top, no pagination.
UX-DR10: Implement PinnedAddButton: full-width fixed bottom in scenario view, "+ ADD TAPE", primary yellow styling; `loading` state for slow connections; remains in tab order when content scrolls; min 44×44px touch target.
UX-DR11: Enforce button hierarchy: one primary (full-width yellow #FFD000, min ~44px height) per screen; secondary bordered muted; ghost for back links — Generate and Add to Scenario never on same step simultaneously; empty Generate tap does nothing silently (no disabled styling).
UX-DR12: Feedback: no success toasts; tape add confirmed by stack update; show "Saving..." muted only if save >1s; inline "Couldn't save. Try again." on failure with creator staying open and draft preserved.
UX-DR13: Loading: no blocking splash on first paint for tape creator; shared scenario route uses skeleton tape placeholders while fetching (align with ≤2s target); optimistic tape appearance on fast save per architecture/UX.
UX-DR14: Navigation: shared URL loads scenario view directly (no splash/login); header Library link always available; scenario view uses "← All Scenarios" ghost back; tape creator from scenario is full-screen overlay/state, not a separate navigable page; depth stays library ↔ scenario only.
UX-DR15: Empty states: first-visit homepage = CAUTION + cursor only; library with no scenarios = tape creator; scenario with no tapes = name + empty area + pinned ADD; live preview empty = muted placeholder or empty box per spec.
UX-DR16: Responsive: mobile-first; centered max width `max-w-[480px]` default, `max-w-[640px]` at `md+`; scenario library 1→2 columns only at `sm`; sizing via rem/Tailwind — no hover-only interactions.
UX-DR17: Accessibility WCAG 2.1 AA target: verify contrast (bump text-secondary to #999 if body audit fails); 44×44px minimum interactive targets; full keyboard navigation without traps; 2px yellow focus outline on focusable elements; semantic `<button>`, `<a>`, `<input>`, `<nav>`; aria-labels on icon-only controls; when opening tape creator from scenario, move focus to input; cursor blink is only intentional motion.
UX-DR18: Adaptive homepage: users with no scenarios see tape creator first; users with existing scenarios see scenario library as home — preserves first-time "CAUTION:" moment and returning-user access to content.
UX-DR19: Per-tape edit and delete affordances on each row in scenario view; same anonymous link-based capability as add (FR29–FR31).
UX-DR20: DeleteConfirmSheet (or modal): explicit confirmation before permanent delete (FR32); short on-brand copy; Cancel/Confirm; focus management on dismiss — safety against stray taps, not authentication.
```

### FR Coverage Map

FR1: Epic 1 — Live preview while typing
FR2: Epic 2 — Confirm tape and add it to a scenario (requires persistence)
FR3: Epic 1 — Full-spectrum color picker before confirming
FR4: Epic 1 — Repeating CAUTION text pattern
FR5: Epic 1 — Tape length scales with input character length
FR6: Epic 1 — Diagonal stripe pattern on tape
FR7: Epic 1 — Bold industrial all-caps typography
FR8: Epic 1 — User-selected color applied to tape appearance
FR9: Epic 2 — Create a named scenario
FR10: Epic 2 — View tapes in a vertically scrollable list
FR11: Epic 2 — Access tape creator from scenario view
FR12: Epic 2 — Add a tape from within scenario view
FR13: Epic 2 — Total tape count per scenario
FR14: Epic 3 — Navigate back to scenario library from scenario view
FR15: Epic 3 — View all scenarios on home screen
FR16: Epic 3 — Scenario cards show name and provocative tape count
FR17: Epic 3 — Open a specific scenario from the library
FR18: Epic 3 — Start a new scenario from home
FR19: Epic 2 — Unique shareable URL per scenario
FR20: Epic 2 — Access scenario via URL without an account
FR21: Epic 2 — Add tapes via shareable URL
FR22: Epic 2 — No authentication for any action
FR23: Epic 2 — Permanently store scenarios and tapes
FR24: Epic 2 — Return later and find tapes intact
FR25: Epic 2 — Shared-link adds persist immediately
FR26: Epic 4 — Mobile-responsive layout across all views
FR27: Epic 1 + Epic 3 — Homepage centers tape creator; adaptive home when scenarios exist
FR28: Epic 2 — ADD button pinned while scrolling tape stack
FR29: Epic 2 — Edit tape from scenario view (text/color); stack updates after save
FR30: Epic 2 — Delete tape; removed for all viewers with scenario link
FR31: Epic 2 — Edit/delete available to anyone with shareable URL (no per-tape roles in MVP)
FR32: Epic 2 — Explicit confirmation before permanent delete (modal or bottom sheet; not auth)

## Epic List

### Epic 1: Authentic caution tape creation

Users can open the app, type, and see a live industrial caution tape (diagonal stripes, repeating text, bold type, user color, length scaling), adjust color, and generate a locked tape — the core “looks official” moment. Delivers the Command Center shell (header, labeled blocks, preview panel) and app foundation (Vite, React, TypeScript, Tailwind v4, design tokens, fonts) per architecture and UX. Full “add to scenario” (FR2) is completed in Epic 2 once persistence exists.

**FRs covered:** FR1, FR3, FR4, FR5, FR6, FR7, FR8, and the homepage aspect of FR27 (tape creator as primary element on first paint).

### Epic 2: Shared scenarios and persistent tapes

Users can create named scenarios, receive shareable URLs, open scenarios without accounts, view a scrollable tape stack, add tapes with a pinned ADD control, **edit or delete any tape from the scenario view** (same link-based rules as add, with **confirm-before-delete**), and rely on durable storage so links keep working. Implements Supabase data model, Edge Functions, routing by slug, mutations with validation/limits/idempotency patterns, and optimistic/error UX aligned with architecture.

**FRs covered:** FR2, FR9, FR10, FR11, FR12, FR13, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR28, **FR29, FR30, FR31, FR32**.

### Epic 3: Scenario library and adaptive home

Returning users see a scenario library with provocative cards (name + tape count), can open any scenario, start a new scenario from home, and move between library and scenario with clear back navigation. Adaptive homepage: tape-first when there are no scenarios; library when scenarios exist.

**FRs covered:** FR14, FR15, FR16, FR17, FR18, and the adaptive aspect of FR27.

### Epic 4: Polished, resilient, inclusive experience

Cross-cutting quality: responsive behavior across all surfaces (FR26), performance and reliability expectations from the PRD, graceful handling of slow/failed saves (including **failed edit/delete** and consistency with server state per NFR14), and WCAG 2.1 AA–oriented accessibility (focus, keyboard, semantics, contrast, tape content exposed to assistive technology, **including delete confirmation focus**). Closes remaining UX-DR gaps not fully satisfied in Epics 1–3.

**FRs covered:** FR26 (primary); explicit alignment with NFR1–NFR14 and remaining UX design requirements as consolidated in the requirements inventory.

---

## Epic 1: Authentic caution tape creation

Users can open the app, type, and see a live industrial caution tape (diagonal stripes, repeating text, bold type, user color, length scaling), adjust color, and generate a locked tape — the core “looks official” moment. Delivers the Command Center shell (header, labeled blocks, preview panel) and app foundation (Vite, React, TypeScript, Tailwind v4, design tokens, fonts) per architecture and UX. Full “add to scenario” (FR2) is completed in Epic 2 once persistence exists.

**FRs covered:** FR1, FR3, FR4, FR5, FR6, FR7, FR8, FR27 (homepage centers tape creator on first paint).

**Relevant NFRs / UX-DRs:** NFR1, NFR4; UX-DR1–UX-DR6, UX-DR11 (button rules for Generate/Reset), UX-DR15–UX-DR16 (homepage empty / layout tokens).

### Story 1.1: Scaffold the web client with Vite, React, TypeScript, and Tailwind v4

As a developer,
I want the project bootstrapped with the approved starter (Vite `react-ts` + Tailwind v4 via `@tailwindcss/vite`),
So that all feature work builds on a consistent, documented foundation.

**Acceptance Criteria:**

**Given** a clean `web/` app root per architecture,
**When** the project is installed and `npm run dev` is executed,
**Then** the app serves a health page without errors and Tailwind utilities apply,
**And** package versions are pinned per team convention and `README` or `package.json` documents the Node version expectation.

**Given** the Tailwind v4 Vite integration,
**When** global styles import Tailwind per current docs,
**Then** utility classes render correctly in a smoke component.

### Story 1.2: Define industrial design tokens and load Bebas Neue and DM Mono

As a user,
I want the UI shell to use the industrial palette and typography defined in the UX spec,
So that the app feels like a serious “warning system,” not a generic template.

**Acceptance Criteria:**

**Given** the UX color and typography tokens (background, surface, accent, text-primary, text-secondary, etc.),
**When** tokens are applied via Tailwind theme extension or CSS variables,
**Then** structural screens use the token contract instead of ad hoc hex for shell elements,
**And** Bebas Neue and DM Mono load from Google Fonts with a single, documented loading strategy.

**Given** UX-DR2,
**When** fonts are missing or fail to load,
**Then** fallback fonts preserve readable layout without breaking the shell.

### Story 1.3: Implement TapeRenderer for stripes, repeating text, scaling, and color

As a user,
I want my warning text to look like real caution tape,
So that the joke lands because the format looks official.

**Acceptance Criteria:**

**Given** `text` and `color` inputs,
**When** text is non-empty,
**Then** the tape shows diagonal stripes, repeating “CAUTION: [text]” (with separator per PRD), industrial all-caps typography, and applies the selected color,
**And** tape length scales visibly with character count (FR5).

**Given** empty input,
**When** the component is in `empty` state,
**Then** preview shows an appropriate empty/placeholder treatment per UX (UX-DR15).

**Given** UX-DR3 accessibility,
**When** the implementation uses canvas or non-text rendering,
**Then** assistive technology receives the tape text (e.g. `aria-label` or equivalent), not image-only content.

### Story 1.4: Build TapeCreatorPanel with live preview wired to typing

As a user,
I want to type and see the tape update continuously,
So that the experience feels instant and intuitive (FR1).

**Acceptance Criteria:**

**Given** Direction B structure,
**When** I view the homepage tape creator,
**Then** I see labeled “Warning Text” and “Live Preview” sections with bordered panels per UX-DR4,
**And** a real text input with `aria-label` for caution tape text sits behind the styled “CAUTION:” presentation.

**Given** I am typing,
**When** each keystroke occurs,
**Then** the TapeRenderer updates without requiring a submit button (NFR1: no perceptible lag as a defect threshold),
**And** there is no placeholder copy in the tape field that breaks the “CAUTION: + cursor” moment (UX form patterns).

### Story 1.5: Add ColorPickerSwatch with spectrum selection and labeled value

As a user,
I want to pick any tape color before I lock in a tape,
So that the warning matches the vibe I want (FR3).

**Acceptance Criteria:**

**Given** UX-DR5,
**When** I open the color control,
**Then** I can choose a full-spectrum color (MVP may use native color input; document follow-up for refined HSL UI),
**And** the selected value is shown as text next to the swatch, not color-only.

**Given** I change color,
**When** the value updates,
**Then** TapeRenderer reflects the new color immediately (FR8),
**And** touch targets for the swatch meet minimum size for mobile (UX-DR16 / 44px guidance).

### Story 1.6: Add AppHeader and home layout with Command Center structure

As a user,
I want a slim header that orients me without breaking the bit,
So that I always know I’m in the app and can reach the library when it exists (FR27).

**Acceptance Criteria:**

**Given** UX-DR6,
**When** I load the home route,
**Then** I see the wordmark on the left and a Library link on the right (link may route to `/` until Epic 3 library exists, but must not 404),
**And** content uses centered max-width constraints per UX (`max-w-[480px]` default scaling to `md` per spec).

**Given** the navigation rule,
**When** I use the Library link,
**Then** behavior is defined for pre-library MVP (e.g. stays on home or shows empty state) without breaking routing work in later epics.

### Story 1.7: Implement Generate, locked tape state, and Reset

As a user,
I want to deliberately “lock in” my tape after previewing,
So that I can separate creative confirmation from later sharing actions (local confirmation before Epic 2 persistence).

**Acceptance Criteria:**

**Given** UX-DR11,
**When** Generate is available,
**Then** there is only one primary yellow full-width action in the footer zone for this step,
**And** tapping Generate with empty input does nothing silently (no disabled styling).

**Given** I tap Generate with non-empty text,
**When** generation completes,
**Then** the tape enters a locked/generated state distinct from live typing,
**And** a secondary Reset clears or restores the flow per UX without adding confirmation modals.

**Given** FR2 is completed in Epic 2,
**When** this story ships,
**Then** “Add to scenario” is hidden or stubbed without implying persistence until Epic 2 APIs exist (no fake success).

---

## Epic 2: Shared scenarios and persistent tapes

Users can create named scenarios, receive shareable URLs, open scenarios without accounts, view a scrollable tape stack, add tapes with a pinned ADD control, **edit or delete tapes** (with **delete confirmation** per FR32), and rely on durable storage so links keep working. Implements Supabase data model, Edge Functions, routing by slug, mutations with validation/limits/idempotency patterns, and optimistic/error UX aligned with architecture.

**FRs covered:** FR2, FR9, FR10, FR11, FR12, FR13, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR28, FR29, FR30, FR31, FR32.

**Relevant NFRs / UX-DRs:** NFR5–NFR14; UX-DR9, UX-DR10, UX-DR12–UX-DR14, **UX-DR19, UX-DR20**; architecture API/error/CORS/idempotency rules.

### Story 2.1: Create database schema for scenarios and tapes with non-guessable public slugs

As a developer,
I want durable tables and indexes for scenarios and tapes,
So that persistence and share links are correct from day one (FR23, NFR6).

**Acceptance Criteria:**

**Given** architecture naming rules,
**When** migrations run on a fresh database,
**Then** `scenarios` and `tapes` exist with snake_case columns, UUID PKs, FK from tapes to scenarios, and indexes for list-by-scenario ordering,
**And** `public_slug` (or equivalent) is populated using cryptographically strong randomness, not sequential IDs.

**Given** a tape row,
**When** stored,
**Then** color and text fields support the maximum lengths enforced at the API layer (coordinated with Story 2.2).

### Story 2.2: Implement Edge Functions for create-scenario, get-scenario-by-slug, and add-tape (update/delete in Story 2.9)

As a user,
I want the server to validate and persist my scenarios and tapes safely,
So that anonymous sharing works without leaking secrets or accepting garbage payloads.

**Acceptance Criteria:**

**Given** architecture constraints,
**When** Edge Functions handle requests,
**Then** payloads are validated with Zod (or equivalent), JSON uses camelCase at the HTTP boundary, and SQL uses snake_case internally,
**And** errors return `{ "error": { "code", "message" } }` with correct HTTP status (no stack traces in production).

**Given** add-tape,
**When** invoked,
**Then** rate limits and maximum text length are enforced server-side,
**And** idempotency hooks or safe deduplication strategy exist for flaky mobile retries (architecture + NFR10).

**Given** get-scenario-by-slug,
**When** a valid slug is requested,
**Then** response includes scenario metadata and ordered tapes (newest-first per UX),
**And** invalid slug returns a clear 404-style error.

### Story 2.3: Add shared API client, query keys, and TanStack Query setup

As a developer,
I want one fetch layer and query key factories,
So that all features share retries, parsing, and cache invalidation rules.

**Acceptance Criteria:**

**Given** the Edge base URL configuration,
**When** the client calls an endpoint,
**Then** success JSON is parsed into typed DTOs and errors map from `{ error.message }` for inline UI,
**And** query keys follow the factory pattern (`scenarios.all`, `scenario(slug)`, etc.).

**Given** secrets rules,
**When** building for production,
**Then** no service-role keys appear in the client bundle (only public/anon values as required).

### Story 2.4: Configure routing for home and scenario by slug with scenario loading UX

As a user,
I want shared links to open the scenario directly,
So that contributors land in the game with zero ceremony (FR20, UX-DR14).

**Acceptance Criteria:**

**Given** React Router setup per architecture,
**When** I navigate to `/` or `/s/:slug` (or agreed paths documented in `paths.ts`),
**Then** routes render without full page reloads (SPA model),
**And** unknown routes are handled without a blank screen.

**Given** UX-DR13,
**When** scenario data is loading,
**Then** the scenario view shows skeleton placeholders (not a blocking splash) aligned to the ≤2s expectation,
**And** failed loads expose an inline retry affordance (not toast spam).

### Story 2.5: Create scenario from the homepage after Generate and surface the share URL

As an instigator,
I want to name my scenario and get a link I can drop in chat,
So that friends can join immediately (FR9, FR19, FR2, FR27 flow).

**Acceptance Criteria:**

**Given** I have a generated/locked tape from Epic 1,
**When** I choose to add it to a scenario,
**Then** I can enter a scenario name and confirm,
**And** the app creates the scenario via Edge Function and navigates to the scenario route.

**Given** FR19,
**When** creation succeeds,
**Then** the shareable URL is visible inline near the scenario context (UX: no extra “generate link” step),
**And** the first tape is persisted to that scenario.

**Given** FR22,
**When** I perform these actions,
**Then** no authentication is requested.

### Story 2.6: Build scenario view with TapeStack, tape count, and pinned ADD

As a contributor,
I want to scroll tapes and always see how to add another,
So that the in-room flow stays obvious (FR10, FR13, FR28, UX-DR9, UX-DR10).

**Acceptance Criteria:**

**Given** a scenario with tapes,
**When** I view `/s/:slug`,
**Then** tapes render newest-at-top in a vertical scroll region,
**And** the scenario shows a total tape count consistent with listed tapes (FR13).

**Given** UX-DR10,
**When** I scroll the stack,
**Then** the “+ ADD TAPE” control remains pinned/visible at the bottom of the scenario view,
**And** the control meets minimum touch target size and remains keyboard-focusable.

**Given** an empty scenario,
**When** I view it,
**Then** empty-state UX matches UX-DR15 (scenario name, space, ADD pinned).

### Story 2.7: Implement add-tape flow from scenario with optimistic UI and failure handling

As a contributor,
I want my tape to appear immediately while saving,
So that the group moment is not killed by latency — but I must not lose work if save fails (FR11, FR12, FR21, FR25, NFR9, NFR10, UX-DR12).

**Acceptance Criteria:**

**Given** I open the tape creator from the scenario (overlay/state, not a separate route per UX-DR14),
**When** I generate a tape and confirm add,
**Then** the tape appears at the top of the stack optimistically or immediately on success per chosen pattern,
**And** TanStack Query invalidation/update rules keep the stack consistent.

**Given** a slow save (>1s),
**When** the mutation is in flight,
**Then** muted “Saving…” appears (UX-DR12),
**And** on failure I see inline “Couldn’t save. Try again.” with the creator staying open and draft preserved.

**Given** NFR10,
**When** the network drops mid-save,
**Then** the client retries safely without duplicate tapes (idempotent or deduped behavior).

### Story 2.8: Wire CORS, environment variables, and deployment-facing configuration

As a developer,
I want Edge Functions callable from Vercel and localhost,
So that contributors and creators can use real devices during development and production.

**Acceptance Criteria:**

**Given** architecture CORS requirements,
**When** the browser calls Edge Functions from the deployed origin and from local dev,
**Then** requests succeed with allowed origins configured (no wildcard secrets),
**And** `.env.example` documents `VITE_*` public variables only.

**Given** monitoring posture,
**When** issues occur,
**Then** logs are accessible via Supabase/Vercel dashboards at least at a basic level (no paid APM required).

### Story 2.9: Implement Edge Functions for update-tape and delete-tape

As a contributor,
I want the server to apply tape edits and removals safely,
So that anyone with the scenario link can change content without breaking anonymous sharing rules (FR29, FR30, FR31, NFR12).

**Acceptance Criteria:**

**Given** architecture patterns from add-tape,
**When** update-tape and delete-tape Edge Functions are invoked with valid scenario context (e.g. slug + tape id),
**Then** payloads are validated (Zod or equivalent), text/color limits match add-tape, and SQL uses snake_case with camelCase HTTP boundary,
**And** errors return `{ "error": { "code", "message" } }` with correct HTTP status.

**Given** FR31,
**When** a client holds a valid scenario slug,
**Then** edit and delete succeed without authentication — same trust model as add-tape.

**Given** delete-tape,
**When** the server applies removal,
**Then** the tape row is gone for subsequent get-scenario-by-slug responses and list queries stay consistent.

**Given** NFR14,
**When** an update or delete fails at the server,
**Then** the response allows the client to reconcile UI without silent partial state (documented error codes for inline retry).

### Story 2.10: Edit and delete tapes in scenario view with DeleteConfirmSheet

As a contributor,
I want to fix typos or remove a tape from the stack,
So that the group can curate jokes in the moment (FR29–FR32, UX-DR19, UX-DR20).

**Acceptance Criteria:**

**Given** I am viewing a scenario with at least one tape,
**When** I choose edit on a tape row,
**Then** the tape creator opens in overlay/state with text and color pre-filled (same shell as add per UX),
**And** on save, the stack shows the updated tape immediately (optimistic or confirmed) and TanStack Query cache stays consistent (FR29).

**Given** I choose delete on a tape row,
**When** the delete affordance is activated,
**Then** **DeleteConfirmSheet** (or modal) opens with short industrial copy and Cancel + Delete actions — **no API call until Confirm** (FR32, UX-DR20).

**Given** I confirm delete,
**When** the mutation succeeds,
**Then** the tape disappears from the stack for me and anyone else with the link (FR30),
**And** on failure I see an inline error and the tape remains or UI reverts to server state (NFR14).

**Given** FR31,
**When** any participant with the link edits or deletes,
**Then** the same rules apply — no ownership UI in MVP.

**Given** accessibility (baseline; Epic 4 hardens),
**When** the confirmation sheet opens,
**Then** focus moves into the dialog/sheet and Cancel restores a sensible focus target (UX-DR20).

---

## Epic 3: Scenario library and adaptive home

Returning users see a scenario library with provocative cards (name + tape count), can open any scenario, start a new scenario from home, and move between library and scenario with clear back navigation. Adaptive homepage: tape-first when there are no scenarios; library when scenarios exist.

**FRs covered:** FR14, FR15, FR16, FR17, FR18, FR27 (adaptive home).

**Relevant UX-DRs:** UX-DR7, UX-DR8, UX-DR14, UX-DR18; remaining pieces of UX-DR6 navigation.

### Story 3.1: Implement list-scenarios Edge Function and scenarios list query

As a returning player,
I want my scenarios to load for the library,
So that I can pick up where I left off (FR15).

**Acceptance Criteria:**

**Given** architecture list endpoint sketch,
**When** the client requests the scenario list,
**Then** the response returns scenarios with name, tape count, and any fields needed for cards,
**And** errors use the standard error object shape.

**Given** TanStack Query,
**When** list data changes after creates,
**Then** cache invalidation updates the library view.

### Story 3.2: Build ScenarioLibrary with ScenarioCard grid and provocative copy

As a returning player,
I want the library to feel like a game board, not a file manager,
So that tape counts pull me back in (FR16, UX-DR7, UX-DR8).

**Acceptance Criteria:**

**Given** UX grid rules,
**When** I view the library on mobile,
**Then** cards are single column; at `sm+` the grid becomes two columns,
**And** each card shows scenario name (Bebas Neue) and a provocative tape-count line (DM Mono) per UX-DR7.

**Given** FR17,
**When** I activate a card,
**Then** I navigate to that scenario’s route.

**Given** accessibility,
**When** I tab through cards,
**Then** each card behaves as a single focusable link/button with visible focus styling (baseline; Epic 4 hardens).

### Story 3.3: Implement adaptive homepage — creator vs library

As a user,
I want the home route to match whether I’m new or returning,
So that first-timers get the pure CAUTION moment and returners get speed (FR27, UX-DR18, FR18).

**Acceptance Criteria:**

**Given** no scenarios exist for the device/session model used (per implementation approach),
**When** I open `/`,
**Then** I see the tape creator as the primary experience,
**And** when scenarios exist, I see the ScenarioLibrary as home instead.

**Given** FR18,
**When** I am on the library home,
**Then** I can start a new scenario flow without hunting (clear “New Scenario” action),
**And** the flow reuses the tape creator + naming pattern established in Epic 2.

### Story 3.4: Add back navigation and consistent Library entry from scenario view

As a user,
I want to move between library and scenario without getting lost,
So that navigation stays shallow and predictable (FR14, UX-DR14).

**Acceptance Criteria:**

**Given** UX ghost back pattern,
**When** I am in a scenario opened from the library or a deep link,
**Then** I can return to the library via “← All Scenarios” (or agreed copy),
**And** header Library link always routes to the library view once Epic 3 exists.

**Given** depth rules,
**When** I navigate,
**Then** I never need more than two levels (library ↔ scenario) for browsing; tape creator remains an overlay/state.

---

## Epic 4: Polished, resilient, inclusive experience

Cross-cutting quality: responsive behavior across all surfaces (FR26), performance and reliability expectations from the PRD, graceful handling of slow/failed saves (including **edit/delete** failures per NFR14), and WCAG 2.1 AA–oriented accessibility (focus, keyboard, semantics, contrast, tape content exposed to assistive technology, **delete confirmation focus**). Closes remaining UX-DR gaps not fully satisfied in Epics 1–3.

**FRs covered:** FR26 (primary); NFR1–NFR14; UX-DR11–UX-DR20 as consolidated pass where not already fully satisfied.

### Story 4.1: Responsive layout verification across all primary routes

As a user,
I want every screen to work on a phone passed around a table,
So that the experience is consistently usable (FR26, UX-DR16).

**Acceptance Criteria:**

**Given** mobile-first layouts,
**When** I exercise home, library, and scenario routes at mobile and desktop widths,
**Then** no view breaks clipping/overflow in a way that hides primary actions,
**And** max-width/centering rules remain consistent with UX (`480`/`640` behavior).

**Given** UX-DR16,
**When** I use touch,
**Then** no interaction requires hover-only behavior.

### Story 4.2: Performance pass for load and interaction budgets

As a user,
I want the app to feel instant in social settings,
So that nobody fumbles in front of friends (NFR1–NFR3, FR26).

**Acceptance Criteria:**

**Given** PRD targets,
**When** measuring on a representative mobile connection (document test method),
**Then** initial interactive home is within the ~2s expectation and shared scenario load aligns with the ~2s tape display expectation,
**And** tape preview keeps keystroke-to-render latency below perceptible lag thresholds (profiling notes captured if debounce is introduced).

**Given** TapeRenderer,
**When** under load,
**Then** memoization or other optimizations prevent unnecessary full re-renders without harming live typing responsiveness.

### Story 4.3: Reliability hardening for flaky networks and mutation failures

As a user,
I want saves to feel trustworthy,
So that jokes don’t disappear (NFR8–NFR10, NFR14, UX-DR12).

**Acceptance Criteria:**

**Given** poor connectivity scenarios,
**When** mutations fail or time out,
**Then** inline errors appear and drafts are preserved across create/add flows,
**And** retries do not create duplicate tapes (verified by test or manual protocol).

**Given** edit or delete mutations,
**When** the server rejects or the network fails,
**Then** the UI reverts to server state or shows inline error — **no inconsistent tape row** versus persisted data (NFR14).

### Story 4.4: Accessibility audit and fixes to WCAG 2.1 AA baseline

As a user with assistive tech or keyboard-only input,
I want core flows to work,
So that friends aren’t excluded (UX-DR17, UX-DR3).

**Acceptance Criteria:**

**Given** representative flows (create tape, create scenario, view scenario, add tape, **edit tape**, **delete tape with confirmation**, browse library),
**When** tested with keyboard only,
**Then** focus order is logical and no traps occur,
**And** focus rings meet the 2px yellow outline spec.

**Given** axe/Lighthouse runs,
**When** executed on primary screens,
**Then** critical violations are addressed or documented with rationale,
**And** contrast issues for body text lead to token adjustments (e.g. `#999` bump) if audits fail.

**Given** opening the tape creator from a scenario,
**When** it opens,
**Then** focus moves to the input field per UX-DR17.

### Story 4.5: Security and abuse posture review for anonymous sharing

As a product owner,
I want proportionate protections on shared links,
So that a small tool doesn’t become trivially abusable (NFR5–NFR7, NFR12–NFR13, architecture).

**Acceptance Criteria:**

**Given** anonymous model,
**When** reviewing implementation,
**Then** no PII is collected/stored beyond operational logs,
**And** scenario slugs remain non-enumerable in practice (spot-check randomness approach).

**Given** NFR12,
**When** reviewing edit/delete behavior,
**Then** link possession grants full tape modification — documented as intentional for MVP, with NFR13 noted for any future ownership/auth work.

**Given** Edge limits,
**When** exercising rate limits and max length,
**Then** behavior matches documented limits and returns stable error codes/messages for the UI.

---

## Epic 5: Library redesign — two-tab public and private

The library becomes the social surface of the app. A public tab lets any visitor (logged out or in) browse all public scenarios. A private tab shows the authenticated user's personal collection in three progressive buckets: scenarios they created, scenarios they were invited to, and public scenarios they've chosen to follow. Empty buckets do not render — the UI grows with the user.

**FRs covered:** FR15, FR16, FR17, FR18 (library surface and navigation); FR14 (back navigation from scenario to library).

**Depends on:** Epics 1 (identity) + 2 (public/private model).

**Brainstorm source:** Decisions #9 (Two-Tab Library), #11 (Three Buckets, Progressive Disclosure), #8 (One Homepage for Everyone — top 3 public scenarios on home).

### Story 5.1: Two-tab library shell and routing

As a user,
I want the Library to have a Public tab and a Private tab,
So that I can browse community scenarios or focus on my own collection (brainstorm #9).

**Acceptance Criteria:**

**Given** any user (logged in or out),
**When** I navigate to the Library,
**Then** I see two tabs: **Public** and **Private**,
**And** the Public tab is the default and active on load.

**Given** a logged-out user,
**When** I click the Private tab,
**Then** I see a friendly prompt to log in or create an account — no error state.

**Given** a logged-in user,
**When** I click the Private tab,
**Then** I see my personal collection (stories 5.3–5.5).

### Story 5.2: Public scenarios feed

As a visitor,
I want to browse all public scenarios in the Public tab,
So that I can discover what others have made without needing an account (FR15, FR16).

**Acceptance Criteria:**

**Given** the Public tab,
**When** public scenarios exist,
**Then** they display as scenario cards (name + tape count provocative line) in the same grid style as the existing library (1 col mobile → 2 col at `sm+`),
**And** each card links to the scenario route (`/s/:slug`).

**Given** a logged-out visitor,
**When** I view the public feed,
**Then** I can browse and open scenarios but any action requiring login (add tape, follow) triggers the login gate.

**Given** no public scenarios yet,
**When** the feed loads,
**Then** an appropriate empty state is shown (on-brand copy).

### Story 5.3: Private tab — My Scenarios bucket

As a logged-in creator,
I want to see the scenarios I created in my Private tab,
So that I can quickly return to my own boards (brainstorm #11).

**Acceptance Criteria:**

**Given** the Private tab,
**When** I have created at least one scenario,
**Then** a **My Scenarios** bucket renders with cards for each scenario I own (public or private).

**Given** I have created no scenarios,
**When** I view the Private tab,
**Then** the My Scenarios bucket does not render (progressive disclosure — empty buckets are hidden).

**Given** a My Scenarios card,
**When** I activate it,
**Then** I navigate to that scenario's route.

### Story 5.4: Private tab — Invited bucket

As a logged-in user,
I want to see private scenarios I was invited to (via link) in my Private tab,
So that I can return to collaborative boards I've joined (brainstorm #11).

**Acceptance Criteria:**

**Given** the Private tab,
**When** I have accessed at least one private scenario via its link,
**Then** an **Invited** bucket renders with cards for those scenarios.

**Given** I have not accessed any private scenarios via link,
**When** I view the Private tab,
**Then** the Invited bucket does not render.

### Story 5.5: Private tab — Following bucket

As a logged-in user,
I want to see public scenarios I've chosen to follow in my Private tab,
So that I can return to community scenarios I care about (brainstorm #6, #11).

**Acceptance Criteria:**

**Given** the Private tab,
**When** I am following at least one public scenario,
**Then** a **Following** bucket renders with cards for those scenarios.

**Given** I am following no scenarios,
**When** I view the Private tab,
**Then** the Following bucket does not render.

**Given** a Following card,
**When** I activate it,
**Then** I navigate to that scenario's route.

---

## Epic 6: Tape creation improvements

Enhancements and bug fixes to the tape creation experience. Mobile color picker inconsistency fixed, unified preset swatches across devices, support for long tape text, and a save-to-camera-roll export. **All stories in this epic are done** — documented here for completeness.

**FRs covered:** FR1 (live preview), FR3 (color selection), FR5 (length scaling), FR8 (color rendering).

**Fully standalone** — no dependencies on other epics; shipped in parallel with Epics 1–3.

**Brainstorm source:** Decisions #12 (Mobile Color Bug Fix), #13–14 (Unified Presets), #15 (Long Tape), #16 (Save to Camera Roll).

### Story 6.1: Mobile color picker bug fix

As a mobile user,
I want the color picker to open initialized to the current tape color,
So that it behaves consistently with desktop (brainstorm #12, bug fix).

_Status: done._

### Story 6.2: Unified color preset swatches

As a user,
I want the same preset color swatches on both mobile and desktop,
So that the experience is consistent across devices (brainstorm #13–14).

_Status: done._

### Story 6.3: Long tape text support

As a user,
I want to type a long warning and have the tape grow to accommodate it,
So that unhinged manifestos are fully readable (brainstorm #15).

_Status: done._

### Story 6.4: Save tape to camera roll

As a user,
I want a single button that exports my tape as an image to my camera roll,
So that I can share or keep it instantly (brainstorm #16).

_Status: done._

---

## Epic 7: Notifications and following

Users can passively track activity on scenarios they care about via a quiet in-app badge system. Following a public scenario adds it to the Following bucket in the private library tab and enables the same badge. No push notifications, no email — respectful of attention, anti-spam by default.

**Depends on:** Epics 1 (identity) + 5 (library — Following bucket must exist).

**Brainstorm source:** Decisions #5 (Quiet Badge), #6 (Follow = Bookmark + Badge), #10 (Opportunistic Follow Prompt).

### Story 7.1: Activity tracking and badge data model

As a developer,
I want a data model that tracks new activity on scenarios a user cares about,
So that the quiet badge has something to read (brainstorm #5).

**Acceptance Criteria:**

**Given** a scenario the user created, was invited to, or is following,
**When** a new tape is added since the user's last visit,
**Then** the backend records unread activity against that user + scenario pair,
**And** the data model supports efficient badge queries without full scenario loads.

### Story 7.2: Quiet badge on scenario cards

As a logged-in user,
I want a subtle badge on scenario cards that have new activity since my last visit,
So that I know where the action is without being notified (brainstorm #5).

**Acceptance Criteria:**

**Given** a scenario card in any library bucket (My Scenarios, Invited, Following),
**When** there is new activity since my last visit,
**Then** a quiet badge indicator appears on the card,
**And** the badge clears when I open the scenario.

**Given** no new activity,
**When** I view a scenario card,
**Then** no badge is shown — default state is always clean.

### Story 7.3: Follow and unfollow a public scenario

As a logged-in user,
I want to follow a public scenario I care about,
So that it appears in my Following bucket with badge coverage (brainstorm #6).

**Acceptance Criteria:**

**Given** a public scenario view,
**When** I am logged in and not the creator,
**Then** a Follow button is visible.

**Given** I click Follow,
**When** the action succeeds,
**Then** the scenario appears in my Following bucket in the private library tab,
**And** the button changes to Unfollow.

**Given** I click Unfollow,
**When** the action succeeds,
**Then** the scenario is removed from my Following bucket,
**And** any unread badge for that scenario is cleared.

### Story 7.4: Opportunistic follow prompt

As a logged-in user who just added a tape to a public scenario,
I want a single, non-forced prompt asking if I'd like to follow it,
So that I can opt in at peak engagement without ever being nagged (brainstorm #10).

**Acceptance Criteria:**

**Given** I have just successfully added a tape to a public scenario I don't already follow,
**When** the add succeeds,
**Then** a single prompt appears: "Want to follow this scenario?" with Follow / No thanks options.

**Given** I dismiss or decline the prompt,
**When** I add another tape to the same scenario,
**Then** the prompt does not appear again — never repeated.
