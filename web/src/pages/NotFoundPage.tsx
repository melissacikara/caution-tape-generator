import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <p className="font-display text-3xl uppercase tracking-wide text-accent">Not found</p>
      <p className="mt-2 max-w-sm text-center font-ui text-sm text-muted">
        That route does not exist. Head back to the creator or your library entry point.
      </p>
      <Link
        to="/"
        className="mt-8 min-h-[44px] border border-border px-6 py-3 font-ui text-sm text-foreground transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Back to home
      </Link>
    </main>
  )
}
