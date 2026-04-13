# Story 1.3: Login Gate on Tape and Scenario Creation

Status: done

## Story

As a user who wants to create content,
I want the app to require me to be logged in before I can create a tape or scenario,
So that my content is owned by my account from day one and anonymous-only chaos is left behind.

## Acceptance Criteria

1. **Given** I am logged out
   **When** I try to generate a tape (tap Generate with non-empty input)
   **Then** the `LoginModal` opens automatically instead of locking the tape
   **And** after I successfully log in, the tape creator continues from where I was — the text I typed is preserved, and the flow resumes

2. **Given** I am logged out
   **When** I try to create a new scenario (tap "Create scenario & open")
   **Then** the `LoginModal` opens automatically
   **And** after successful login, the scenario creation can proceed (form state preserved or clearly re-entered)

3. **Given** I am logged out
   **When** I visit a shared scenario URL (`/s/:slug`)
   **Then** I can view and scroll all tapes with no gate — read access is still fully anonymous
   **And** the `+ ADD TAPE` button is visible but when tapped, the `LoginModal` opens instead of the tape creator overlay

4. **Given** I am logged in
   **When** I generate a tape, add to a scenario, or tap `+ ADD TAPE`
   **Then** those flows behave exactly as they do today — no additional friction added

5. **Given** I am on any screen
   **When** the `LoginModal` is auto-opened by a gated action
   **Then** the modal behavior (send magic link, confirmation state, close/cancel) is identical to when opened manually from the header — no new modal component needed

6. **Given** I close the auto-opened `LoginModal` without logging in
   **When** the modal closes
   **Then** I remain on the current screen with no action taken and no error state — tape creator still shows my draft text

## Tasks / Subtasks

