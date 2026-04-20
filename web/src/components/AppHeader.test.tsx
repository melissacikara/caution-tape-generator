import type { User } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppHeader } from './AppHeader'

const authStub = vi.hoisted(() => {
  const signOut = vi.fn()
  return {
    signOut,
    state: {
      user: null as User | null,
      session: null,
      loading: false,
    },
  }
})

vi.mock('../providers/useAuth', () => ({
  useAuth: () => ({
    user: authStub.state.user,
    session: authStub.state.session,
    loading: authStub.state.loading,
    signOut: authStub.signOut,
  }),
}))

vi.mock('./LoginModal', () => ({
  LoginModal: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Login">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

function renderHeader() {
  return render(
    <MemoryRouter>
      <AppHeader />
    </MemoryRouter>,
  )
}

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStub.state.user = null
    authStub.state.session = null
    authStub.state.loading = false
  })

  it('renders the logo link pointing to /', () => {
    renderHeader()
    const logo = screen.getByRole('link', { name: /caution tape generator/i })
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('href', '/')
  })

  it('renders the Create nav link pointing to /', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: /^create$/i })).toHaveAttribute('href', '/')
  })

  it('logo link carries responsive flex classes (flex-1 min-w-0 truncate) to prevent narrow-viewport overflow', () => {
    renderHeader()
    const logo = screen.getByRole('link', { name: /caution tape generator/i })
    expect(logo.className).toContain('flex-1')
    expect(logo.className).toContain('min-w-0')
    expect(logo.className).toContain('truncate')
  })

  it('nav element carries shrink-0 so all nav items stay visible on narrow viewports', () => {
    renderHeader()
    const nav = screen.getByRole('navigation', { name: /main/i })
    expect(nav.className).toContain('shrink-0')
  })

  it('nav has responsive gap: gap-3 on mobile, md:gap-5 on desktop', () => {
    renderHeader()
    const nav = screen.getByRole('navigation', { name: /main/i })
    expect(nav.className).toContain('gap-3')
    expect(nav.className).toContain('md:gap-5')
  })

  it('renders the Library nav link pointing to /library', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: /library/i })).toHaveAttribute('href', '/library')
  })

  it('renders the About nav link', () => {
    renderHeader()
    expect(screen.getAllByRole('link', { name: /about/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('shows Log in button when user is not signed in', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('opens login modal when Log in is clicked', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByRole('button', { name: /log in/i }))
    expect(screen.getByRole('dialog', { name: /login/i })).toBeInTheDocument()
  })

  it('when signed in: shows truncated email (with title) and Sign out, hides Log in', () => {
    const email = 'verylongaddress@example.com'
    authStub.state.user = { id: 'u1', email } as User
    renderHeader()
    expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    const label = screen.getByTitle(email)
    expect(label).toBeInTheDocument()
    expect(label.textContent).toContain('@')
    expect(label.className).toContain('truncate')
    expect(label.className).toContain('max-w-[120px]')
  })

  it('when signed in: nav keeps shrink-0 and responsive gap for primary links', () => {
    authStub.state.user = { id: 'u1', email: 'a@b.co' } as User
    renderHeader()
    const nav = screen.getByRole('navigation', { name: /main/i })
    expect(nav.className).toContain('shrink-0')
    expect(nav.className).toContain('gap-3')
    expect(nav.className).toContain('md:gap-5')
  })

  it('when signed in: Sign out invokes auth signOut', async () => {
    const user = userEvent.setup()
    authStub.state.user = { id: 'u1', email: 'a@b.co' } as User
    renderHeader()
    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(authStub.signOut).toHaveBeenCalledOnce()
  })
})
