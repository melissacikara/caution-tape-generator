import { Link } from 'react-router'

import type { ScenarioSummaryItem } from '../api/types'

export type ScenarioLibraryProps = {
  items: ScenarioSummaryItem[]
  isLoading: boolean
  errorMessage?: string
  onRetry?: () => void
}

function provocativeLine(count: number): string {
  if (count === 0) return 'Quiet floor — add the first warning.'
  if (count === 1) return '1 tape on the board. Room for chaos.'
  return `${count} tapes stacked. Who stops first?`
}

export function ScenarioLibrary({
  items,
  isLoading,
  errorMessage,
  onRetry,
}: ScenarioLibraryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded border border-border bg-surface-raised" />
        ))}
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="border border-border bg-surface-raised p-4">
        <p className="font-ui text-sm text-muted">{errorMessage}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 min-h-[44px] border border-border px-4 font-ui text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Retry
          </button>
        ) : null}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className="font-ui text-sm text-muted">
        No scenarios found. Create one to get started.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Scenario library">
      {items.map(({ scenario, tapeCount }) => (
        <li key={scenario.id}>
          <Link
            to={`/s/${scenario.publicSlug}`}
            className="flex min-h-[44px] flex-col border border-border bg-surface-raised p-4 transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="font-display text-xl uppercase leading-tight tracking-wide text-foreground">
              {scenario.name}
            </span>
            <span className="mt-2 font-ui text-xs text-muted">{provocativeLine(tapeCount)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
