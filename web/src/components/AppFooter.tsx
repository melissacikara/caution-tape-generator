const BUY_ME_COFFEE_URL = 'https://buymeacoffee.com/cautiontape'

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex h-[48px] w-full max-w-[480px] items-center justify-center gap-6 px-4 md:max-w-[640px] md:px-6">
        <a
          href={BUY_ME_COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-ui text-xs text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          ☕ Buy me a coffee
        </a>
      </div>
    </footer>
  )
}
