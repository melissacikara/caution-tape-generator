import { useState } from 'react'
import { Link } from 'react-router'

import { LoginModal } from './LoginModal'
import { useAuth } from '../providers/AuthProvider'

/**
 * UX-DR6: slim header — wordmark (Bebas / accent) left, nav right.
 * Wordmark and Create link go to /create; About stays on /about; / still redirects to /about.
 */
export function AppHeader() {
  const { user, loading, signOut } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="mx-auto flex h-[52px] w-full max-w-[480px] items-center justify-between gap-4 px-4 md:max-w-[640px] md:px-6">
          <Link
            to="/create"
            className="min-w-0 flex-1 truncate font-display text-base uppercase tracking-[0.12em] text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            ⚠ Caution Tape Generator
          </Link>
          <nav aria-label="Main" className="flex shrink-0 items-center gap-3 md:gap-5">
            <Link
              to="/create"
              className="font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Create
            </Link>
            <Link
              to="/about"
              className="font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              About
            </Link>
            <Link
              to="/library"
              className="font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Library
            </Link>

            {!loading && user === null ? (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="cursor-pointer font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Log in
              </button>
            ) : null}

            {!loading && user !== null ? (
              <div className="flex items-center gap-3">
                <span
                  className="max-w-[120px] truncate font-ui text-xs text-muted"
                  title={user.email ?? undefined}
                >
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="cursor-pointer font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </nav>
        </div>
      </header>

      {loginOpen ? <LoginModal onClose={() => setLoginOpen(false)} /> : null}
    </>
  )
}
