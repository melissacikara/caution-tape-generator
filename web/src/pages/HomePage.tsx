import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { ApiError, addTape, createScenario, isSupabaseConfigured, listScenarios } from '../api/client'
import { scenarioKeys } from '../api/queryKeys'
import { ScenarioLibrary } from '../components/ScenarioLibrary'
import { getKnownScenarioSlugs, rememberScenarioSlug } from '../lib/knownScenarios'
import { TapeCreatorPanel } from '../tape'

type HomeLocationState = { library?: boolean; home?: boolean }

export function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const configured = isSupabaseConfigured()
  const [knownSlugs, setKnownSlugs] = useState(() => getKnownScenarioSlugs())
  const [view, setView] = useState<'library' | 'create'>('create')

  /** Header navigation: logo → tape creator; Library → grid (when this device knows scenarios). */
  useEffect(() => {
    const st = location.state as HomeLocationState | null
    if (!st?.home && !st?.library) return
    startTransition(() => {
      if (st.home) {
        setView('create')
      } else if (st.library && getKnownScenarioSlugs().length > 0) {
        setView('library')
      }
      navigate(location.pathname, { replace: true, state: {} })
    })
  }, [location.state, location.pathname, navigate])

  const [scenarioName, setScenarioName] = useState('')
  const [lockedForScenario, setLockedForScenario] = useState<{
    text: string
    color: string
  } | null>(null)
  /** When you already have scenarios on this device: add locked tape to one of them vs create new. */
  const [tapeDestination, setTapeDestination] = useState<'new' | 'existing'>('new')
  const [selectedSlug, setSelectedSlug] = useState('')

  const handleLockedTapeChange = useCallback(
    (tape: { text: string; color: string } | null) => {
      setLockedForScenario(tape)
      if (!tape) setTapeDestination('new')
    },
    [],
  )

  const listSortedKey = [...knownSlugs].sort().join(',')

  const listQuery = useQuery({
    queryKey: scenarioKeys.list(listSortedKey),
    queryFn: () => listScenarios(knownSlugs),
    enabled:
      configured &&
      knownSlugs.length > 0 &&
      (view === 'library' || (view === 'create' && lockedForScenario !== null)),
  })

  const scenarioRows = listQuery.data?.scenarios
  const existingSelectValue = useMemo(() => {
    const rows = scenarioRows ?? []
    if (selectedSlug && rows.some((r) => r.scenario.publicSlug === selectedSlug)) {
      return selectedSlug
    }
    return rows[0]?.scenario.publicSlug ?? ''
  }, [scenarioRows, selectedSlug])

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

  const addExistingMutation = useMutation({
    mutationFn: async ({
      scenarioSlug,
      idempotencyKey,
    }: {
      scenarioSlug: string
      idempotencyKey: string
    }) => {
      if (!lockedForScenario) throw new Error('No tape')
      return addTape({
        scenarioSlug,
        tapeText: lockedForScenario.text,
        color: lockedForScenario.color,
        idempotencyKey,
      })
    },
    onSuccess: (_, { scenarioSlug }) => {
      rememberScenarioSlug(scenarioSlug)
      setKnownSlugs(getKnownScenarioSlugs())
      void queryClient.invalidateQueries({ queryKey: scenarioKeys.all })
      navigate(`/s/${scenarioSlug}`)
    },
  })

  const errMsg =
    createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error?.message

  const addExistingErr =
    addExistingMutation.error instanceof ApiError
      ? addExistingMutation.error.message
      : addExistingMutation.error?.message

  const listErr =
    listQuery.error instanceof ApiError
      ? listQuery.error.message
      : listQuery.error?.message

  const hasKnownScenarios = knownSlugs.length > 0
  const showLibraryGrid = hasKnownScenarios && view === 'library'
  const showCreateFlow = !hasKnownScenarios || view === 'create'
  const showNewPath = !hasKnownScenarios || tapeDestination === 'new'
  const showExistingPath = hasKnownScenarios && tapeDestination === 'existing'

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
          <div>
            <TapeCreatorPanel onLockedTapeChange={handleLockedTapeChange} />

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
                  {hasKnownScenarios
                    ? 'Create a new board or add this tape to one you already have.'
                    : 'Name your scenario, then create it and open the shareable page.'}
                </p>

                {hasKnownScenarios ? (
                  <fieldset className="mt-4 space-y-3">
                    <legend className="font-ui text-xs text-muted">Where should this tape go?</legend>
                    <label className="flex cursor-pointer items-start gap-3 font-ui text-sm text-foreground">
                      <input
                        type="radio"
                        name="tape-destination"
                        className="mt-1 accent-accent"
                        checked={tapeDestination === 'new'}
                        onChange={() => setTapeDestination('new')}
                      />
                      <span>Create a new scenario</span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 font-ui text-sm text-foreground">
                      <input
                        type="radio"
                        name="tape-destination"
                        className="mt-1 accent-accent"
                        checked={tapeDestination === 'existing'}
                        onChange={() => setTapeDestination('existing')}
                      />
                      <span>Add to an existing scenario</span>
                    </label>
                  </fieldset>
                ) : null}

                {showNewPath ? (
                  <div className="mt-4">
                    <label className="block font-ui text-xs text-muted" htmlFor="scenario-name">
                      Scenario name
                    </label>
                    <input
                      id="scenario-name"
                      type="text"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      placeholder="Untitled scenario"
                      className="mt-1 w-full border border-border bg-background px-3 py-2 font-ui text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
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
                  </div>
                ) : null}

                {showExistingPath ? (
                  <div className="mt-4">
                    <label className="block font-ui text-xs text-muted" htmlFor="existing-scenario">
                      Scenario
                    </label>
                    {listQuery.isPending ? (
                      <p className="mt-2 font-ui text-xs text-muted">Loading your scenarios…</p>
                    ) : listQuery.isError ? (
                      <p className="mt-2 font-ui text-xs text-red-400" role="alert">
                        {listErr ?? 'Could not load scenarios.'}
                      </p>
                    ) : (
                      <>
                        <select
                          id="existing-scenario"
                          value={existingSelectValue}
                          onChange={(e) => setSelectedSlug(e.target.value)}
                          className="mt-1 w-full border border-border bg-background px-3 py-2 font-ui text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
                        >
                          {(scenarioRows ?? []).map(({ scenario }) => (
                            <option key={scenario.id} value={scenario.publicSlug}>
                              {scenario.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={
                            !configured ||
                            !existingSelectValue ||
                            addExistingMutation.isPending ||
                            (listQuery.data?.scenarios?.length ?? 0) === 0
                          }
                          onClick={() =>
                            addExistingMutation.mutate({
                              scenarioSlug: existingSelectValue,
                              idempotencyKey: crypto.randomUUID(),
                            })
                          }
                          className="mt-4 min-h-[44px] w-full bg-accent px-4 py-3 font-ui text-sm font-medium text-accent-text transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {addExistingMutation.isPending ? 'Adding…' : 'Add tape & open'}
                        </button>
                        {addExistingErr ? (
                          <p className="mt-2 font-ui text-xs text-red-400" role="alert">
                            {addExistingErr}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
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
