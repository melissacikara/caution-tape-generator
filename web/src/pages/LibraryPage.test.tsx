import type { User } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQuery } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LibraryPage } from './LibraryPage'

const authStub = vi.hoisted(() => ({
  state: {
    user: null as User | null,
    loading: false,
  },
}))

const queryStubs = vi.hoisted(() => ({
  public: {
    data: undefined as
      | undefined
      | { scenarios: Array<{ scenario: Record<string, unknown>; tapeCount: number }> },
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  mine: {
    data: undefined as
      | undefined
      | { scenarios: Array<{ scenario: Record<string, unknown>; tapeCount: number }> },
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  invited: {
    data: undefined as
      | undefined
      | { scenarios: Array<{ scenario: Record<string, unknown>; tapeCount: number }> },
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  following: {
    data: undefined as
      | undefined
      | { scenarios: Array<{ scenario: Record<string, unknown>; tapeCount: number }> },
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  unread: {
    data: undefined as undefined | { scenarioIds: string[] },
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

vi.mock('../providers/useAuth', () => ({
  useAuth: () => ({
    user: authStub.state.user,
    loading: authStub.state.loading,
    session: null,
    signOut: vi.fn(),
  }),
}))

vi.mock('../components/LoginModal', () => ({
  LoginModal: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Login">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

vi.mock('../api/client', () => ({
  listPublicScenarios: vi.fn(),
  listMyScenarios: vi.fn(),
  listInvitedScenarios: vi.fn(),
  listFollowedScenarios: vi.fn(),
  listUnreadScenarios: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
  ApiError: class ApiError extends Error {
    code: string
    status: number
    constructor(code: string, message: string, status: number) {
      super(message)
      this.name = 'ApiError'
      this.code = code
      this.status = status
    }
  },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <LibraryPage />
    </MemoryRouter>,
  )
}

function resetQueryStubs() {
  queryStubs.public = {
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }
  queryStubs.mine = {
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }
  queryStubs.invited = {
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }
  queryStubs.following = {
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }
  queryStubs.unread = {
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }
}

describe('LibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStub.state.user = null
    authStub.state.loading = false
    resetQueryStubs()
    vi.mocked(useQuery).mockImplementation((options: { queryKey: readonly unknown[] }) => {
      const key = options.queryKey
      if (Array.isArray(key) && key.includes('public-feed')) {
        return { ...queryStubs.public } as unknown as ReturnType<typeof useQuery>
      }
      if (Array.isArray(key) && key.includes('mine')) {
        return { ...queryStubs.mine } as unknown as ReturnType<typeof useQuery>
      }
      if (Array.isArray(key) && key.includes('invited')) {
        return { ...queryStubs.invited } as unknown as ReturnType<typeof useQuery>
      }
      if (Array.isArray(key) && key.includes('following')) {
        return { ...queryStubs.following } as unknown as ReturnType<typeof useQuery>
      }
      if (Array.isArray(key) && key.includes('unread')) {
        return { ...queryStubs.unread } as unknown as ReturnType<typeof useQuery>
      }
      return { ...queryStubs.public } as unknown as ReturnType<typeof useQuery>
    })
  })

  it('renders the Public tab as active by default', () => {
    renderPage()
    const publicTab = screen.getByRole('tab', { name: /public/i })
    expect(publicTab).toBeInTheDocument()
    expect(publicTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders both Public and Private tabs', () => {
    renderPage()
    expect(screen.getByRole('tab', { name: /public/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /private/i })).toBeInTheDocument()
  })

  it('shows public tab panel content on load', () => {
    renderPage()
    expect(screen.getByRole('tabpanel', { name: /public/i })).toBeInTheDocument()
  })

  it('switches to Private tab when clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: /private/i }))

    const privateTab = screen.getByRole('tab', { name: /private/i })
    expect(privateTab).toHaveAttribute('aria-selected', 'true')

    const publicTab = screen.getByRole('tab', { name: /public/i })
    expect(publicTab).toHaveAttribute('aria-selected', 'false')
  })

  it('(logged out) Private tab shows login prompt — not an error', async () => {
    authStub.state.user = null
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: /private/i }))

    expect(screen.getByText(/your private collection lives here/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('(logged out) clicking Log in button opens the login modal', async () => {
    authStub.state.user = null
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: /private/i }))
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(screen.getByRole('dialog', { name: /login/i })).toBeInTheDocument()
  })

  it('(logged out) closing the login modal dismisses it', async () => {
    authStub.state.user = null
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: /private/i }))
    await user.click(screen.getByRole('button', { name: /log in/i }))
    expect(screen.getByRole('dialog', { name: /login/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('(logged in) Private tab shows personal collection shell — no login prompt', async () => {
    authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: /private/i }))

    expect(screen.queryByText(/your private collection lives here/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument()
    expect(screen.getByRole('tabpanel', { name: /private/i })).toBeInTheDocument()
  })

  it('(auth loading) Private tab shows library skeleton — no login prompt, no error', async () => {
    authStub.state.user = null
    authStub.state.loading = true
    const user = userEvent.setup()
    const { container } = renderPage()

    await user.click(screen.getByRole('tab', { name: /private/i }))

    const privatePanel = screen.getByRole('tabpanel', { name: /private/i })
    expect(privatePanel.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByText(/your private collection lives here/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(container.querySelectorAll('[aria-busy="true"]').length).toBeGreaterThanOrEqual(1)
  })

  describe('Private tab — My Scenarios (5.3)', () => {
    it('shows skeleton under My Scenarios heading while mine query is loading', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.mine.isLoading = true
      const user = userEvent.setup()
      const { container } = renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      const privatePanel = screen.getByRole('tabpanel', { name: /private/i })
      const skeleton = privatePanel.querySelector('[aria-busy="true"]')
      expect(skeleton).not.toBeNull()
      expect(screen.getByRole('heading', { name: /^my scenarios$/i })).toBeInTheDocument()
      expect(container.querySelectorAll('[aria-busy="true"]').length).toBeGreaterThanOrEqual(1)
    })

    it('shows My Scenarios heading and empty copy when mine returns empty', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.mine.data = { scenarios: [] }
      queryStubs.mine.isLoading = false
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      expect(screen.getByRole('heading', { name: /^my scenarios$/i })).toBeInTheDocument()
      expect(screen.getByText(/you haven't created any scenarios yet/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /create your own/i })).toHaveAttribute('href', '/')
    })

    it('renders My Scenarios heading and card link when one owned scenario exists', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.mine.data = {
        scenarios: [
          {
            scenario: {
              id: 's-owned',
              publicSlug: 'my-board',
              name: 'My Board',
              isPublic: false,
              ownerId: 'u1',
              createdAt: '2026-01-01T00:00:00Z',
            },
            tapeCount: 2,
          },
        ],
      }
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      expect(screen.getByRole('heading', { name: /^my scenarios$/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /my board/i })).toHaveAttribute('href', '/s/my-board')
    })

    it('shows quiet badge on a My Scenario card when its id is in the unread list', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.mine.data = {
        scenarios: [
          {
            scenario: {
              id: 's-owned-unread',
              publicSlug: 'my-board',
              name: 'My Board',
              isPublic: false,
              ownerId: 'u1',
              createdAt: '2026-01-01T00:00:00Z',
            },
            tapeCount: 2,
          },
        ],
      }
      queryStubs.mine.isLoading = false
      queryStubs.unread.data = { scenarioIds: ['s-owned-unread'] }
      queryStubs.unread.isLoading = false
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      expect(screen.getByLabelText(/new activity/i)).toBeInTheDocument()
    })

    it('mine query error shows Retry that refetches the mine query', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.mine.error = new Error('boom')
      queryStubs.mine.refetch = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      expect(screen.getByText(/could not load your scenarios/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /retry/i }))
      expect(queryStubs.mine.refetch).toHaveBeenCalledOnce()
      expect(queryStubs.public.refetch).not.toHaveBeenCalled()
    })
  })

  describe('Private tab — Invited bucket (5.4)', () => {
    it('shows skeleton under Invited heading while invited query is loading', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.mine.data = { scenarios: [] }
      queryStubs.mine.isLoading = false
      queryStubs.invited.isLoading = true
      const user = userEvent.setup()
      const { container } = renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      const privatePanel = screen.getByRole('tabpanel', { name: /private/i })
      const skeleton = privatePanel.querySelector('[aria-busy="true"]')
      expect(skeleton).not.toBeNull()
      expect(screen.getByRole('heading', { name: /^invited$/i })).toBeInTheDocument()
      expect(container.querySelectorAll('[aria-busy="true"]').length).toBeGreaterThanOrEqual(1)
    })

    it('shows Invited heading and empty copy when invited returns empty', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.invited.data = { scenarios: [] }
      queryStubs.invited.isLoading = false
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      expect(screen.getByRole('heading', { name: /^invited$/i })).toBeInTheDocument()
      expect(screen.getByText(/no scenarios have been shared with you yet/i)).toBeInTheDocument()
    })

    it('renders Invited heading and card link when one invited scenario exists', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.invited.data = {
        scenarios: [
          {
            scenario: {
              id: 's-invited',
              publicSlug: 'shared-board',
              name: 'Shared Board',
              isPublic: false,
              ownerId: 'u-other',
              createdAt: '2026-01-02T00:00:00Z',
            },
            tapeCount: 1,
          },
        ],
      }
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      expect(screen.getByRole('heading', { name: /^invited$/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /shared board/i })).toHaveAttribute(
        'href',
        '/s/shared-board',
      )
    })

    it('invited query error shows Retry that refetches only the invited query', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.invited.error = new Error('invite-boom')
      queryStubs.invited.refetch = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      expect(screen.getByText(/could not load your invited scenarios/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /retry/i }))
      expect(queryStubs.invited.refetch).toHaveBeenCalledOnce()
      expect(queryStubs.mine.refetch).not.toHaveBeenCalled()
      expect(queryStubs.public.refetch).not.toHaveBeenCalled()
    })
  })

  describe('Private tab — Following bucket (5.5)', () => {
    it('shows skeleton under Following heading while following query is loading', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.mine.data = { scenarios: [] }
      queryStubs.mine.isLoading = false
      queryStubs.invited.data = { scenarios: [] }
      queryStubs.invited.isLoading = false
      queryStubs.following.isLoading = true
      const user = userEvent.setup()
      const { container } = renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      const privatePanel = screen.getByRole('tabpanel', { name: /private/i })
      const skeleton = privatePanel.querySelector('[aria-busy="true"]')
      expect(skeleton).not.toBeNull()
      expect(screen.getByRole('heading', { name: /^following$/i })).toBeInTheDocument()
      expect(container.querySelectorAll('[aria-busy="true"]').length).toBeGreaterThanOrEqual(1)
    })

    it('shows Following bucket with empty message when following returns empty', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.following.data = { scenarios: [] }
      queryStubs.following.isLoading = false
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      expect(screen.getByRole('heading', { name: /^following$/i })).toBeInTheDocument()
      expect(
        screen.getByText(/you're not following any scenarios yet/i),
      ).toBeInTheDocument()
    })

    it('renders Following heading and card link when one followed scenario exists', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.following.data = {
        scenarios: [
          {
            scenario: {
              id: 's-follow',
              publicSlug: 'followed-board',
              name: 'Followed Board',
              isPublic: true,
              ownerId: 'u-other',
              createdAt: '2026-01-03T00:00:00Z',
            },
            tapeCount: 0,
          },
        ],
      }
      queryStubs.following.isLoading = false
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      expect(screen.getByRole('heading', { name: /^following$/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /followed board/i })).toHaveAttribute(
        'href',
        '/s/followed-board',
      )
    })

    it('following query error shows Retry that refetches only the following query', async () => {
      authStub.state.user = { id: 'u1', email: 'me@example.com' } as User
      queryStubs.following.error = new Error('follow-boom')
      queryStubs.following.refetch = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('tab', { name: /private/i }))

      expect(screen.getByText(/could not load followed scenarios/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /retry/i }))
      expect(queryStubs.following.refetch).toHaveBeenCalledOnce()
      expect(queryStubs.mine.refetch).not.toHaveBeenCalled()
      expect(queryStubs.invited.refetch).not.toHaveBeenCalled()
      expect(queryStubs.public.refetch).not.toHaveBeenCalled()
    })
  })

  describe('Public tab — feed states', () => {
    it('shows skeleton loading state while data is in flight', () => {
      queryStubs.public.isLoading = true

      const { container } = renderPage()
      const skeleton = container.querySelector('[aria-busy="true"]')
      expect(skeleton).not.toBeNull()
    })

    it('renders scenario cards when public data returns', () => {
      queryStubs.public.data = {
        scenarios: [
          {
            scenario: {
              id: 's1',
              publicSlug: 'slug-alpha',
              name: 'Alpha Scenario',
              isPublic: true,
              ownerId: 'u1',
              createdAt: '2026-01-01T00:00:00Z',
            },
            tapeCount: 3,
          },
        ],
      }

      renderPage()
      expect(screen.getByRole('list', { name: /scenario library/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /alpha scenario/i })).toHaveAttribute(
        'href',
        '/s/slug-alpha',
      )
    })

    it('uses visitor-neutral copy for public cards with zero tapes', () => {
      queryStubs.public.data = {
        scenarios: [
          {
            scenario: {
              id: 's1',
              publicSlug: 'slug-empty',
              name: 'Empty Board',
              isPublic: true,
              ownerId: 'u1',
              createdAt: '2026-01-01T00:00:00Z',
            },
            tapeCount: 0,
          },
        ],
      }

      renderPage()
      expect(screen.getByText(/no tapes on this board yet/i)).toBeInTheDocument()
      expect(screen.queryByText(/quiet floor/i)).not.toBeInTheDocument()
    })

    it('shows on-brand empty message when no public scenarios exist', () => {
      queryStubs.public.data = { scenarios: [] }

      renderPage()
      expect(screen.getByText(/no public scenarios yet/i)).toBeInTheDocument()
      expect(screen.queryByText(/create one to get started/i)).not.toBeInTheDocument()
    })

    it('shows inline error message and Retry button when fetch fails', () => {
      queryStubs.public.error = new Error('Network error')

      renderPage()
      expect(screen.getByText(/could not load public scenarios/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('retry button calls refetch', async () => {
      queryStubs.public.refetch = vi.fn().mockResolvedValue(undefined)
      queryStubs.public.error = new Error('Network error')

      const user = userEvent.setup()
      renderPage()
      await user.click(screen.getByRole('button', { name: /retry/i }))
      expect(queryStubs.public.refetch).toHaveBeenCalledOnce()
    })
  })
})