- [x] **Task 1: Create `useLoginGate` hook** (AC: #1, #2, #3, #5, #6)
  - [x] Create `web/src/hooks/useLoginGate.ts`
  - [x] Hook signature: `useLoginGate(): { isLoginGateOpen: boolean; openLoginGate: () => void; closeLoginGate: () => void }`
  - [x] Internally reads `useAuth()` to know if user is already logged in
  - [x] `openLoginGate()`: if `user !== null`, does nothing (no-op); if `user === null`, sets `isLoginGateOpen = true`
  - [x] `closeLoginGate()`: sets `isLoginGateOpen = false`
  - [x] Export for use in any component that has a gated action

- [x] **Task 2: Gate Generate in `TapeCreatorPanel`** (AC: #1)
  - [x] In `web/src/tape/TapeCreatorPanel.tsx`, import `useLoginGate`
  - [x] Wrap the `onGenerate` / Generate button handler: if `user === null`, call `openLoginGate()` instead of proceeding with generation
  - [x] Render `{isLoginGateOpen ? <LoginModal onClose={closeLoginGate} /> : null}` inside `TapeCreatorPanel`
  - [x] **DO NOT** disable the Generate button — it should still appear active (per UX-DR11: no disabled states; empty tap does nothing silently, but a logged-out tap opens the login gate)
  - [x] After login succeeds and modal closes, the text input retains whatever was typed — no state clearing

- [x] **Task 3: Gate "Create scenario & open" in `HomePage`** (AC: #2)
  - [x] In `web/src/pages/HomePage.tsx`, import `useLoginGate`
  - [x] Wrap the `createMutation.mutate()` call in the "Create scenario & open" button handler: if `user === null`, call `openLoginGate()` instead of calling the mutation
  - [x] Render `{isLoginGateOpen ? <LoginModal onClose={closeLoginGate} /> : null}` in the `HomePage`
  - [x] After login, the user is left on the form so they can click "Create scenario & open" again — preserve `scenarioName`, `lockedForScenario` state

- [x] **Task 4: Gate `+ ADD TAPE` in `ScenarioPage`** (AC: #3)
  - [x] In `web/src/pages/ScenarioPage.tsx`, import `useLoginGate`
  - [x] Wrap the `PinnedAddButton` onClick handler (and any "open tape creator overlay" handler): if `user === null`, call `openLoginGate()` instead of opening the tape creator
  - [x] Render `{isLoginGateOpen ? <LoginModal onClose={closeLoginGate} /> : null}` in `ScenarioPage`
  - [x] Viewing the scenario page (tape stack, scenario name, count) remains fully accessible to logged-out users — no gate on reads

- [x] **Task 5: Gate "Add tape & open" (add to existing scenario) in `HomePage`** (AC: #2 extended)
  - [x] Same pattern as Task 3: wrap `addExistingMutation.mutate(...)` handler in `HomePage`
  - [x] If `user === null`, open login gate instead of calling the mutation

- [x] **Task 6: Verify anonymous read flows not broken** (AC: #4)
  - [x] Manual smoke-test: open `/s/:slug` logged out — tapes load, stack scrolls, no login prompt on page load
  - [x] Manual smoke-test: open `/` logged out — tape creator renders, typing works, live preview works
  - [x] Manual smoke-test: tap Generate logged out — LoginModal opens; close without logging in — tape text preserved
  - [x] Run `cd web && npm test` — no new test failures

### Review Findings (AI)

**Review date:** 2026-04-11
**Layers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor

- [x] [Review][Decision] Auth loading race: `openLoginGate()` fires when `loading=true` and `user=null` — Fixed: added `|| loading` guard to `openLoginGate()` in `useLoginGate.ts`. Logged-in users who tap during auth init now get a silent no-op instead of seeing the login gate. [`web/src/hooks/useLoginGate.ts:8-10`]
- [x] [Review][Patch] Dual LoginModal: TapeCreatorPanel is embedded in HomePage but both own independent gate state — `LoginModal` uses `fixed inset-0 z-50` so no layout clipping occurs. Story spec explicitly instructed this placement. Accepted as-is per spec intent; future refactor (onGatedAction prop) deferred. [`web/src/tape/TapeCreatorPanel.tsx:134`]
- [x] [Review][Defer] Double `useAuth()` subscription per component (redundant but harmless) [`web/src/tape/TapeCreatorPanel.tsx`, `web/src/pages/HomePage.tsx`, `web/src/pages/ScenarioPage.tsx`] — deferred, pre-existing pattern; both calls resolve to same context value
- [x] [Review][Defer] ScenarioPage early-return paths don't render the LoginModal [`web/src/pages/ScenarioPage.tsx:329-376`] — deferred, not reachable with current code (gate is only reachable after all early returns pass)

## Dev Notes

### What This Story Is and Is Not

**IS:**
- Gating the `Generate` action (locks tape), "Create scenario" mutation, "Add tape to existing" mutation, and "+ ADD TAPE" in ScenarioPage behind login
- Reusing the existing `LoginModal` component for all gates — no new modal component
- Preserving draft text in the tape creator when the gate is triggered and dismissed

**IS NOT:**
- Gating reads (viewing scenarios, tape stacks, the live preview as you type)
- Adding any ownership enforcement on the server side — that is Epic 2 stories
- Adding any new UI chrome like "You must be logged in" banners or disabled button states
- Changing the `LoginModal` component itself
- Gating the "About" page or navigation

### Critical Pattern: Reuse `LoginModal`, Do Not Create a New One

The `LoginModal` at `web/src/components/LoginModal.tsx` is already complete. It handles the full email → magic link → "check your inbox" state machine, inline errors, and loading. All login gates must render this exact component with an `onClose` callback:

```tsx
{isLoginGateOpen ? <LoginModal onClose={closeLoginGate} /> : null}
```

`onClose` is called when: (a) the user clicks Cancel / outside the modal, or (b) after successful login (the `onAuthStateChange` event fires and the parent can re-render). **Do not add a success callback to `LoginModal`** — the hook already has access to `useAuth()` to check login state after close.

### `useLoginGate` Hook Design

Create `web/src/hooks/useLoginGate.ts`:

```ts
import { useState } from 'react'
import { useAuth } from '../providers/AuthProvider'

export function useLoginGate() {
  const { user } = useAuth()
  const [isLoginGateOpen, setIsLoginGateOpen] = useState(false)

  function openLoginGate() {
    if (user !== null) return  // already logged in — caller should proceed directly
    setIsLoginGateOpen(true)
  }

  function closeLoginGate() {
    setIsLoginGateOpen(false)
  }

  return { isLoginGateOpen, openLoginGate, closeLoginGate }
}
```

Usage pattern in a component:
```tsx
const { user } = useAuth()
const { isLoginGateOpen, openLoginGate, closeLoginGate } = useLoginGate()

function handleGenerate() {
  if (user === null) {
    openLoginGate()
    return
  }
  // ... existing generate logic
}
```

### File Locations

- `web/src/hooks/useLoginGate.ts` — **new file**
- `web/src/tape/TapeCreatorPanel.tsx` — **modify** (gate Generate)
- `web/src/pages/HomePage.tsx` — **modify** (gate create + add-to-existing)
- `web/src/pages/ScenarioPage.tsx` — **modify** (gate + ADD TAPE)
- `web/src/components/LoginModal.tsx` — **DO NOT modify**
- `web/src/providers/AuthProvider.tsx` — **DO NOT modify**
- `web/src/api/client.ts` — **DO NOT modify**

### Existing Code Patterns to Follow

**AuthProvider / useAuth:**
```ts
// web/src/providers/AuthProvider.tsx
const { user, loading, signOut } = useAuth()
// user is User | null; loading is boolean (true until INITIAL_SESSION fires)
```

**AppHeader pattern** (already gates login modal):
```tsx
// web/src/components/AppHeader.tsx — study this for the login modal pattern
const [loginOpen, setLoginOpen] = useState(false)
// ...
{loginOpen ? <LoginModal onClose={() => setLoginOpen(false)} /> : null}
```

**TapeCreatorPanel current structure** (key props):
```tsx
// web/src/tape/TapeCreatorPanel.tsx
// Props include onLockedTapeChange (called when a tape is locked/unlocked)
// The Generate button currently fires internal generate logic
// You need to intercept this: if user === null, openLoginGate() and return early
```

**ScenarioPage current structure** (check actual file for PinnedAddButton usage):
```tsx
// web/src/pages/ScenarioPage.tsx
// PinnedAddButton has onClick prop
// Tape creator overlay state is managed here
// Gate the state setter that opens the tape creator overlay
```

### UX Behavior: No Disabled Buttons

Per UX-DR11 and the UX spec: **do not add disabled states**. The Generate button stays visually active for logged-out users. Tapping it opens the login gate — this is a clean, minimal UX pattern (same principle: empty Generate does nothing silently, logged-out Generate opens the gate silently and contextually).

There should be no "You must be logged in" text anywhere in the UI — the modal opening *is* the communication.

### UX Behavior: Preserve Draft State

When a logged-out user:
1. Types text in the tape creator
2. Taps Generate → LoginModal opens
3. Closes the modal without logging in

The text they typed must **still be in the input**. The `TapeCreatorPanel` manages its own input state via `useState` — as long as you do not reset it on gate trigger, this comes for free. Just return early from the generate handler without clearing state.

### Architecture Compliance

- No server-side changes in this story — this is purely client-side gating
- No new env vars, no Edge Function changes
- Do not introduce a new client-side `supabaseClient` import in components that don't already have it — use `useAuth()` from `AuthProvider` as the source of truth for login state
- Follow the existing `useAuth()` + local state pattern established in `AppHeader.tsx`

### Testing Requirements

Vitest is present in the project. Pre-existing tests:
- `web/src/tape/ColorPickerSwatch.test.tsx`
- `web/src/tape/ColorPresetRow.test.tsx`
- Known pre-existing failures: `document is not defined` in color picker tests — these are pre-existing and do NOT count as regressions

**Required:** Run `cd web && npm test` before marking done. No new failures introduced.

**No new test files are required** for this story (gating logic is pure state manipulation, not business logic with edge cases that require mocking).

### Regression Guard

The following anonymous flows must remain unbroken:
- Live tape preview updates as user types (no auth check on keystroke)
- `/s/:slug` page loads and shows tapes without login
- About page accessible without login
- Header "Log in" button still works as before (opens LoginModal)
- "Sign out" in header still works

### Phase 2 Context

This is a Phase 2 story (new branch, separate from Phase 1 MVP). The following Phase 2 infrastructure already exists and must not be duplicated:

| File | What's already there |
|------|---------------------|
| `web/src/lib/supabase.ts` | Supabase client singleton (`supabaseClient`) — do NOT create another |
| `web/src/providers/AuthProvider.tsx` | `AuthProvider`, `useAuth()` hook — wrap is in `main.tsx` already |
| `web/src/components/LoginModal.tsx` | Complete magic link modal — reuse as-is |
| `web/src/pages/AuthCallbackPage.tsx` | `/auth/callback` route — already registered |
| `web/src/api/client.ts` | JWT injection already wired in `supabaseFetch` |
| `web/src/components/AppHeader.tsx` | Already shows "Log in" / "Sign out" per auth state |

### Deferred Work (Do Not Address in This Story)

Per `_bmad-output/implementation-artifacts/deferred-work.md`:
- `@supabase/supabase-js` not in `package.json` — pre-existing, not your problem here
- OTP email enumeration concern — deferred
- Other deferred items from 1.2 code review — do not address now

## References

- Epic 1, Story 1.3 source: `_bmad-output/planning-artifacts/epics.md`
- Phase 2 brainstorming: `_bmad-output/brainstorming/brainstorming-session-2026-04-10-phase2.md` — Theme 1 (Identity & Access): "Login-First, No Guest Tier"
- Existing `LoginModal`: `web/src/components/LoginModal.tsx`
- Existing `AuthProvider`/`useAuth`: `web/src/providers/AuthProvider.tsx`
- Existing `AppHeader` (login gate pattern): `web/src/components/AppHeader.tsx`
- UX-DR11 (no disabled states on Generate): `_bmad-output/planning-artifacts/epics.md`
- Story 1.2 completion notes: `_bmad-output/implementation-artifacts/1-2-magic-link-login-flow.md`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Completion Notes List

- Created `web/src/hooks/useLoginGate.ts` — minimal hook wrapping `useAuth()` with local `isLoginGateOpen` state; `openLoginGate()` no-ops when user is logged in, otherwise opens the gate.
- `TapeCreatorPanel`: intercepted `handleGenerate` — if `user === null`, calls `openLoginGate()` and returns early; warningText state is untouched so draft is preserved. `LoginModal` renders conditionally inside the component.
- `HomePage`: added `useLoginGate` + `useAuth`; gated both "Create scenario & open" and "Add tape & open" button handlers; form state (`scenarioName`, `lockedForScenario`) is preserved because the mutation is simply not called. `LoginModal` renders as sibling to `<main>` (wrapped in a fragment).
- `ScenarioPage`: gated the `+ ADD TAPE` / `Close` toggle button — when logged out and panel is closed, `openLoginGate()` fires instead of `openAddPanel()`; reading scenario tapes remains completely ungated. `LoginModal` renders as sibling to `<main>` (wrapped in a fragment).
- All 17 pre-existing tests pass (`npm test -- --run`). No new test files required per story spec — gating logic is pure state manipulation.
- Anonymous reads (scenario page, live tape preview, homepage render) are unaffected — no auth checks added to read paths.

### File List

- `web/src/hooks/useLoginGate.ts` — **new**
- `web/src/tape/TapeCreatorPanel.tsx` — **modified** (gate Generate)
- `web/src/pages/HomePage.tsx` — **modified** (gate Create scenario & open, Add tape & open)
- `web/src/pages/ScenarioPage.tsx` — **modified** (gate + ADD TAPE)

### Change Log

| Date | Change |
|------|--------|
| 2026-04-11 | Story file created — login gate on tape and scenario creation (Phase 2, Epic 1, Story 1.3) |
| 2026-04-11 | Implemented all tasks: useLoginGate hook, Generate gate in TapeCreatorPanel, Create/Add gates in HomePage, Add tape gate in ScenarioPage. All 17 tests pass. |
