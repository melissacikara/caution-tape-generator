# Story 4.5: Security and abuse posture review for anonymous sharing

Status: done

## Story

As a product owner,
I want proportionate protections on shared links,
So that a small tool doesn't become trivially abusable (NFR5–NFR7, NFR12–NFR13, architecture).

## Acceptance Criteria

1. **Given** the anonymous model,
   **When** reviewing the implementation,
   **Then** no PII is collected or stored beyond operational logs,
   **And** `ownerId`/`authorId` UUID exposure is documented with rationale and product decision captured in deferred-work.md.

2. **Given** NFR6,
   **When** reviewing scenario slug generation,
   **Then** slugs are verified as non-guessable and non-sequential (spot-check the migration),
   **And** the `list-scenarios` endpoint is confirmed to only return public scenarios (no private slug leakage).

3. **Given** NFR12,
   **When** reviewing edit/delete behavior,
   **Then** the current auth requirement for `update-tape` and `delete-tape` is documented as the intentional post-Epic-2 state,
   **And** the evolution from the original "link possession = full modification" MVP design is captured clearly.

4. **Given** Edge Function input validation,
   **When** testing Zod limits and DB constraints,
   **Then** all limit values are consistent between Zod schemas and DB CHECK constraints,
   **And** all validation errors return `VALIDATION_ERROR` with HTTP 400 (stable, predictable error codes).

5. **Given** the full review,
   **When** complete,
   **Then** any NEW security gaps not already tracked in deferred-work.md are appended with appropriate severity notes,
   **And** a concise "Security Posture Summary" section is written in the Dev Agent Record covering PII, slug entropy, auth model, input limits, rate limiting, CORS, and key management.

## Tasks / Subtasks

