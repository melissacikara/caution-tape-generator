import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TapeRenderer } from './TapeRenderer'

describe('TapeRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('overflow behaviour', () => {
    it('uses overflow-x-auto on the outer container for long text (not overflow-hidden)', () => {
      const longText = 'A'.repeat(120)
      const { container } = render(
        <TapeRenderer text={longText} color="#FFD000" />,
      )
      const outer = container.firstChild as HTMLElement
      expect(outer.classList.contains('overflow-x-auto')).toBe(true)
      expect(outer.classList.contains('overflow-hidden')).toBe(false)
    })

    it('uses overflow-x-auto on the outer container for short text too', () => {
      const { container } = render(
        <TapeRenderer text="short" color="#FFD000" />,
      )
      const outer = container.firstChild as HTMLElement
      expect(outer.classList.contains('overflow-x-auto')).toBe(true)
      expect(outer.classList.contains('overflow-hidden')).toBe(false)
    })
  })

  describe('short text (regression guard)', () => {
    it('renders tape content for short text', () => {
      render(<TapeRenderer text="wet floor" color="#FFD000" />)
      expect(
        screen.getByRole('img', { name: /caution tape: caution: wet floor/i }),
      ).toBeInTheDocument()
    })

    it('repeats the warning text segment multiple times', () => {
      const { container } = render(
        <TapeRenderer text="test" color="#FFD000" />,
      )
      const spans = container.querySelectorAll('span.inline-block')
      expect(spans.length).toBeGreaterThan(1)
    })
  })

  describe('empty state', () => {
    it('renders the empty placeholder when text is empty', () => {
      render(<TapeRenderer text="" color="#FFD000" />)
      expect(
        screen.getByText(/preview appears here as you type/i),
      ).toBeInTheDocument()
    })

    it('renders the empty placeholder when state is explicitly empty', () => {
      render(<TapeRenderer text="some text" color="#FFD000" state="empty" />)
      expect(
        screen.getByText(/preview appears here as you type/i),
      ).toBeInTheDocument()
    })

    it('empty state does not render the tape img role', () => {
      render(<TapeRenderer text="" color="#FFD000" />)
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  describe('generated state', () => {
    it('renders with ring-2 ring-accent classes for generated state', () => {
      const { container } = render(
        <TapeRenderer text="danger zone" color="#FF6B00" state="generated" />,
      )
      const outer = container.firstChild as HTMLElement
      expect(outer.classList.contains('ring-2')).toBe(true)
      expect(outer.classList.contains('ring-accent')).toBe(true)
    })

    it('has accessible label including the text for generated state', () => {
      render(
        <TapeRenderer text="danger zone" color="#FF6B00" state="generated" />,
      )
      expect(
        screen.getByRole('img', {
          name: /generated caution tape: caution: danger zone/i,
        }),
      ).toBeInTheDocument()
    })
  })

  describe('className prop', () => {
    it('appends extra className to the outer container', () => {
      const { container } = render(
        <TapeRenderer text="test" color="#FFD000" className="my-custom-class" />,
      )
      const outer = container.firstChild as HTMLElement
      expect(outer.classList.contains('my-custom-class')).toBe(true)
    })
  })
})
