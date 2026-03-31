# Session handoff — caution-bmad (caution tape generator)

Use this file to resume work in a **new chat**. Paste a short pointer: *“Continue from `_bmad-output/session-handoff.md`.”*

## Project

- **Repo:** `https://github.com/melissacikara/caution-tape-generator` (local folder may be `caution-bmad`)
- **Stack:** Vite + React + TypeScript + Tailwind v4 (`web/`), Supabase Postgres + Edge Functions (`supabase/functions/`)
- **BMad output:** `_bmad-output/` (planning artifacts, implementation stories, sprint status)

## Shipped / working

- **Frontend:** Deployed on **Vercel** with root directory **`web`**, **`outputDirectory` `dist`** and SPA rewrites in `web/vercel.json`
- **Backend:** Supabase **Edge Functions** deployed to project ref **`fmgdzzxsjvmfnimvlxck`** (see Supabase Dashboard → Functions)
- **Env (Vercel):** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set for **Production** (and Preview if desired); **redeploy after changing** them — Vite bakes `VITE_*` at build time
- **Tests (local):** Root `package.json` — `npm run test:api`, `npm run test:e2e` (Playwright + Vitest)

## Important product behavior (not a bug)

- **Scenario library on the home page** is driven by **`localStorage`** key `caution_known_scenario_slugs` (`web/src/lib/knownScenarios.ts`). It is **per browser / per device**, not a global server-side list. New device, private window, or cleared storage → library can look empty or different. Deep links `/s/:slug` still load scenarios from the server; sharing uses **URLs**, not “my library” sync.

## Phase 2 direction (when you return)

- **Goal:** Server-backed library so the gap (device-local only) is addressed — needs a **product + architecture decision** (anonymous session vs light auth, still no public enumeration of all scenarios per PRD posture)
- **BMad-style next steps:** Update PRD (`bmad-edit-prd` or addendum), architecture notes, then `bmad-create-story` for a first vertical slice; optional `bmad-correct-course` if scope shifts hard

## Useful paths

| Area | Path |
|------|------|
| Web app | `web/` |
| API client | `web/src/api/client.ts` |
| Known slugs | `web/src/lib/knownScenarios.ts` |
| Edge functions | `supabase/functions/` |
| Migrations | `supabase/migrations/` |
| E2E / API tests | `tests/` |

## CLI reminders

- **Supabase (no global install required):** `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`, `npx supabase functions deploy`
- **If `db push` complains about migration history:** remote may have versions not in repo — follow CLI hints (`migration repair` / `db pull`) carefully before changing production DB

## Node / Vercel

- **`web/.nvmrc`:** `22` — Node 22.x for local/Vercel alignment
- **`engines` was removed** from `web/package.json` to avoid Vercel `engines` warnings; version pinned via `.nvmrc` + Vercel settings if needed

---

*Last updated: 2026-03-30 — handoff file for resuming after a break.*
