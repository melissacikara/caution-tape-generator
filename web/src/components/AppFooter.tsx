import { Link } from 'react-router'

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex min-h-[48px] w-full max-w-[480px] items-center justify-center px-4 py-3 md:max-w-[640px] md:px-6">
        <Link
          to="/about#reporting"
          className="cursor-pointer font-ui text-xs text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Report a tape or scenario
        </Link>
      </div>
    </footer>
  )
}
