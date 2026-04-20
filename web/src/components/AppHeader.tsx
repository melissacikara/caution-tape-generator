import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { LoginModal } from './LoginModal'
import { useAuth } from '../providers/useAuth'

const navLinkClass =
  'font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background'

const mobileItemClass =
  'block w-full border-b border-border px-4 py-3 text-left font-ui text-sm text-foreground transition-colors last:border-b-0 hover:bg-surface-raised focus-visible:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent'

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </>
      )}
    </svg>
  )
}

/**
 * UX-DR6: slim header — wordmark (Bebas / accent) left, nav right.
 * Mobile: nav links in a menu button. sm+: inline links.
 */
export function AppHeader() {
  const { user, loading, signOut } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      const el = mobileMenuRef.current
      if (el && !el.contains(e.target as Node)) setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [mobileMenuOpen])

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="mx-auto flex h-[52px] w-full max-w-[480px] items-center justify-between gap-3 px-4 md:max-w-[640px] md:px-6">
          <Link
            to="/"
            className="min-w-0 flex-1 truncate font-display text-base uppercase tracking-[0.12em] text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={closeMobileMenu}
          >
            ⚠ Caution Tape Generator
          </Link>

          <nav aria-label="Main" className="flex shrink-0 items-center">
            {/* Mobile: menu */}
            <div ref={mobileMenuRef} className="relative sm:hidden">
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-expanded={mobileMenuOpen}
                aria-haspopup="true"
                aria-controls="header-mobile-menu"
                onClick={() => setMobileMenuOpen((o) => !o)}
              >
                <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                <MenuIcon open={mobileMenuOpen} />
              </button>

              {mobileMenuOpen ? (
                <div
                  id="header-mobile-menu"
                  role="region"
                  aria-label="Site links"
                  className="absolute right-0 top-[calc(100%+4px)] z-[60] min-w-[220px] rounded border border-border bg-surface py-1 shadow-lg"
                >
                  <Link to="/" className={mobileItemClass} onClick={closeMobileMenu}>
                    Create
                  </Link>
                  <Link to="/about" className={mobileItemClass} onClick={closeMobileMenu}>
                    About
                  </Link>
                  <Link to="/library" className={mobileItemClass} onClick={closeMobileMenu}>
                    Library
                  </Link>

                  {!loading && user === null ? (
                    <button
                      type="button"
                      className={`${mobileItemClass} cursor-pointer border-t border-border`}
                      onClick={() => {
                        closeMobileMenu()
                        setLoginOpen(true)
                      }}
                    >
                      Log in
                    </button>
                  ) : null}

                  {!loading && user !== null ? (
                    <>
                      <div className="border-t border-border px-4 py-2 font-ui text-xs text-muted">
                        <span className="block truncate" title={user.email ?? undefined}>
                          {user.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`${mobileItemClass} cursor-pointer`}
                        onClick={() => {
                          closeMobileMenu()
                          void signOut()
                        }}
                      >
                        Sign out
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Desktop: inline links */}
            <div
              data-testid="header-desktop-nav"
              className="hidden sm:flex sm:items-center gap-3 md:gap-5"
            >
              <Link to="/" className={navLinkClass}>
                Create
              </Link>
              <Link to="/about" className={navLinkClass}>
                About
              </Link>
              <Link to="/library" className={navLinkClass}>
                Library
              </Link>

              {!loading && user === null ? (
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className={`cursor-pointer ${navLinkClass}`}
                >
                  Log in
                </button>
              ) : null}

              {!loading && user !== null ? (
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="max-w-[120px] truncate font-ui text-xs text-muted"
                    title={user.email ?? undefined}
                  >
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className={`cursor-pointer ${navLinkClass}`}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </nav>
        </div>
      </header>

      {loginOpen ? <LoginModal onClose={() => setLoginOpen(false)} /> : null}
    </>
  )
}
