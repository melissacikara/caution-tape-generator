import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { ApiError, createScenario, isSupabaseConfigured, listScenarios } from '../api/client'
import { scenarioKeys } from '../api/queryKeys'
import { ScenarioLibrary } from '../components/ScenarioLibrary'
import { getKnownScenarioSlugs, rememberScenarioSlug } from '../lib/knownScenarios'
import { TapeCreatorPanel } from '../tape'

export function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const configured = isSupabaseConfigured()
  const [knownSlugs, setKnownSlugs] = useState(() => getKnownScenarioSlugs())
  const [view, setView] = useState<'library' | 'create'>(() =>
    getKnownScenarioSlugs().length > 0 ? 'library' : 'create',
  )
  const [scenarioName, setScenarioName] = useState('Untitled scenario')
  const [lockedForScenario, setLockedForScenario] = useState<{
    text: string
    color: string
  } | null>(null)

  const listSortedKey = [...knownSlugs].sort().join(',')

  const listQuery = useQuery({
    queryKey: scenarioKeys.list(listSortedKey),
    queryFn: () => listScenarios(knownSlugs),
    enabled: configured && knownSlugs.length > 0 && view === 'library',
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!lockedForScenario) throw new Error('No tape')
      return createScenario({
        name: scenarioName.trim() || 'Untitled scenario',
        firstTape: {
          tapeText: lockedForScenario.text,
          color: lockedForScenario.color,
        },
      })
    },
    onSuccess: (data) => {
      rememberScenarioSlug(data.scenario.publicSlug)
      setKnownSlugs(getKnownScenarioSlugs())
      void queryClient.invalidateQueries({ queryKey: scenarioKeys.all })
      navigate(`/s/${data.scenario.publicSlug}`)
    },
  })

  const errMsg =
    createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error?.message

  const listErr =
    listQuery.error instanceof ApiError
      ? listQuery.error.message
      : listQuery.error?.message

  const hasKnownScenarios = knownSlugs.length > 0
  const showLibraryGrid = hasKnownScenarios && view === 'library'
  const showCreateFlow = !hasKnownScenarios || view === 'create'
  const showCreateSubHeader = hasKnownScenarios && view === 'create'

  return (
    <main className="flex justify-center px-4 py-8">
      <div className="w-full max-w-[480px] md:max-w-[640px]">
        {showLibraryGrid ? (
          <section aria-labelledby="library-heading" className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1
                  id="library-heading"
                  className="font-display text-2xl uppercase tracking-wide text-foreground"
                >
                  Your scenarios
                </h1>
                <p className="mt-1 font-ui text-xs text-muted">
                  Pick a board or start a fresh warning run.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView('create')}
                className="min-h-[44px] shrink-0 bg-accent px-4 py-2 font-ui text-sm font-semibold uppercase tracking-wide text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                New scenario
              </button>
            </div>

            <ScenarioLibrary
              items={listQuery.data?.scenarios ?? []}
              isLoading={listQuery.isPending}
              errorMessage={listQuery.isError ? listErr : undefined}
              onRetry={() => void listQuery.refetch()}
            />
          </section>
        ) : null}

        {showCreateFlow ? (
          <div className={showCreateSubHeader ? 'mt-10 border-t border-border pt-10' : ''}>
            {showCreateSubHeader ? (
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-ui text-sm font-medium uppercase tracking-wide text-foreground">
                  New scenario
                </h2>
                <button
                  type="button"
                  onClick={() => setView('library')}
                  className="font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  ← All scenarios
                </button>
              </div>
            ) : null}

            <TapeCreatorPanel onLockedTapeChange={setLockedForScenario} />

            {lockedForScenario ? (
              <section
                className="mt-10 border border-border bg-surface-raised p-4"
                aria-labelledby="add-to-scenario-heading"
              >
                <h2
                  id="add-to-scenario-heading"
                  className="font-ui text-sm font-medium uppercase tracking-wide text-foreground"
                >
                  Add to scenario
                </h2>
                <p className="mt-1 font-ui text-xs text-muted">
                  Name your scenario, then create it and open the shareable page.
                </p>
                <label className="mt-4 block font-ui text-xs text-muted" htmlFor="scenario-name">
                  Scenario name
                </label>
                <input
                  id="scenario-name"
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="mt-1 w-full border border-border bg-background px-3 py-2 font-ui text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
                  autoComplete="off"
                />
                <button
                  type="button"
                  disabled={!configured || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                  className="mt-4 min-h-[44px] w-full bg-accent px-4 py-3 font-ui text-sm font-medium text-accent-text transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create scenario & open'}
                </button>
                {errMsg ? (
                  <p className="mt-2 font-ui text-xs text-red-400" role="alert">
                    {errMsg}
                  </p>
                ) : null}
                {!configured ? (
                  <p className="mt-2 font-ui text-xs text-muted">
                    Configure Supabase env vars to enable creation.
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  )
}
