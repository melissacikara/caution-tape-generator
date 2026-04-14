import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ScenarioSummaryItem } from '../api/types'
import { ScenarioLibrary } from './ScenarioLibrary'

function renderLibrary(props: React.ComponentProps<typeof ScenarioLibrary>) {
  return render(
    <MemoryRouter>
      <ScenarioLibrary {...props} />
    </MemoryRouter>,
  )
}

const sampleItems: ScenarioSummaryItem[] = [
  {
    scenario: {
      id: 's1',
      publicSlug: 'slug-1',
      name: 'Scenario Alpha',
      isPublic: false,
      ownerId: 'u1',
      createdAt: '2026-01-01T00:00:00Z',
    },
    tapeCount: 2,
  },
  {
    scenario: {
      id: 's2',
      publicSlug: 'slug-2',
      name: 'Scenario Beta',
      isPublic: true,
      ownerId: 'u2',
      createdAt: '2026-01-02T00:00:00Z',
    },
    tapeCount: 0,
  },
]

describe('ScenarioLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('populated state', () => {
    it('renders a list with mobile-first grid: grid-cols-1 → sm:grid-cols-2', () => {
      renderLibrary({ items: sampleItems, isLoading: false })
      const list = screen.getByRole('list', { name: /scenario library/i })
      expect(list.className).toContain('grid-cols-1')
      expect(list.className).toContain('sm:grid-cols-2')
    })

    it('renders scenario cards as links with correct hrefs', () => {
      renderLibrary({ items: sampleItems, isLoading: false })
      expect(screen.getByRole('link', { name: /scenario alpha/i })).toHaveAttribute(
        'href',
        '/s/slug-1',
      )
      expect(screen.getByRole('link', { name: /scenario beta/i })).toHaveAttribute(
        'href',
        '/s/slug-2',
      )
    })

    it('card links include min-h-[44px] for tap target compliance', () => {
      renderLibrary({ items: sampleItems, isLoading: false })
      const link = screen.getByRole('link', { name: /scenario alpha/i })
      expect(link.className).toContain('min-h-[44px]')
    })

    it('displays tape count text for each card', () => {
      renderLibrary({ items: sampleItems, isLoading: false })
      expect(screen.getByText(/2 tapes stacked/i)).toBeInTheDocument()
      expect(screen.getByText(/quiet floor/i)).toBeInTheDocument()
    })

    it('uses zeroTapeCaption for zero-tape cards when provided', () => {
      renderLibrary({
        items: sampleItems,
        isLoading: false,
        zeroTapeCaption: 'No tapes on this board yet.',
      })
      expect(screen.getByText(/no tapes on this board yet/i)).toBeInTheDocument()
      expect(screen.queryByText(/quiet floor/i)).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('renders skeleton grid with grid-cols-1 sm:grid-cols-2 (same mobile-first layout)', () => {
      const { container } = renderLibrary({ items: [], isLoading: true })
      const grid = container.querySelector('[aria-busy="true"]')
      expect(grid).not.toBeNull()
      expect(grid!.className).toContain('grid-cols-1')
      expect(grid!.className).toContain('sm:grid-cols-2')
    })
  })

  describe('error state', () => {
    it('renders the error message', () => {
      renderLibrary({ items: [], isLoading: false, errorMessage: 'Failed to load scenarios' })
      expect(screen.getByText('Failed to load scenarios')).toBeInTheDocument()
    })

    it('renders a retry button when onRetry is provided', () => {
      renderLibrary({
        items: [],
        isLoading: false,
        errorMessage: 'Failed',
        onRetry: vi.fn(),
      })
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('calls onRetry when the retry button is clicked', async () => {
      const onRetry = vi.fn()
      const user = userEvent.setup()
      renderLibrary({ items: [], isLoading: false, errorMessage: 'Failed', onRetry })
      await user.click(screen.getByRole('button', { name: /retry/i }))
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('retry button meets tap target min-h-[44px]', () => {
      renderLibrary({
        items: [],
        isLoading: false,
        errorMessage: 'Failed',
        onRetry: vi.fn(),
      })
      expect(screen.getByRole('button', { name: /retry/i }).className).toContain('min-h-[44px]')
    })
  })

  describe('empty state', () => {
    it('renders an empty state message', () => {
      renderLibrary({ items: [], isLoading: false })
      expect(screen.getByText(/no scenarios found/i)).toBeInTheDocument()
    })
  })
})
