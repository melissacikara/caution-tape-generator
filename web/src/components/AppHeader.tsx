import { Link } from 'react-router'

/**
 * UX-DR6: slim header — wordmark (Bebas / accent) left, Library link right.
 * Library points to `/` (adaptive home: library grid when this device has known scenarios).
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-[52px] w-full max-w-[480px] items-center justify-between gap-4 px-4 md:max-w-[640px] md:px-6">
        <Link
          to="/"
          className="font-display text-base uppercase tracking-[0.12em] text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          ⚠ Caution Tape Gen
        </Link>
        <nav aria-label="Main">
          <Link
            to="/"
            className="font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Library
          </Link>
        </nav>
      </div>
    </header>
  )
}
