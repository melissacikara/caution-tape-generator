import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'

import { ApiError, addTape, getScenarioBySlug, isSupabaseConfigured } from '../api/client'
import { scenarioKeys } from '../api/queryKeys'
import type { GetScenarioResponse, TapeDto } from '../api/types'
import { rememberScenarioSlug } from '../lib/knownScenarios'
import { ColorPickerSwatch } from '../tape/ColorPickerSwatch'
import { TapeRenderer } from '../tape/TapeRenderer'

const DEFAULT_TAPE_COLOR = '#FFD000'

export function ScenarioPage() {
  const { slug } = useParams<{ slug: string }>()
  const queryClient = useQueryClient()
  const configured = isSupabaseConfigured()
  const formId = useId()
  const [addOpen, setAddOpen] = useState(false)
  const [newText, setNewText] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_TAPE_COLOR)

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !slug) return ''
    return `${window.location.origin}/s/${slug}`
  }, [slug])

  useEffect(() => {
    if (slug) rememberScenarioSlug(slug)
  }, [slug])

  const scenarioQuery = useQuery({
    queryKey: slug ? scenarioKeys.bySlug(slug) : ['scenarios', 'invalid'],
    queryFn: () => getScenarioBySlug(slug!),
    enabled: Boolean(slug) && configured,
  })

  const addMutation = useMutation({
    mutationFn: async (vars: { text: string; color: string; idempotencyKey: string }) => {
      if (!slug) throw new Error('Missing slug')
      return addTape({
        scenarioSlug: slug,
        tapeText: vars.text,
        color: vars.color,
        idempotencyKey: vars.idempotencyKey,
      })
    },
    onMutate: async (vars) => {
      if (!slug) return
      const key = scenarioKeys.bySlug(slug)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<GetScenarioResponse>(key)
      if (previous) {
        const optimistic: TapeDto = {
          id: `optimistic-${vars.idempotencyKey}`,
          scenarioId: previous.scenario.id,
          tapeText: vars.text,
          color: vars.color,
          createdAt: new Date().toISOString(),
        }
        queryClient.setQueryData<GetScenarioResponse>(key, {
          ...previous,
          tapes: [optimistic, ...previous.tapes],
        })
      }
      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (!slug) return
      if (ctx?.previous) {
        queryClient.setQueryData(scenarioKeys.bySlug(slug), ctx.previous)
      }
    },
    onSettled: () => {
      if (!slug) return
      void queryClient.invalidateQueries({ queryKey: scenarioKeys.bySlug(slug) })
      void queryClient.invalidateQueries({ queryKey: scenarioKeys.all })
    },
    onSuccess: () => {
      setNewText('')
      setNewColor(DEFAULT_TAPE_COLOR)
      setAddOpen(false)
    },
  })

  const copyShare = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // ignore
    }
  }, [shareUrl])

  const handleAddTape = () => {
    const t = newText.trim()
    if (t.length === 0 || !slug) return
    const idempotencyKey = crypto.randomUUID()
    addMutation.mutate({ text: t, color: newColor, idempotencyKey })
  }

  if (!slug) {
    return (
      <main className="px-4 py-8">
        <p className="font-ui text-sm text-muted">Invalid scenario link.</p>
      </main>
    )
  }

  if (!configured) {
    return (
      <main className="flex justify-center px-4 py-12">
        <p className="max-w-md text-center font-ui text-sm text-muted">
          Supabase is not configured. Set environment variables to load this scenario.
        </p>
      </main>
    )
  }

  if (scenarioQuery.isPending) {
    return (
      <main className="flex justify-center px-4 py-8">
        <div className="w-full max-w-[480px] space-y-4 md:max-w-[640px]">
          <div className="h-8 w-2/3 animate-pulse rounded bg-surface-raised" />
          <div className="h-24 w-full animate-pulse rounded bg-surface-raised" />
          <div className="h-24 w-full animate-pulse rounded bg-surface-raised" />
        </div>
      </main>
    )
  }

  if (scenarioQuery.isError) {
    const msg =
      scenarioQuery.error instanceof ApiError
        ? scenarioQuery.error.message
        : 'Could not load scenario.'
    return (
      <main className="flex flex-col items-center justify-center px-4 py-16">
        <p className="font-ui text-sm text-muted">{msg}</p>
        <button
          type="button"
          onClick={() => void scenarioQuery.refetch()}
          className="mt-4 min-h-[44px] border border-border px-4 py-2 font-ui text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Retry
        </button>
        <Link to="/" className="mt-6 font-ui text-sm text-accent underline-offset-4">
          ← All scenarios
        </Link>
      </main>
    )
  }

  const data = scenarioQuery.data
  if (!data) return null

  const { scenario, tapes } = data
  const addErr =
    addMutation.error instanceof ApiError
      ? addMutation.error.message
      : addMutation.error?.message

  return (
    <main className="flex justify-center px-4 pb-40 pt-8">
      <div className="w-full max-w-[480px] md:max-w-[640px]">
        <p className="mb-4">
          <Link
            to="/"
            className="font-ui text-sm text-muted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            ← All scenarios
          </Link>
        </p>
        <header className="border-b border-border pb-4">
          <h1 className="font-display text-2xl uppercase tracking-wide text-foreground">
            {scenario.name}
          </h1>
          <p className="mt-1 font-ui text-xs text-muted">
            {tapes.length} tape{tapes.length === 1 ? '' : 's'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="min-w-0 flex-1 border border-border bg-surface-raised px-2 py-1 font-mono text-xs text-muted"
              aria-label="Share URL"
            />
            <button
              type="button"
              onClick={() => void copyShare()}
              className="min-h-[36px] shrink-0 border border-border px-3 font-ui text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Copy link
            </button>
          </div>
        </header>

        <ul className="mt-8 flex flex-col gap-6" aria-label="Tape stack">
          {tapes.map((tape) => (
            <li key={tape.id}>
              <TapeRenderer
                text={tape.tapeText}
                color={tape.color}
                state="generated"
                className="max-h-32 overflow-y-auto"
              />
            </li>
          ))}
        </ul>

        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
        >
          {addOpen ? (
            <div className="mx-auto mb-3 w-full max-w-[480px] space-y-3 md:max-w-[640px]">
              <label className="block font-ui text-xs text-muted" htmlFor={`${formId}-new`}>
                New tape text
              </label>
              <textarea
                id={`${formId}-new`}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={3}
                className="w-full resize-y border border-border bg-surface-raised px-3 py-2 font-display text-lg uppercase tracking-wide text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-ui text-xs text-muted">Color</span>
                <ColorPickerSwatch value={newColor} onChange={setNewColor} aria-label="New tape color" />
              </div>
              {addErr ? (
                <p className="font-ui text-xs text-red-400" role="alert">
                  {addErr}. You can edit and retry.
                </p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={addMutation.isPending || newText.trim().length === 0}
                  onClick={handleAddTape}
                  className="min-h-[44px] flex-1 bg-accent px-4 py-2 font-ui text-sm font-medium text-accent-text disabled:opacity-50"
                >
                  {addMutation.isPending ? 'Adding…' : 'Add tape'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddOpen(false)
                    addMutation.reset()
                  }}
                  className="min-h-[44px] border border-border px-4 font-ui text-sm text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div className="mx-auto flex h-12 max-w-[480px] items-center justify-center md:max-w-[640px]">
            <button
              type="button"
              onClick={() => setAddOpen((o) => !o)}
              className="min-h-[44px] w-full max-w-sm bg-accent px-6 font-ui text-sm font-semibold uppercase tracking-wide text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-expanded={addOpen}
            >
              {addOpen ? 'Close' : 'Add tape'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