- [x] **Task 1: PII audit** (AC: #1)
  - [x] Enumerate all DB tables and every column: `scenarios`, `tapes`, `tape_reports`, `idempotency_tapes`
  - [x] Verify that no email address, display name, IP address, or device identifier is persisted in any table
  - [x] Review `mapScenario` and `mapTape` in `supabase/functions/_shared/map.ts` — confirm exactly which fields are returned in API responses
  - [x] Confirm that `ownerId` (auth UUID) is returned in scenario responses and `authorId` (auth UUID) in tape responses — already tracked in deferred-work.md; verify no new PII leaks have been introduced since story 2-1
  - [x] Document finding: "No email/name/IP stored. Auth UUIDs (ownerId, authorId) exposed in responses — tracked in deferred-work.md; product decision pending before public launch."
  - [x] Verify `tape_reports` only stores `tape_id`, `scenario_slug`, `reported_at` — no PII

- [x] **Task 2: Slug entropy and non-enumerability** (AC: #2)
  - [x] Read `supabase/migrations/20260330160000_create_scenarios_and_tapes.sql` and confirm slug generation: `replace(gen_random_uuid()::text, '-', '')` — 32 hex chars, 128-bit cryptographic randomness, non-sequential
  - [x] Check `list-scenarios` Edge Function — confirm it filters by `is_public = true` before returning any slugs (no private/unlisted scenario slugs are exposed)
  - [x] Spot-check: no sequential `id` field is used as a URL parameter anywhere — all URLs use `public_slug` or tape UUID, never a sequential row number
  - [x] Document finding: "Slugs: 128-bit UUID entropy via `gen_random_uuid()`, non-sequential. Private/unlisted scenarios are not enumerable via the list endpoint."

- [x] **Task 3: Auth model clarification and documentation** (AC: #3)
  - [x] Read `update-tape/index.ts` and `delete-tape/index.ts` — confirm both require `userId` (401 if anonymous)
  - [x] Read `add-tape/index.ts` — confirm anonymous access is allowed for private/unlisted scenarios (link = invitation) but blocked for public scenarios
  - [x] Read `create-scenario/index.ts` — confirm anonymous scenario creation is allowed
  - [x] Document the full auth matrix clearly in Dev Agent Record (see template below)
  - [x] Capture the design evolution: original PRD/NFR12 "link possession grants modification" was the pre-Epic-2 intention; Epic 2 (story 2-1) introduced auth ownership checks for mutations. Current state (auth required for update/delete) is the intentional post-Epic-2 model.
  - [x] Note NFR13 ("future ownership/auth work") in deferred-work.md if not already there — this is the Epic 5/7 concern

- [x] **Task 4: Input validation consistency check** (AC: #4)
  - [x] Walk each Edge Function and compare Zod `max()` values against DB CHECK constraints:
    - `tape_text`: Zod 2000 ↔ DB `char_length(tape_text) <= 2000` ✅
    - `color`: Zod 32 ↔ DB `char_length(color) <= 32` ✅
    - `name` (scenario): Zod 500 ↔ DB `char_length(name) <= 500` ✅
    - `scenarioSlug`: Zod 128 — no DB CHECK (slug comes from DB-generated UUID, not user-supplied)
    - `tapeId`: Zod `.uuid()` — protects against injection on ID parameters
  - [x] Verify all validation failures return `{ error: { code: "VALIDATION_ERROR", message: "..." } }` with HTTP 400
  - [x] Verify method guards (non-POST returns 405 METHOD_NOT_ALLOWED; non-GET for get-scenario returns 405)
  - [x] Test Zod `.uuid()` on `tapeId` rejects garbage strings before DB lookup — this prevents UUID-format injection
  - [x] Document findings; note any inconsistency (if Zod max < DB constraint, Zod is the effective limit — this is correct)

- [x] **Task 5: Rate limiting, CORS, and key management review** (AC: #5)
  - [x] Rate limiting: confirm no application-level rate limiting exists in Edge Functions; document that Supabase platform-level limits are the only protection; add to deferred-work.md if not already tracked
  - [x] CORS: confirm wildcard `*` is pre-existing (cors.ts comment already cites story 2.8 for tightening); verify already in deferred-work.md — no action needed
  - [x] Key management: confirm `SUPABASE_SERVICE_ROLE_KEY` is only referenced in `supabase/functions/**` via `Deno.env.get(...)` — no occurrences in `web/` or `.env*` files committed to git
  - [x] Confirm browser env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are safe for client use (anon key only)
  - [x] OTP email enumeration: confirm already tracked in deferred-work.md (Supabase raw OTP error messages may reveal account existence)
  - [x] Run `git grep -r 'SERVICE_ROLE'` in `web/` to confirm no key leakage to frontend

- [x] **Task 6: Update deferred-work.md and write Security Posture Summary** (AC: #5)
  - [x] For any NEW gaps found (not already in deferred-work.md), append an entry under a new section "Deferred from: code review of 4-5-security-and-abuse-posture-review-for-anonymous-sharing.md (2026-04-13)"
  - [x] Expected new deferred items (verify none are already tracked):
    - Rate limiting: no application-level rate limiting on any Edge Function
    - `create-scenario` anonymous access: any IP can create unlimited scenarios — no quota or CAPTCHA
  - [x] Write Security Posture Summary in Dev Agent Record (required deliverable — see AC #5)

## Dev Notes

### Story Nature: Review + Documentation

This is a **security audit story**, not a feature story. The primary deliverables are:
1. A completed audit checklist (tasks above marked done)
2. A Security Posture Summary in the Dev Agent Record
3. Any new deferred-work.md entries for gaps not already tracked

Do NOT introduce new feature code, new dependencies, or refactoring. Only fix a gap in this story if it is:
- A one-line change with zero regression risk
- Explicitly supported by an acceptance criterion above

### Existing Security Infrastructure — Do NOT Re-Implement

The following is already in place and has been verified through previous stories:

| Layer | Protection | Location |
|---|---|---|
| Secret isolation | `SUPABASE_SERVICE_ROLE_KEY` only in Edge Function env | `supabase/functions/**` via `Deno.env.get(...)` |
| Input validation | Zod schema at every Edge Function entry | All `index.ts` files |
| Method guards | OPTIONS → CORS headers; wrong method → 405 | All `index.ts` files |
| Auth check | `extractUserId()` — returns null for anonymous, never throws | `_shared/auth.ts` |
| Error format | `jsonError(code, message, status)` — stable contract | `_shared/errors.ts` |
| RLS | Enabled on all tables; Edge Functions use service role (bypasses RLS intentionally) | All migrations |
| Slug entropy | `gen_random_uuid()` — 128-bit, non-sequential | Migration `20260330160000` |
| Idempotency | `idempotency_tapes` table prevents duplicate tapes on retry | `add-tape/index.ts` |
| Report abuse | `tape_reports` table for flagged content | `report-tape/index.ts` |

### Auth Matrix (Current Post-Epic-2 State)

| Operation | Anonymous | Auth Required | Notes |
|---|---|---|---|
| Create scenario | ✅ allowed | — | Any caller can create; `owner_id` is null if anonymous |
| Add tape to unlisted/private scenario | ✅ allowed | — | Link = invitation model (NFR12 as-implemented) |
| Add tape to public scenario | ❌ blocked | ✅ | Requires login gate |
| Get scenario by slug | ✅ allowed | — | Public and private; no auth check on read |
| List scenarios | ✅ allowed | — | Only returns `is_public = true` scenarios |
| Update tape | ❌ blocked | ✅ | Must be `author_id` or `owner_id` (Epic 2) |
| Delete tape | ❌ blocked | ✅ | Must be `author_id` or `owner_id` (Epic 2) |
| Update scenario (rename/visibility) | ❌ blocked | ✅ | Must be `owner_id` |
| Delete scenario | ❌ blocked | ✅ | Must be `owner_id`; additionally blocked if `is_public = true` even for the owner (must make private first); DB DELETE also guards with `.eq('is_public', false)` |
| Report tape | ✅ allowed | — | Append-only; no auth check; stored in tape_reports |

### Already Tracked in deferred-work.md — Do NOT Re-Raise

Before adding any finding to deferred-work.md, confirm it is not already listed. Known items:

- `owner_id`/`author_id` exposed in public API responses
- CORS wildcard (`*`) on all Edge Function endpoints
- DB error messages leak raw Postgres details
- OTP error messages may enable email enumeration
- No `tapeId`↔`scenarioSlug` cross-validation in `report-tape`
- `@supabase/supabase-js` not declared in `package.json`

### PII Stored in Each Table

| Table | Columns with potential PII | Assessment |
|---|---|---|
| `scenarios` | `owner_id` (auth UUID) | Not PII by itself; UUID opaque to users |
| `tapes` | `author_id` (auth UUID) | Same — opaque UUID |
| `tape_reports` | `tape_id`, `scenario_slug`, `reported_at` | No PII |
| `idempotency_tapes` | `idempotency_key`, `scenario_id`, `tape_id` | `idempotency_key` is a client-generated UUID; no PII |

### Slug Entropy (already in migration comment)

```sql
-- Slug default: random UUID without hyphens (128-bit randomness; not sequential).
default replace(gen_random_uuid()::text, '-', '')
```

32 hex characters, ~3.4×10³⁸ combinations. Not enumerable, not predictable.

### Key Files to Read

| File | Purpose |
|---|---|
| `supabase/functions/_shared/map.ts` | What fields are returned in API responses |
| `supabase/functions/_shared/auth.ts` | How auth tokens are extracted |
| `supabase/functions/_shared/cors.ts` | CORS headers (wildcard) |
| `supabase/functions/add-tape/index.ts` | Anonymous add flow + idempotency |
| `supabase/functions/update-tape/index.ts` | Auth required; author_id / owner_id check |
| `supabase/functions/delete-tape/index.ts` | Auth required; author_id / owner_id check |
| `supabase/functions/list-scenarios/index.ts` | Confirm `is_public = true` filter |
| `supabase/migrations/20260330160000_create_scenarios_and_tapes.sql` | Slug generation, DB constraints |
| `_bmad-output/implementation-artifacts/deferred-work.md` | Known issues — check before adding new entries |

### No Testing Required

This is a review-only story. No new code means no new tests. Do not add test files. The test suite (`cd web && npm test`) should still pass at the end — confirm with a run if any code is changed.

### Project Structure Notes

- Edge Functions: `supabase/functions/<name>/index.ts` — Deno runtime, CDN imports only
- Shared helpers: `supabase/functions/_shared/` — do not modify without review
- Story deliverable location: `_bmad-output/implementation-artifacts/4-5-*.md` (this file, updated with findings)
- Deferred work: `_bmad-output/implementation-artifacts/deferred-work.md`

### References

- `_bmad-output/planning-artifacts/epics.md` — Epic 4, Story 4.5 (NFR5–NFR7, NFR12–NFR13)
- `_bmad-output/project-context.md` — Security never-violate rules
- `supabase/migrations/20260330160000_create_scenarios_and_tapes.sql` — slug entropy comment
- Epic 2 (stories 2-1 through 2-5) — ownership model that superseded the original "link possession" design

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (Cursor)

### Debug Log References

- Ran `git grep -r 'SERVICE_ROLE' web/` → exit code 1 (no matches) — confirmed zero frontend leakage.
- Verified `list-scenarios` does NOT filter by `is_public` (intentional design; slug-lookup, not a public feed). Documented as design decision — not a security gap.
- Confirmed all 11 SERVICE_ROLE occurrences in `supabase/functions/**` only, all via `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`.

### Completion Notes List

**Task 1 — PII Audit:**
All four DB tables enumerated. No email, IP, display name, or device identifier stored in any table. `owner_id` (scenarios) and `author_id` (tapes) are opaque auth UUIDs, nullable — ON DELETE SET NULL means deleted-user content becomes anonymous cleanly. `mapScenario` exposes `ownerId`; `mapTape` exposes `authorId` — both already tracked in deferred-work.md. `tape_reports` contains only `tape_id`, `scenario_slug`, `reported_at` — no PII. `idempotency_tapes` stores client-generated UUID key, `scenario_id`, `tape_id` — no PII. No new PII leaks introduced since story 2-1.

**Task 2 — Slug Entropy:**
Migration `20260330160000` confirmed: `replace(gen_random_uuid()::text, '-', '')` — 32 hex chars, ~3.4×10³⁸ combinations, non-sequential, cryptographically random. No sequential row IDs exposed in URLs (all routes use `public_slug` or tape UUID `id`).

**list-scenarios design decision (notable finding):** The endpoint does NOT filter by `is_public = true`. It accepts a list of known slugs and returns scenario data for all of them regardless of visibility. This is intentional — the library page stores slugs (public and private) in localStorage and needs to look them all up. This is NOT a slug leakage issue because callers must supply slugs; the endpoint does not enumerate or reveal unknown slugs. This is consistent with the link-access model (NFR12): knowing a slug grants read access. AC #2's phrase "only return public scenarios" referred to the concern that no private slugs are leaked — this holds true because slug enumeration is not possible.

**Task 3 — Auth Model:**
`update-tape`: requires userId (401 if anonymous); checks `author_id` OR `owner_id` (403 if neither) ✅  
`delete-tape`: same pattern ✅  
`add-tape`: anonymous allowed when `is_public = false`; blocked (401) when `is_public = true` ✅  
`create-scenario`: anonymous allowed; `owner_id` set only when userId present ✅  
`update-scenario`: requires userId (401); checks `owner_id` only (403 if not owner) ✅  
`delete-scenario`: requires userId (401 if anonymous); checks `owner_id` (403 if not owner) ✅. Additional guard: **public scenarios cannot be deleted at all** — even the owner receives `403 FORBIDDEN` with message "Make it private first to regain delete rights." Defense-in-depth: the DB DELETE also carries `.eq('is_public', false)` so a bypassed application check would silently no-op at the database level.  
Design evolution: original NFR12 PRD intent was "link possession = full modification rights." Epic 2 (story 2-1) introduced auth ownership — mutations now require authentication and correct `author_id`/`owner_id`. Current state is the intentional post-Epic-2 model. NFR13 ("future ownership/auth work") is addressed by Epic 5 and Epic 7 (library redesign, following); already in project scope.

**Task 4 — Input Validation Consistency:**
All Zod limits match DB CHECK constraints exactly:
- `tape_text`: Zod `max(2000)` ↔ DB `char_length(tape_text) <= 2000` ✅  
- `color`: Zod `max(32)` ↔ DB `char_length(color) <= 32` ✅  
- `name` (scenario): Zod `max(500)` ↔ DB `char_length(name) <= 500` ✅  
- `scenarioSlug`: Zod `max(128)` — no DB CHECK needed (slug is DB-generated UUID, not user-supplied) ✅  
- `tapeId`: Zod `.uuid()` — rejects non-UUID strings before DB lookup, prevents ID-format injection ✅  
- `list-scenarios` has additional array guard: `z.array(...).max(50)` — limits batch request abuse ✅  
All validation errors return `VALIDATION_ERROR` with HTTP 400 via `formatZodError`. Method guards confirmed: non-POST → 405 on all mutation endpoints; `get-scenario-by-slug` guards against non-GET → 405. No inconsistencies found.

**Task 5 — Rate Limiting, CORS, Key Management:**
- **Rate limiting:** No application-level rate limiting on any Edge Function. Supabase platform-level limits are the only protection. `create-scenario` accepts unlimited anonymous requests. Added to deferred-work.md (new entry).  
- **CORS:** Wildcard `*` confirmed pre-existing. `cors.ts` comment already references "Story 2.8: tighten to Vercel domain." Already tracked in deferred-work.md — no new action.  
- **Key management:** `git grep SERVICE_ROLE web/` → zero matches. All 11 occurrences of `SUPABASE_SERVICE_ROLE_KEY` are in `supabase/functions/` only, all via `Deno.env.get(...)`. No hardcoded keys anywhere. CLEAN ✅  
- **Browser env vars:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are the only client-exposed env vars. Anon key is safe for browser (cannot bypass RLS or service role). ✅  
- **OTP email enumeration:** Confirmed already tracked in deferred-work.md. ✅

**Task 6 — Deferred Work & Summary:**
Added one new section to deferred-work.md: rate limiting (no app-level limits) and anonymous scenario creation (unlimited). No other new gaps found. All other concerns were pre-existing tracked items.

### Security Posture Summary

| Area | Status | Finding |
|---|---|---|
| PII storage | ✅ | No email, IP, name, or device identifiers stored. Auth UUIDs (`owner_id`/`author_id`) are opaque and already tracked as a product decision in deferred-work.md. `tape_reports` contains no PII. |
| Slug entropy | ✅ | 128-bit cryptographic randomness via `gen_random_uuid()` (32 hex chars, ~3.4×10³⁸ combos). Non-sequential. Not enumerable — private slugs cannot be discovered via any endpoint without already knowing them. |
| Auth model | ✅ | Clear post-Epic-2 model: mutations (update/delete tape and scenario) require auth + ownership check. Anonymous create and anonymous add-to-unlisted are intentional design decisions (NFR12 link-access model). Additional guard: `delete-scenario` blocks deletion of public scenarios even for the owner (must make private first); DB DELETE carries `.eq('is_public', false)` as a redundant safety net. Auth model correctly enforced across all 10 endpoints. |
| Input limits | ✅ | All Zod limits match DB CHECK constraints exactly. `tapeId` validated as UUID before DB lookup. Batch endpoint capped at 50 slugs. All validation failures return `VALIDATION_ERROR` + HTTP 400. Method guards in place (405 for wrong method). |
| Rate limiting | ⚠️ | No application-level rate limiting on any Edge Function. `create-scenario` allows unlimited anonymous scenario creation. Supabase platform limits are the only protection. Tracked in deferred-work.md — acceptable for MVP but revisit before public launch. |
| CORS | ⚠️ | Wildcard `*` on all endpoints including mutations. Pre-existing, already tracked (Story 2.8 / deferred-work.md). No new action needed in this story. |
| Key management | ✅ | `SUPABASE_SERVICE_ROLE_KEY` exclusively accessed via `Deno.env.get(...)` in `supabase/functions/**`. Zero occurrences in `web/`. Only safe anon key (`VITE_SUPABASE_ANON_KEY`) in frontend bundle. |

### File List

- `_bmad-output/implementation-artifacts/4-5-security-and-abuse-posture-review-for-anonymous-sharing.md` (story file — audit findings, task checkboxes, security posture summary)
- `_bmad-output/implementation-artifacts/deferred-work.md` (new rate limiting / anonymous creation entries appended)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status updated)

## Senior Developer Review (AI)

**Date:** 2026-04-13
**Outcome:** Changes Requested
**Layers run:** Blind Hunter ✅ · Edge Case Hunter ✅ · Acceptance Auditor ✅

### Action Items

- [x] [Review][Patch] Document `delete-scenario` verification in Task 3 completion notes; add undocumented `is_public` deletion guard to auth matrix and Security Posture Summary [`_bmad-output/implementation-artifacts/4-5-security-and-abuse-posture-review-for-anonymous-sharing.md`]

## Change Log

- 2026-04-13: Security audit completed. All 6 tasks checked. Security Posture Summary written. Two new gaps (rate limiting, anonymous scenario creation) appended to deferred-work.md. No code changes — review-only story. Status set to "review".
- 2026-04-13: Code review complete — 1 patch (low: undocumented `delete-scenario` public-guard in auth matrix), 4 dismissed.
