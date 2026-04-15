# Phase 2 handoff capture — 2026-04-15

_Saved for Melissa — return here after a break. Summarizes deferred work, brainstorm gaps vs shipped, and sprint state._

## Sprint tracker

- `_bmad-output/implementation-artifacts/sprint-status.yaml`: Epics **1–7** and stories marked **`done`**. No open backlog in that file.

## Deferred / tech debt (source: `deferred-work.md`)

| Area | Examples |
|------|----------|
| Dependencies | `@supabase/supabase-js` not declared in `web/package.json` |
| Security / abuse | No app-level rate limits; anonymous `create-scenario` uncapped; `DATABASE_ERROR` may leak raw Postgres; CORS `*` on functions |
| Auth / login | `LoginModal` setState-after-unmount risk; email enumeration via Supabase errors; `signOut` errors swallowed; some `onAuthStateChange` events unhandled |
| Privacy / API | `owner_id` / `author_id` in public API — needs product decision |
| Robustness | `localStorage` in `knownScenarios.ts` without try/catch; `normalizeHex` accepts garbage; `updated_at` on scenarios client-set vs DB trigger |
| UX edge | Session expiry while add-tape panel open |
| A11y | Stacked modals + Escape (Login + delete sheet) |
| Export | Very long tapes → canvas size limits for camera-roll export |

## Brainstorm vs shipped (possible product follow-ups)

Source: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md`

1. **Homepage “top 3” public scenarios** — Brainstorm wanted top popular boards + CTA on the front door. **Shipped:** `/` → `/about`, creator at `/create`. Story 5-2 notes top-3 as separate — **scope gap**, not a bug.

2. **Footer “Buy me a coffee”** — Brainstorm: report + coffee. **Shipped:** `AppFooter` / About — report-oriented copy, **no coffee link**.

3. **Quiet badge for public contributors who don’t follow** — Brainstorm: badge for boards you **added a tape to**. **`markUnreadForNewTape`** (`supabase/functions/_shared/activityUnread.ts`) fans out to **owner**, **`scenario_invites`**, **`scenario_follows`** — not other tape authors. **Possible spec gap** for “contributed once, didn’t follow.”

4. **Empty library buckets** — Brainstorm: progressive disclosure (hide empty). **Following** bucket was changed to **always visible** with empty copy — **intentional product change.**

## Recent implementation notes (this session arc)

- Epic 7: follow/unfollow Edge Functions, magic-link login (`emailRedirectTo` + no OTP step), Following bucket always shown, “Create your own!” link on empty My Scenarios (`text-accent` for visibility), deploy of `get-scenario-by-slug`, `follow-scenario`, `unfollow-scenario`.

## Suggested next steps when back

1. Decide on **top-3 home**, **coffee link**, **contributor unread** — new stories vs won’t do.
2. Pre-launch: pick items from `deferred-work.md` (e.g. `package.json`, rate limits, generic errors).
3. Optional: reconcile `epics.md` with brainstorm so docs match reality.

## Branch reminder

- Active work: **`phase2`**. `master` = Phase 1 baseline per `project-context.md`.
