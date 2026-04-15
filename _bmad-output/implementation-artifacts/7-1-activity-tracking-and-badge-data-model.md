# Story 7.1: Activity tracking and badge data model

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created -->

## Story

As a developer,
I want a data model that tracks new activity on scenarios a user cares about,
so that the quiet badge has something to read (brainstorm #5).

## Acceptance Criteria

1. **Given** a scenario the user **created**, **was invited to**, or **is following**,  
   **When** a **new tape is added** (by someone other than that user, including anonymous contributors where `author_id` is null),  
   **Then** the backend **records unread activity** for that **user + scenario** pair in persistent storage (survives refresh; not `localStorage`).

2. **Given** the recording pipeline,  
   **When** a user should **not** receive credit for “someone else’s new tape” (the user **authored** the new tape),  
   **Then** that user is **excluded** from unread updates for that tape insert.

3. **Given** `add-tape` **idempotent replay** (same `idempotencyKey` returns existing tape),  
   **When** the handler short-circuits without a new insert,  
   **Then** **no** unread activity is recorded or updated (avoid duplicate/spurious badges).

4. **Given** efficient library rendering in Epic 7.2,  
   **When** the client needs badge state,  
   **Then** it can obtain **which scenario IDs have unread activity** for the current user via a **slim API** (IDs and/or booleans only — **no** full scenario payloads and **no** tape bodies in that response).

5. **Given** a logged-in user who **opens** a scenario (visit / read),  
   **When** the client reports that visit,  
   **Then** unread state for that **user + scenario** is **cleared** so future badge queries return “clean” until the next qualifying tape insert.

6. **Given** regression safety,  
   **When** implementation is complete,  
   **Then** existing `add-tape` behavior (auth rules, validation, idempotency, response shape) remains unchanged from the caller’s perspective aside from the new side effects described above.

## Tasks / Subtasks

- [x] **Task 1: Migration — unread state table** (AC: 1, 4, 6)
  - [x] Add `supabase/migrations/<timestamp>_scenario_user_unread.sql` with a timestamp **after** the latest migration in `supabase/migrations/`.
  - [x] Create table (name suggestion: `scenario_user_unread`; adjust only if you add a migration comment explaining the rename and update this story + Epic 7 notes):
    - `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
    - `scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE`
    - `has_unread boolean NOT NULL DEFAULT false`
    - `updated_at timestamptz NOT NULL DEFAULT now()` (optional but useful for debugging)
    - `PRIMARY KEY (user_id, scenario_id)`
  - [x] Partial index for badge reads, e.g. `CREATE INDEX ... ON scenario_user_unread (user_id) WHERE has_unread = true`
  - [x] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (same posture as `scenario_follows` / `scenario_invites`: Edge Functions use service role; table not directly exposed to anon clients)

- [x] **Task 2: Shared server helper — fan-out from `add-tape`** (AC: 1–3, 6)
  - [x] Add `supabase/functions/_shared/activityUnread.ts` (or similar) with a single exported function, e.g. `markUnreadForNewTape(args)`, called **only** after a **successful new** tape insert (not on idempotent early return).
  - [x] Inputs at minimum: `scenarioId`, `tapeAuthorId: string | null`, `tapeCreatedAt` (ISO string from DB).
  - [x] Resolve **recipients**:
    - **Owner:** `scenarios.owner_id` where `owner_id IS NOT NULL` and `owner_id !== tapeAuthorId`
    - **Invitees:** `scenario_invites.user_id` for `scenario_id`, excluding `tapeAuthorId` (handle null author — invitees still get unread when author is anonymous)
    - **Followers:** `scenario_follows.user_id` for `scenario_id`, excluding `tapeAuthorId`
  - [x] **Deduplicate** user IDs (owner may also appear in invites in edge cases — one upsert per user).
  - [x] **Subscription cutoff (anti-retroactive unread):**
    - For **invitees**, only mark unread if the invite row’s `created_at <= tapeCreatedAt` (user joined before or when tape landed — tune to `<=` vs `<` consistently with product; document the chosen operator in a one-line comment).
    - For **followers**, only mark unread if `scenario_follows.created_at <= tapeCreatedAt`.
  - [x] Upsert rows: `has_unread = true`, bump `updated_at`. Use one batched upsert where practical.
  - [x] Wire the helper from `supabase/functions/add-tape/index.ts` **after** successful insert; **do not** call on idempotent success path.

- [x] **Task 3: Edge Function — list unread scenario IDs** (AC: 4, 6)
  - [x] Add `supabase/functions/list-unread-scenarios/index.ts` (name may vary; keep kebab-case directory).
  - [x] `OPTIONS` first → `corsHeaders`; **`GET` only**; `extractUserId` → `401` if missing.
  - [x] Service client; query `scenario_user_unread` for `user_id` and `has_unread = true`, returning **scenario UUIDs only**, e.g. `jsonOk({ scenarioIds: string[] })`.
  - [x] Register `[functions.list-unread-scenarios]` with `verify_jwt = false` in `supabase/config.toml` (match existing functions).

- [x] **Task 4: Edge Function — clear unread on visit** (AC: 5, 6)
  - [x] Add `supabase/functions/mark-scenario-read/index.ts` (or `record-scenario-visit`).
  - [x] `POST` only; Zod body `{ scenarioSlug: string }` or `{ scenarioId: uuid }` — **pick one** and align with how ScenarioPage already resolves the scenario (slug is usually simplest for the client).
  - [x] Authenticate with `extractUserId`; load scenario by slug/id; enforce **read access** using the **same rules** as `get-scenario-by-slug` / scenario view (owner, public, invitee link model). If user cannot access scenario → `403` / `404` as appropriate (mirror existing function semantics).
  - [x] `UPSERT` or `UPDATE` `scenario_user_unread` set `has_unread = false` for `(user_id, scenario_id)` (insert row with false if you want a stable “visited” row — optional; clearing only is fine if row may not exist).

- [x] **Task 5: Verification** (AC: 1–6)
  - [x] **Manual:** `add-tape` as user A on a scenario; user B (owner / invitee / follower per case) sees `scenarioId` in `list-unread-scenarios`; `mark-scenario-read` as B clears it; idempotent `add-tape` does not re-spam.
  - [x] **Regression:** `npm test` in `web/` still passes (no frontend change required in this story unless you add client stubs early — prefer backend-only here).

## Dev Notes

### Epic cross-story context (do not implement future stories here)

| Story | Scope reminder |
|--------|----------------|
| **7.2** | Quiet badge UI on library cards; calls `list-unread-scenarios` + clears via visit endpoint when opening scenario |
| **7.3** | Follow/unfollow mutations; on unfollow, **clear or delete** unread row for that scenario (per epic: badge cleared) |
| **7.4** | Opportunistic follow prompt after add — no extra unread logic beyond existing fan-out |

### Product semantics (quiet badge)

- **No push / no email** — in-app state only; aligns with [Source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Quiet Badge #5, Follow = Bookmark + Badge #6].
- **Anti-spam:** exclude the **tape author** from unread for their own insert; idempotent adds must not duplicate unread bumps.

### Preconditions already in the codebase

- **`scenario_follows`:** migration `20260415000000_create_scenario_follows.sql`; list function `list-followed-scenarios`. [Source: `_bmad-output/implementation-artifacts/5-5-private-tab-following-bucket.md`]
- **`scenario_invites`:** `20260414000000_create_scenario_invites.sql`
- **`add-tape`:** `supabase/functions/add-tape/index.ts` — insert + idempotency path clearly separated; hook unread fan-out **after** insert only.

### Architecture / security guardrails

- Edge Functions: `OPTIONS` first; Zod on `POST` bodies; `jsonError` / `jsonOk`; **mutations use `POST` only** per project rules.
- Service role in functions; **never** expose service key to client.
- **RLS enabled** on new table; no requirement in this story for anon RLS policies if all access is via Edge Functions.

### API / client (Epic 7.2)

- This story may leave **`web/`** unchanged; if you add `listUnreadScenarios` / `markScenarioRead` to `web/src/api/client.ts`, use **`supabaseFetch` for `POST`** and the same **manual GET + Authorization + apikey** pattern as other list endpoints if you follow `listFollowedScenarios` — see [Source: `web/src/api/client.ts`, `_bmad-output/project-context.md`].
- Query keys: Epic 7.2 will likely add something like `scenarioKeys.unread(userId)` — **include `userId`** in the key to avoid cross-account cache bleed.

### Testing standards

- No new Vitest requirement for **pure Deno** helpers unless the repo already has edge function tests; prefer **manual curl** / Supabase logs + existing `web` test suite for regression.

### Project structure notes

- New SQL migration under `supabase/migrations/`.
- New Edge Function dirs: **kebab-case**.
- Optional shared logic: `supabase/functions/_shared/`.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 7, Story 7.1]
- [Source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — #5, #6, #10]
- [Source: `_bmad-output/implementation-artifacts/5-5-private-tab-following-bucket.md` — `scenario_follows`, scope boundary with 7.3]
- [Source: `supabase/functions/add-tape/index.ts`]
- [Source: `_bmad-output/project-context.md` — Edge Function patterns, security]

## Previous story intelligence

- **5-5** established `scenario_follows`, two-phase list patterns, RLS + service role, and cache-key conventions (`scenarioKeys.*` includes `userId`). Unread queries should follow the same **per-user cache** discipline in Epic 7.2.
- **Idempotency:** mirror `add-tape` — side effects only on genuine new inserts.

## Git intelligence summary

Recent history is bundled phase/epic commits (`feat(phase2): ...`, `feat(epic-*): ...`). For file-level patterns, treat **`add-tape`**, **`list-invited-scenarios` / `list-followed-scenarios`**, and **`_shared/*`** as the templates for new Edge Functions and shared helpers.

## Latest technical information

- Stack versions and constraints are summarized in [Source: `_bmad-output/project-context.md` — Technology Stack]. No new npm dependencies are required for this story if kept backend-only.

## Project context reference

- Read `_bmad-output/project-context.md` before implementation — especially Edge Function rules, `extractUserId` behavior, and “no floating promises” on the client when Epic 7.2 wires calls.

## Story completion status

- **Status:** `done`
- **Note:** Shipped after review; deploy migration + functions for production; manual smoke on live Supabase recommended.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

_(none)_

### Completion Notes List

- Added `scenario_user_unread` migration with partial index `(user_id) WHERE has_unread = true` and RLS enabled (service-role access only).
- Implemented `markUnreadForNewTape` in `_shared/activityUnread.ts`: owner + invitees + followers, deduped, author excluded, `created_at <= tapeCreatedAt` for invites/follows, batched upsert; wired only on non-idempotent `add-tape` insert path.
- `list-unread-scenarios`: GET, JWT via `extractUserId`, returns `{ scenarioIds }` only.
- `mark-scenario-read`: POST `{ scenarioSlug }`, Zod-validated; visibility aligned with `get-scenario-by-slug` (404 if slug missing; slug suffices to clear unread); upsert `has_unread = false`.
- Regression: `npm test` in `web/` — 99 tests passed.
- **Manual smoke** (add-tape / list-unread / idempotency / mark-read against a live project): run after migration + function deploy.

### File List

- `supabase/migrations/20260416000000_scenario_user_unread.sql`
- `supabase/functions/_shared/activityUnread.ts`
- `supabase/functions/add-tape/index.ts`
- `supabase/functions/list-unread-scenarios/index.ts`
- `supabase/functions/mark-scenario-read/index.ts`
- `supabase/config.toml`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/7-1-activity-tracking-and-badge-data-model.md`

### Change Log

- 2026-04-15 — Story 7.1: unread data model, add-tape fan-out, list-unread + mark-read Edge Functions; sprint/story status → review.
- 2026-04-15 — Story 7.1: marked **done** after human review; Epic 7.2 (quiet badge UI) started.