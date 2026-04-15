import type { ReactNode } from 'react'
import { Link } from 'react-router'

import type { ScenarioSummaryItem } from '../api/types'

export type ScenarioLibraryProps = {
  items: ScenarioSummaryItem[]
  isLoading: boolean
  errorMessage?: string
  onRetry?: () => void
  emptyMessage?: ReactNode
  /** When set (e.g. community feed), replaces the default zero-tape line aimed at creators. */
  zeroTapeCaption?: string
  /** Scenario IDs with unread activity (Epic 7 quiet badge); omit on feeds where badges are not shown. */
  unreadScenarioIds?: ReadonlySet<string>
}

function provocativeLine(count: number, zeroTapeCaption?: string): string {
  if (count === 0) {
    return zeroTapeCaption ?? 'Quiet floor — add the first warning.'
  }
  if (count === 1) return '1 tape on the board. Room for chaos.'
  return `${count} tapes stacked. Who stops first?`
}

export function ScenarioLibrary({
  items,
  isLoading,
  errorMessage,
  onRetry,
  emptyMessage = 'No scenarios found. Create one to get started.',
  zeroTapeCaption,
  unreadScenarioIds,
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
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Scenario library">
      {items.map(({ scenario, tapeCount }) => (
        <li key={scenario.id}>
          <Link
            to={`/s/${scenario.publicSlug}`}
            className="relative flex min-h-[44px] flex-col border border-border bg-surface-raised p-4 pr-8 transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {unreadScenarioIds?.has(scenario.id) ? (
              <span
                className="absolute right-3 top-3 h-2.5 w-2.5 shrink-0 rounded-full bg-accent ring-2 ring-surface-raised"
                aria-label="New activity"
              />
            ) : null}
            <span className="font-display text-xl uppercase leading-tight tracking-wide text-foreground">
              {scenario.name}
            </span>
            <span className="mt-2 font-ui text-xs text-muted">
              {provocativeLine(tapeCount, zeroTapeCaption)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
