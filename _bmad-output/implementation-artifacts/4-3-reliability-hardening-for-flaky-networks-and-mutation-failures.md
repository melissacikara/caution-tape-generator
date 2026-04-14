# Story 4.3: Reliability Hardening for Flaky Networks and Mutation Failures

Status: done

## Story

As a user,
I want saves to feel trustworthy,
So that jokes don't disappear (NFR8–NFR10, NFR14, UX-DR12).

## Acceptance Criteria

1. **Given** poor connectivity scenarios,
   **When** mutations fail or time out,
   **Then** inline errors appear and drafts are preserved across create/add flows,
   **And** retries do not create duplicate tapes (verified by test or manual protocol).

2. **Given** edit or delete mutations,
   **When** the server rejects or the network fails,
   **Then** the UI reverts to server state or shows inline error — **no inconsistent tape row** versus persisted data (NFR14).

## Tasks / Subtasks

- [x] **Task 1: Fix idempotency key on `addExistingMutation` in `HomePage.tsx`** (AC: #1)
  - [x] Add `addExistingIdempotencyKey` state (`string | null`) — mirrors `addTapeIdempotencyKey` in `ScenarioPage`
  - [x] Generate and store the key when `lockedForScenario` becomes non-null (reset when it becomes null)
  - [x] Pass the stored key to `addExistingMutation.mutate(...)` instead of inline `crypto.randomUUID()`
  - [x] Reset key to `null` in `onSuccess` of `addExistingMutation` (new session needs a fresh key)
  - [x] Regenerate key when `lockedForScenario` tape text/color changes (signal a new add session)
  - [x] **Why this matters**: Previous code called `crypto.randomUUID()` inline per click — every retry after failure sent a different key, so the server would create a new tape each time

- [x] **Task 2: Audit remaining mutation error paths** (AC: #1, #2)
  - [x] Confirm `createMutation` (create-scenario) in `HomePage` shows inline error on failure — ✅ present (`{errMsg ? ...}`); button re-enables when `!isPending`
  - [x] Confirm `addExistingMutation` error display survives after task 1 fix — inline `addExistingErr` preserved
  - [x] Confirm `ScenarioPage` mutations: `addMutation`, `updateMutation`, `deleteMutation`, `renameScenarioMutation`, `deleteScenarioMutation`, `toggleVisibilityMutation`, `reportMutation` — all show inline errors and `onError` rollback is wired on all optimistic mutations ✅
  - [x] Confirm no mutation swallows errors silently — `parseJson` always throws `ApiError` on non-ok; no empty `catch` blocks ✅

- [x] **Task 3: Write idempotency key stability test** (AC: #1)
  - [x] Added `web/src/pages/HomePage.test.tsx`
  - [x] 3 tests: same key on retry after failure; fresh key after success; UUID format validation
  - [x] All 64 tests pass (`npm test` in `web/` — 61 existing + 3 new)

- [x] **Task 4: Manual protocol — flaky network scenarios** (AC: #1, #2)
  - [x] Protocol documented in Dev Agent Record → Completion Notes

## Dev Notes

### Scope of This Story

This story is **targeted bug-fix + audit + verification** for flaky-network reliability.
- ONE confirmed code bug: idempotency key generation in `HomePage.addExistingMutation`
- All other error/rollback paths are already correctly implemented — do NOT refactor them
- Do NOT change `ScenarioPage` idempotency key logic (it is already correct)
- Do NOT add debounce/retry logic to mutations — `QueryProvider` already sets `mutations: { retry: 0 }`

### The One Code Bug

**File**: `web/src/pages/HomePage.tsx`

**Problem**: `addExistingMutation.mutate()` is called with a fresh `crypto.randomUUID()` on every button click:

```tsx
// Current (broken for retries):
addExistingMutation.mutate({
  scenarioSlug: existingSelectValue,
  idempotencyKey: crypto.randomUUID(),   // ← new UUID every click = new tape every retry
})
```

**Fix pattern** (mirrors `ScenarioPage.addTapeIdempotencyKey`):

```tsx
// Add state at top of component:
const [addExistingIdempotencyKey, setAddExistingIdempotencyKey] = useState<string | null>(null)

// Generate key when lockedForScenario changes to non-null
// (wrap in useEffect or set in handleLockedTapeChange):
useEffect(() => {
  if (lockedForScenario) {
    setAddExistingIdempotencyKey(crypto.randomUUID())
  } else {
    setAddExistingIdempotencyKey(null)
  }
}, [lockedForScenario])

// In addExistingMutation definition, add onSuccess reset:
onSuccess: (_, { scenarioSlug }) => {
  setAddExistingIdempotencyKey(null)   // ← add this
  // ... existing onSuccess logic ...
}

// In button onClick, use stored key:
addExistingMutation.mutate({
  scenarioSlug: existingSelectValue,
  idempotencyKey: addExistingIdempotencyKey ?? crypto.randomUUID(),
})

// Also disable button when key is null:
disabled={
  !configured ||
  !existingSelectValue ||
  !addExistingIdempotencyKey ||      // ← add this guard
  addExistingMutation.isPending ||
  (listQuery.data?.scenarios?.length ?? 0) === 0
}
```

**Key constraint**: The `addExistingIdempotencyKey` must be stable for the same "add session" (same locked tape intended for the same destination). It resets when `lockedForScenario` becomes null (tape unlocked/cleared) and on `onSuccess`. This matches the server's idempotency semantics: same key = same tape, don't create again.

### What Is Already Correct (Do Not Touch)

| Mutation | File | Rollback? | Inline Error? | Idempotency? |
|---|---|---|---|---|
| `addMutation` | `ScenarioPage` | ✅ `ctx.previous` | ✅ `addErr` | ✅ stable `addTapeIdempotencyKey` |
| `updateMutation` | `ScenarioPage` | ✅ `ctx.previous` | ✅ `editErr` | n/a (update by id) |
| `deleteMutation` | `ScenarioPage` | ✅ `ctx.previous` | ✅ `deleteErr` in `DeleteConfirmSheet` | n/a |
| `renameScenarioMutation` | `ScenarioPage` | ✅ `ctx.previous` + `setRenameText` | ✅ `renameErr` | n/a |
| `deleteScenarioMutation` | `ScenarioPage` | n/a (navigate away on success) | ✅ `deleteScenarioErr` | n/a |
| `toggleVisibilityMutation` | `ScenarioPage` | ✅ `ctx.previous` | ✅ `toggleVisibilityErr` | n/a |
| `reportMutation` | `ScenarioPage` | n/a (no optimistic) | ✅ per-tape alert | n/a |
| `createMutation` | `HomePage` | n/a (no optimistic) | ✅ `errMsg` | no key, but scenario creation is acceptable for now |
| `addExistingMutation` | `HomePage` | n/a (no optimistic) | ✅ `addExistingErr` | **⚠️ BUG — fix in Task 1** |

### TanStack Query Config (Already Set — Do Not Re-configure)

From `QueryProvider.tsx`:
- `queries: { staleTime: 30_000, retry: 1 }` — one retry on GET fails (safe for reads)
- `mutations: { retry: 0 }` — no auto-retry on POST (prevent accidental duplicates)

This was already hardened in 4.2. Do not change.

### Project Structure Notes

- `web/src/pages/HomePage.tsx` — the file to fix
- `web/src/pages/ScenarioPage.tsx` — reference implementation (idempotency key done correctly here)
- `web/src/providers/QueryProvider.tsx` — already correct, do not touch
- `web/src/api/client.ts` — no changes needed; `parseJson<T>` already throws `ApiError` on non-ok responses
- New test file: `web/src/pages/HomePage.test.tsx` (co-located per project convention)
- No Edge Function changes needed

### Testing Standards

- Co-locate: `HomePage.test.tsx` next to `HomePage.tsx` in `web/src/pages/`
- Framework: `@testing-library/react` + `vi.mock` for `../api/client`; `vi.fn()` for callbacks
- `test-setup.ts` stubs Supabase env vars — do NOT import it manually in test files (registered via `setupFiles` in `vite.config.ts`)
- Run: `npm test` in `web/` → `vitest run`
- No timing-based assertions; mock the mutation function to control success/failure

### Minimal Test Sketch (Idempotency Key Stability)

```tsx
// web/src/pages/HomePage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

vi.mock('../api/client', () => ({
  addTape: vi.fn(),
  createScenario: vi.fn(),
  listScenarios: vi.fn().mockResolvedValue({ scenarios: [/* mock row */] }),
  isSupabaseConfigured: () => true,
}))
// ... wrap with QueryProvider, AuthProvider, MemoryRouter
// assert addTape is called with the same idempotencyKey on first and second attempt
```

Full implementation is at the developer's discretion; the key assertion is:
`expect(addTape).toHaveBeenNthCalledWith(1, expect.objectContaining({ idempotencyKey: 'key-A' }))`
`expect(addTape).toHaveBeenNthCalledWith(2, expect.objectContaining({ idempotencyKey: 'key-A' }))` ← same

### Manual Protocol Template (Copy Into Completion Notes)

```
**Flaky-network manual protocol (AC1 + AC2)**

1. Open /create, compose a tape, lock it, select "Add to an existing scenario".
2. In DevTools: Network → Offline.
3. Click "Add tape & open" → expect: button shows "Adding…", then inline error, tape draft preserved.
4. Network → Online. Click again → expect: request fires with same idempotency key. Tape added once.
5. Navigate to the scenario → confirm tape appears exactly once.

6. Open an existing scenario /s/:slug.
7. Click "ADD TO THE CHAOS", type text, click submit.
8. Network → Offline mid-flight (if timing allows) or mock rejection.
9. Observe: inline error below form, "You can edit and retry." draft preserved.
10. Network → Online. Retry → same key → tape added once.

11. Edit an existing tape, submit, fail (Offline). Observe tape row reverts to original text/color.
12. Delete a tape, confirm, fail. Observe tape row reappears.
```

### References

- `_bmad-output/planning-artifacts/epics.md` — Epic 4, Story 4.3
- `_bmad-output/project-context.md` — stack, auth, error handling, testing rules
- `web/src/pages/ScenarioPage.tsx` — reference: `addTapeIdempotencyKey` (lines 58, 370–372, 396–398, 152)
- `web/src/pages/HomePage.tsx` — bug location: `addExistingMutation`, button `onClick`
- `web/src/providers/QueryProvider.tsx` — `mutations: { retry: 0 }` already set

## Dev Agent Record

### Agent Model Used

Cursor (Sonnet 4.6)

### Debug Log References

- `npm test` in `web/` (vitest run): **64 tests passed, 0 failed** (61 pre-existing + 3 new)
- "Not implemented: navigation to another Document" — jsdom warning from `navigate()` in `onSuccess`; expected and harmless in test environment

### Completion Notes List

**Task 1 — Idempotency key fix (AC1)**

Root cause: `addExistingMutation`'s button `onClick` called `crypto.randomUUID()` inline on every click. Retries after network failure produced a different key each time, causing the server to treat each retry as a new tape.

Fix applied to `web/src/pages/HomePage.tsx`:
- Added `addExistingIdempotencyKey: string | null` state
- Added `prevLockedRef` (useRef) to detect tape content changes
- Added `useEffect` driven by `lockedForScenario`: generates a new UUID when tape becomes locked or changes; clears to `null` when tape is unlocked
- `addExistingMutation.onSuccess` sets key to `null` (session is over; next lock will generate a fresh key)
- Button `onClick` now passes the stored key; also guards with `if (!addExistingIdempotencyKey) return`
- Button `disabled` now includes `!addExistingIdempotencyKey` guard

**Task 2 — Mutation audit (AC1 + AC2)**

All `ScenarioPage` mutations confirmed correct:
- `addMutation`, `updateMutation`, `deleteMutation`, `renameScenarioMutation`, `toggleVisibilityMutation`: optimistic rollback via `ctx.previous` in `onError` ✅
- Inline error display with `role="alert"` for all mutation error surfaces ✅
- `deleteScenarioMutation`: no optimistic update (navigates away on success); error displayed in `DeleteConfirmSheet.errorMessage` ✅
- `reportMutation`: intentional — `reportingTapeId` left set on error so the per-tape alert renders ✅
- `QueryProvider`: `mutations: { retry: 0 }` already set (4.2) — no auto-retry on POST ✅
- `api/client.ts`: `parseJson` throws `ApiError` on every non-ok response; no silent swallows ✅

**Task 3 — Tests (AC1)**

`web/src/pages/HomePage.test.tsx` — 3 tests:
1. `uses the same idempotencyKey on first attempt and retry after failure` — mocks `addTape` to fail then succeed; asserts calls[0] and calls[1] carry identical `idempotencyKey`
2. `uses a NEW idempotencyKey after a successful add (next add session)` — verifies a valid key is sent on a fresh add session
3. `idempotencyKey is a valid UUID format` — regex check: `/^[0-9a-f]{8}-...-[0-9a-f]{12}$/`

**Manual protocol — flaky network (AC1 + AC2)**

*Add-tape retry — ScenarioPage:*
1. Open a scenario `/s/:slug` and click **ADD TO THE CHAOS**
2. Type tape text
3. DevTools → Network → Offline; click submit — expect: "Adding…" then inline error, draft preserved
4. Network → Online; click again — expect: same idempotency key sent, tape added once
5. Navigate to scenario — confirm tape appears exactly once

*Add-tape retry — HomePage:*
1. Open `/create`, compose tape, click "Issue a warning" (lock tape)
2. Select "Add to an existing scenario" radio
3. DevTools → Network → Offline; click **Add tape & open** — expect: inline error, button re-enables
4. Network → Online; click again — expect: same key, tape added once

*Edit-tape failure:*
1. Open edit panel on an existing tape; change text; DevTools → Offline; save
2. Network → Online; observe: row reverts to original text/color (optimistic rollback via `ctx.previous`)

*Delete-tape failure:*
1. Confirm-delete sheet; DevTools → Offline; confirm
2. Network → Online; observe: tape row reappears (optimistic rollback)

### Review Findings

**Layers run:** Blind Hunter ✅, Edge Case Hunter ✅, Acceptance Auditor ✅
**Outcome:** 3 patches applied (1 during build, 2 post-review), 2 deferred, ~6 dismissed.

- [x] [Review][Patch] `AddTapeResponse` missing `idempotent: boolean` in test mock fixtures `[HomePage.test.tsx]` — caught by TypeScript build; fixed during browser prep
- [x] [Review][Patch] Key not reset when user changes target scenario — added second `useEffect` on `existingSelectValue` `[HomePage.tsx:~100]`
- [x] [Review][Patch] Test name "uses a NEW idempotencyKey..." overpromised — renamed + assertion improved `[HomePage.test.tsx]`
- [x] [Review][Defer] `onSuccess` sets key null before `navigate()` — if navigation removed in future, button stuck disabled; current flow always navigates — deferred, fragility only
- [x] [Review][Defer] `crypto.randomUUID()` requires secure context — pre-existing, Supabase requires HTTPS — deferred, pre-existing

**Manual flaky-network protocol:** Cannot automate without live Supabase credentials (no `.env` file in preview build). Protocol documented above for manual verification.

### File List

- `web/src/pages/HomePage.tsx` — idempotency key: state + two useEffects (tape-lock + scenario-change) + onSuccess reset + button guards
- `web/src/pages/HomePage.test.tsx` — new: 3 idempotency key stability tests (including scenario-change and UUID format)
- `_bmad-output/implementation-artifacts/4-3-reliability-hardening-for-flaky-networks-and-mutation-failures.md` — story file
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status updated

### Change Log

- 2026-04-13: Fixed idempotency key bug in `HomePage.addExistingMutation` — stored key in state, stable across retries, reset on success. Added second useEffect to rotate key when target scenario changes. Added `HomePage.test.tsx` with 3 idempotency tests. Mutation audit confirmed all error paths correct. 64/64 tests pass, clean TypeScript build.
