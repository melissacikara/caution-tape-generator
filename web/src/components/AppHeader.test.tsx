import type { User } from '@supabase/supabase-js'
import { render, screen, within } from '@testing-library/react'
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

async function openMobileMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /open menu/i }))
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

  it('logo link uses flex-1 min-w-0 truncate for narrow viewports', () => {
    renderHeader()
    const logo = screen.getByRole('link', { name: /caution tape generator/i })
    expect(logo.className).toContain('flex-1')
    expect(logo.className).toContain('min-w-0')
    expect(logo.className).toContain('truncate')
  })

  it('desktop nav carries gap-3 md:gap-5', () => {
    renderHeader()
    const desktopNav = screen.getByTestId('header-desktop-nav')
    expect(desktopNav.className).toContain('gap-3')
    expect(desktopNav.className).toContain('md:gap-5')
  })

  it('renders mobile menu button', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('mobile panel lists Create, About, Library after opening menu', async () => {
    const user = userEvent.setup()
    renderHeader()
    expect(screen.queryByRole('region', { name: /site links/i })).not.toBeInTheDocument()
    await openMobileMenu(user)
    const region = screen.getByRole('region', { name: /site links/i })
    expect(region).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: /^create$/i }).some((el) => region.contains(el)),
    ).toBe(true)
    expect(
      screen.getAllByRole('link', { name: /^about$/i }).some((el) => region.contains(el)),
    ).toBe(true)
    expect(
      screen.getAllByRole('link', { name: /^library$/i }).some((el) => region.contains(el)),
    ).toBe(true)
  })

  it('renders desktop Create link (hidden sm:flex row)', () => {
    renderHeader()
    const desktopNav = screen.getByTestId('header-desktop-nav')
    const create = desktopNav.querySelector('a[href="/"]')
    expect(create?.textContent).toMatch(/^create$/i)
  })

  it('renders the Library nav link on desktop', () => {
    renderHeader()
    const desktopNav = screen.getByTestId('header-desktop-nav')
    const lib = Array.from(desktopNav?.querySelectorAll('a') ?? []).find((a) =>
      /library/i.test(a.textContent ?? ''),
    )
    expect(lib).toHaveAttribute('href', '/library')
  })

  it('shows Log in on desktop and in mobile menu when not signed in', async () => {
    const user = userEvent.setup()
    renderHeader()
    const desktopNav = screen.getByTestId('header-desktop-nav')
    expect(desktopNav?.querySelector('button')?.textContent).toMatch(/log in/i)
    await openMobileMenu(user)
    expect(screen.getAllByRole('button', { name: /log in/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('opens login modal when Log in is clicked (desktop)', async () => {
    const user = userEvent.setup()
    renderHeader()
    const desktopNav = screen.getByTestId('header-desktop-nav')
    const logIn = desktopNav?.querySelector('button')
    expect(logIn).toBeTruthy()
    await user.click(logIn as HTMLButtonElement)
    expect(screen.getByRole('dialog', { name: /login/i })).toBeInTheDocument()
  })

  it('opens login modal when mobile menu Log in is clicked', async () => {
    const user = userEvent.setup()
    renderHeader()
    await openMobileMenu(user)
    const panel = screen.getByRole('region', { name: /site links/i })
    await user.click(within(panel).getByRole('button', { name: /^log in$/i }))
    expect(screen.getByRole('dialog', { name: /login/i })).toBeInTheDocument()
  })

  it('when signed in: shows truncated email (with title) and Sign out on desktop, hides Log in', () => {
    const email = 'verylongaddress@example.com'
    authStub.state.user = { id: 'u1', email } as User
    renderHeader()
    expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument()
    const desktopNav = screen.getByTestId('header-desktop-nav')
    const signOut = desktopNav?.querySelector('button')
    expect(signOut?.textContent).toMatch(/sign out/i)
    const label = screen.getByTitle(email)
    expect(label).toBeInTheDocument()
    expect(label.textContent).toContain('@')
    expect(label.className).toContain('truncate')
    expect(label.className).toContain('max-w-[120px]')
  })

  it('when signed in: Sign out invokes auth signOut', async () => {
    const user = userEvent.setup()
    authStub.state.user = { id: 'u1', email: 'a@b.co' } as User
    renderHeader()
    const desktopNav = screen.getByTestId('header-desktop-nav')
    const signOutBtn = Array.from(desktopNav.querySelectorAll('button')).find((b) =>
      /sign out/i.test(b.textContent ?? ''),
    )
    expect(signOutBtn).toBeTruthy()
    await user.click(signOutBtn as HTMLButtonElement)
    expect(authStub.signOut).toHaveBeenCalledOnce()
  })
})
