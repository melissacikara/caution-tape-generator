/**
 * Tests for Story 4.3: Reliability hardening — idempotency key stability.
 *
 * Key invariant: when a user retries "Add tape & open" after a network failure
 * the SAME idempotencyKey must be passed to addTape on every attempt, so the
 * server can deduplicate and never creates two tapes from one user intent.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Module mocks ─────────────────────────────────────────────────────────────
// vi.mock calls are hoisted above imports by Vitest — all vi.fn() are fresh mocks

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'test@example.com' },
    session: null,
    loading: false,
    signOut: vi.fn(),
  }),
}))

vi.mock('../hooks/useLoginGate', () => ({
  useLoginGate: () => ({
    isLoginGateOpen: false,
    openLoginGate: vi.fn(),
    closeLoginGate: vi.fn(),
  }),
}))

vi.mock('../components/LoginModal', () => ({
  LoginModal: () => <div role="dialog">Login</div>,
}))

vi.mock('../components/ScenarioLibrary', () => ({
  ScenarioLibrary: () => <div data-testid="scenario-library">Library</div>,
}))

vi.mock('../api/client', () => ({
  ApiError: class ApiError extends Error {
    code: string
    status: number
    constructor(code: string, message: string, status: number) {
      super(message)
      this.code = code
      this.status = status
    }
  },
  addTape: vi.fn(),
  listScenarios: vi.fn(),
  createScenario: vi.fn(),
  isSupabaseConfigured: () => true,
}))

vi.mock('../lib/knownScenarios', () => ({
  getKnownScenarioSlugs: () => ['slug-existing'],
  rememberScenarioSlug: vi.fn(),
  forgetScenarioSlug: vi.fn(),
}))

/**
 * TapeCreatorPanel stub: renders a "Lock tape" button that fires onLockedTapeChange
 * with a fixed tape, simulating the user completing a tape and locking it.
 */
vi.mock('../tape', () => ({
  TapeCreatorPanel: ({
    onLockedTapeChange,
  }: {
    onLockedTapeChange?: (tape: { text: string; color: string } | null) => void
  }) => (
    <div>
      <button
        type="button"
        onClick={() => onLockedTapeChange?.({ text: 'CAUTION: test', color: '#FFD000' })}
      >
        Lock tape
      </button>
    </div>
  ),
}))

// ── Imports (resolved after mocks are hoisted) ────────────────────────────────
import { addTape, listScenarios } from '../api/client'
import { HomePage } from './HomePage'

const mockAddTape = vi.mocked(addTape)
const mockListScenarios = vi.mocked(listScenarios)

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockScenarioRow = {
  scenario: {
    id: 's1',
    publicSlug: 'slug-existing',
    name: 'Existing Scenario',
    isPublic: false,
    ownerId: 'u1',
    createdAt: '2026-01-01T00:00:00Z',
  },
  tapeCount: 1,
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 0, staleTime: 0 },
      mutations: { retry: 0 },
    },
  })
}

function renderHomePage() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HomePage — idempotency key stability (Story 4.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListScenarios.mockResolvedValue({ scenarios: [mockScenarioRow] })
  })

  it('uses the same idempotencyKey on first attempt and retry after failure', async () => {
    const user = userEvent.setup()

    // First call fails, second succeeds — simulates flaky network
    mockAddTape
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        tape: { id: 't1', scenarioId: 's1', tapeText: 'CAUTION: test', color: '#FFD000', createdAt: '' },
        idempotent: false,
      })

    renderHomePage()

    // Lock the tape (TapeCreatorPanel stub fires onLockedTapeChange)
    await user.click(screen.getByRole('button', { name: /lock tape/i }))

    // Select "Add to an existing scenario" radio
    const existingRadio = screen.getByRole('radio', { name: /add to an existing/i })
    await user.click(existingRadio)

    // Wait for the list query to resolve and button to become enabled
    const addButton = await screen.findByRole('button', { name: /add tape & open/i })
    expect(addButton).not.toBeDisabled()

    // First click → fails
    await user.click(addButton)
    await waitFor(() => expect(mockAddTape).toHaveBeenCalledTimes(1))

    // Wait for error state to settle, button re-enables
    await waitFor(() => expect(addButton).not.toBeDisabled())

    // Second click (retry) → succeeds
    await user.click(addButton)
    await waitFor(() => expect(mockAddTape).toHaveBeenCalledTimes(2))

    // Both calls must carry the exact same idempotencyKey
    const firstKey = (mockAddTape.mock.calls[0][0] as { idempotencyKey: string }).idempotencyKey
    const secondKey = (mockAddTape.mock.calls[1][0] as { idempotencyKey: string }).idempotencyKey

    expect(firstKey).toBeTruthy()
    expect(firstKey).toBe(secondKey)
  })

  it('sends a valid idempotencyKey on a successful add', async () => {
    const user = userEvent.setup()

    mockAddTape.mockResolvedValueOnce({
      tape: { id: 't1', scenarioId: 's1', tapeText: 'first', color: '#FFD000', createdAt: '' },
      idempotent: false,
    })

    renderHomePage()

    await user.click(screen.getByRole('button', { name: /lock tape/i }))
    await user.click(screen.getByRole('radio', { name: /add to an existing/i }))

    const addButton = await screen.findByRole('button', { name: /add tape & open/i })
    await user.click(addButton)
    await waitFor(() => expect(mockAddTape).toHaveBeenCalledTimes(1))

    const key = (mockAddTape.mock.calls[0][0] as { idempotencyKey: string }).idempotencyKey
    expect(key).toBeTruthy()
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('idempotencyKey is a valid UUID format', async () => {
    const user = userEvent.setup()
    mockAddTape.mockRejectedValueOnce(new Error('fail'))

    renderHomePage()

    await user.click(screen.getByRole('button', { name: /lock tape/i }))
    await user.click(screen.getByRole('radio', { name: /add to an existing/i }))

    const addButton = await screen.findByRole('button', { name: /add tape & open/i })
    await user.click(addButton)
    await waitFor(() => expect(mockAddTape).toHaveBeenCalledTimes(1))

    const key = (mockAddTape.mock.calls[0][0] as { idempotencyKey: string }).idempotencyKey
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })
})
