import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { startTransition, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { ApiError, addTape, createScenario, isSupabaseConfigured, listScenarios } from '../api/client'
import { scenarioKeys } from '../api/queryKeys'
import { LoginModal } from '../components/LoginModal'
import { ScenarioLibrary } from '../components/ScenarioLibrary'
import { useLoginGate } from '../hooks/useLoginGate'
import { getKnownScenarioSlugs, rememberScenarioSlug } from '../lib/knownScenarios'
import { useAuth } from '../providers/AuthProvider'
import { TapeCreatorPanel } from '../tape'

type HomeLocationState = { library?: boolean; home?: boolean }

export function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const configured = isSupabaseConfigured()
  const { user } = useAuth()
  const { isLoginGateOpen, openLoginGate, closeLoginGate } = useLoginGate()
  const formId = useId()
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
  /**
   * Stable idempotency key for the "add to existing scenario" flow.
   * Generated when lockedForScenario first becomes non-null and held stable so that
   * user retries after a network failure reuse the same key — preventing duplicate tapes (4.3).
   * Reset to null on success (new add session needs a fresh key) or when tape is cleared.
   * Also rotated when the target scenario changes (same tape, different destination = new session).
   */
  const [addExistingIdempotencyKey, setAddExistingIdempotencyKey] = useState<string | null>(null)
  const prevLockedRef = useRef<{ text: string; color: string } | null>(null)
  /** When you already have scenarios on this device: add locked tape to one of them vs create new. */
  const [tapeDestination, setTapeDestination] = useState<'new' | 'existing'>('new')
  const [selectedSlug, setSelectedSlug] = useState('')

  /** Generate a fresh idempotency key when a tape is locked; clear it when unlocked. */
  useEffect(() => {
    const prev = prevLockedRef.current
    const textChanged = lockedForScenario?.text !== prev?.text
    const colorChanged = lockedForScenario?.color !== prev?.color
    prevLockedRef.current = lockedForScenario

    if (!lockedForScenario) {
      setAddExistingIdempotencyKey(null)
    } else if (!prev || textChanged || colorChanged) {
      // New tape or tape content changed → new add session → new key
      setAddExistingIdempotencyKey(crypto.randomUUID())
    }
    // If lockedForScenario is the same object reference (no content change), keep existing key
  }, [lockedForScenario])

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

  /** Rotate the key when the target scenario changes — same tape, new destination = new add session. */
  useEffect(() => {
    setAddExistingIdempotencyKey((prev) => (prev !== null ? crypto.randomUUID() : null))
  }, [existingSelectValue])

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
      setAddExistingIdempotencyKey(null)
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
    <>
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
                    <label className="block font-ui text-xs text-muted" htmlFor={`${formId}-scenario-name`}>
                      Scenario name
                    </label>
                    <input
                      id={`${formId}-scenario-name`}
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
                      onClick={() => {
                        if (user === null) {
                          openLoginGate()
                          return
                        }
                        createMutation.mutate()
                      }}
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
                    <label className="block font-ui text-xs text-muted" htmlFor={`${formId}-existing-scenario`}>
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
                          id={`${formId}-existing-scenario`}
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
                            !addExistingIdempotencyKey ||
                            addExistingMutation.isPending ||
                            (listQuery.data?.scenarios?.length ?? 0) === 0
                          }
                          onClick={() => {
                            if (user === null) {
                              openLoginGate()
                              return
                            }
                            if (!addExistingIdempotencyKey) return
                            addExistingMutation.mutate({
                              scenarioSlug: existingSelectValue,
                              idempotencyKey: addExistingIdempotencyKey,
                            })
                          }}
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
    {isLoginGateOpen ? <LoginModal onClose={closeLoginGate} /> : null}
    </>
  )
}
