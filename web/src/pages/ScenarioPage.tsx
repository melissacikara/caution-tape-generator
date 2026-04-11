import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import {
  ApiError,
  addTape,
  deleteScenario,
  deleteTape,
  getScenarioBySlug,
  isSupabaseConfigured,
  updateScenario,
  updateTape,
} from '../api/client'
import { scenarioKeys } from '../api/queryKeys'
import type { GetScenarioResponse, TapeDto } from '../api/types'
import { DeleteConfirmSheet } from '../components/DeleteConfirmSheet'
import { copyTextToClipboard } from '../lib/copyToClipboard'
import { forgetScenarioSlug, rememberScenarioSlug } from '../lib/knownScenarios'
import { ColorPickerSwatch } from '../tape/ColorPickerSwatch'
import { TapeRenderer } from '../tape/TapeRenderer'

function isPersistedTape(tape: TapeDto): boolean {
  return !tape.id.startsWith('optimistic-')
}

const DEFAULT_TAPE_COLOR = '#FFD000'

export function ScenarioPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const configured = isSupabaseConfigured()
  const formId = useId()
  const renameInputRef = useRef<HTMLInputElement>(null)
  const creatorTextRef = useRef<HTMLTextAreaElement>(null)
  const [addOpen, setAddOpen] = useState(false)
  /** Stable per “add tape” session so retries reuse the same server idempotency key. */
  const [addTapeIdempotencyKey, setAddTapeIdempotencyKey] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_TAPE_COLOR)
  const [editTape, setEditTape] = useState<TapeDto | null>(null)
  const [editText, setEditText] = useState('')
  const [editColor, setEditColor] = useState(DEFAULT_TAPE_COLOR)
  const [tapeToDelete, setTapeToDelete] = useState<TapeDto | null>(null)
  const [renamingScenario, setRenamingScenario] = useState(false)
  const [renameText, setRenameText] = useState('')
  const [confirmDeleteScenario, setConfirmDeleteScenario] = useState(false)

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !slug) return ''
    return `${window.location.origin}/s/${slug}`
  }, [slug])

  useEffect(() => {
    if (slug) rememberScenarioSlug(slug)
  }, [slug])

  /** Move focus into the creator textarea when add or edit panel opens. */
  useEffect(() => {
    if (!addOpen && !editTape) return
    const id = requestAnimationFrame(() => {
      creatorTextRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [addOpen, editTape])

  /** Move focus into the rename input when rename mode opens. */
  useEffect(() => {
    if (!renamingScenario) return
    const id = requestAnimationFrame(() => {
      renameInputRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [renamingScenario])

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
      setAddTapeIdempotencyKey(null)
      setAddOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (vars: { tapeId: string; text: string; color: string }) => {
      if (!slug) throw new Error('Missing slug')
      return updateTape({
        scenarioSlug: slug,
        tapeId: vars.tapeId,
        tapeText: vars.text,
        color: vars.color,
      })
    },
    onMutate: async (vars) => {
      if (!slug) return
      const key = scenarioKeys.bySlug(slug)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<GetScenarioResponse>(key)
      if (previous) {
        queryClient.setQueryData<GetScenarioResponse>(key, {
          ...previous,
          tapes: previous.tapes.map((t) =>
            t.id === vars.tapeId
              ? {
                  ...t,
                  tapeText: vars.text,
                  color: vars.color,
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
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
      setEditTape(null)
      setEditText('')
      setEditColor(DEFAULT_TAPE_COLOR)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (tapeId: string) => {
      if (!slug) throw new Error('Missing slug')
      return deleteTape({ scenarioSlug: slug, tapeId })
    },
    onMutate: async (tapeId) => {
      if (!slug) return
      const key = scenarioKeys.bySlug(slug)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<GetScenarioResponse>(key)
      if (previous) {
        queryClient.setQueryData<GetScenarioResponse>(key, {
          ...previous,
          tapes: previous.tapes.filter((t) => t.id !== tapeId),
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
      setTapeToDelete(null)
    },
  })

  const renameScenarioMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!slug) throw new Error('Missing slug')
      return updateScenario({ scenarioSlug: slug, name })
    },
    onMutate: async (name) => {
      if (!slug) return
      const key = scenarioKeys.bySlug(slug)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<GetScenarioResponse>(key)
      if (previous) {
        queryClient.setQueryData<GetScenarioResponse>(key, {
          ...previous,
          scenario: { ...previous.scenario, name },
        })
      }
      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (!slug) return
      if (ctx?.previous) {
        queryClient.setQueryData(scenarioKeys.bySlug(slug), ctx.previous)
        setRenameText(ctx.previous.scenario.name)
      }
    },
    onSettled: () => {
      if (!slug) return
      void queryClient.invalidateQueries({ queryKey: scenarioKeys.bySlug(slug) })
      void queryClient.invalidateQueries({ queryKey: scenarioKeys.all })
    },
    onSuccess: () => {
      setRenamingScenario(false)
      setRenameText('')
    },
  })

  const deleteScenarioMutation = useMutation({
    mutationFn: async () => {
      if (!slug) throw new Error('Missing slug')
      return deleteScenario({ scenarioSlug: slug })
    },
    onSuccess: () => {
      if (slug) forgetScenarioSlug(slug)
      void queryClient.invalidateQueries({ queryKey: scenarioKeys.all })
      navigate('/')
    },
  })

  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  const copyShare = useCallback(async () => {
    if (!shareUrl) return
    const ok = await copyTextToClipboard(shareUrl)
    setCopyStatus(ok ? 'copied' : 'failed')
    window.setTimeout(() => setCopyStatus('idle'), 2500)
  }, [shareUrl])

  const openRenameScenario = useCallback((currentName: string) => {
    setRenameText(currentName)
    setRenamingScenario(true)
    renameScenarioMutation.reset()
  }, [renameScenarioMutation])

  const closeRenameScenario = useCallback(() => {
    setRenamingScenario(false)
    setRenameText('')
    renameScenarioMutation.reset()
  }, [renameScenarioMutation])

  const handleSaveRename = () => {
    const t = renameText.trim()
    if (t.length === 0) return
    renameScenarioMutation.mutate(t)
  }

  const openAddPanel = useCallback(() => {
    setEditTape(null)
    setAddTapeIdempotencyKey(crypto.randomUUID())
    setAddOpen(true)
  }, [])

  const closeAddPanel = useCallback(() => {
    setAddOpen(false)
    setAddTapeIdempotencyKey(null)
    addMutation.reset()
  }, [addMutation])

  const openEditPanel = useCallback((tape: TapeDto) => {
    setAddOpen(false)
    setEditTape(tape)
    setEditText(tape.tapeText)
    setEditColor(tape.color)
  }, [])

  const closeEditPanel = useCallback(() => {
    setEditTape(null)
    setEditText('')
    setEditColor(DEFAULT_TAPE_COLOR)
    updateMutation.reset()
  }, [updateMutation])

  const handleAddTape = () => {
    const t = newText.trim()
    if (t.length === 0 || !slug || !addTapeIdempotencyKey) return
    addMutation.mutate({ text: t, color: newColor, idempotencyKey: addTapeIdempotencyKey })
  }

  const handleSaveEdit = () => {
    const t = editText.trim()
    if (t.length === 0 || !slug || !editTape) return
    updateMutation.mutate({ tapeId: editTape.id, text: t, color: editColor })
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

  const editErr =
    updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : updateMutation.error?.message

  const deleteErr =
    deleteMutation.error instanceof ApiError
      ? deleteMutation.error.message
      : deleteMutation.error?.message

  const renameErr =
    renameScenarioMutation.error instanceof ApiError
      ? renameScenarioMutation.error.message
      : renameScenarioMutation.error?.message

  const deleteScenarioErr =
    deleteScenarioMutation.error instanceof ApiError
      ? deleteScenarioMutation.error.message
      : deleteScenarioMutation.error?.message

  return (
    <main className="flex justify-center px-4 pb-40 pt-8">
      <div className="w-full max-w-[480px] md:max-w-[640px]">
        <header className="border-b border-border pb-4">
          {renamingScenario ? (
            <div className="space-y-2">
              <label className="block font-ui text-xs text-muted" htmlFor={`${formId}-rename`}>
                Scenario name
              </label>
              <input
                ref={renameInputRef}
                id={`${formId}-rename`}
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename()
                  if (e.key === 'Escape') closeRenameScenario()
                }}
                maxLength={500}
                className="w-full border border-border bg-surface-raised px-3 py-2 font-display text-xl uppercase tracking-wide text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
              {renameErr ? (
                <p className="font-ui text-xs text-red-400" role="alert">{renameErr}. Try again.</p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={renameScenarioMutation.isPending || renameText.trim().length === 0}
                  onClick={handleSaveRename}
                  className="min-h-[36px] bg-accent px-4 font-ui text-xs font-semibold uppercase tracking-wide text-accent-text disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {renameScenarioMutation.isPending ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={closeRenameScenario}
                  className="min-h-[36px] border border-border px-4 font-ui text-xs text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="font-display text-2xl uppercase tracking-wide text-foreground">
                {scenario.name}
              </h1>
              <div className="flex shrink-0 items-center gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => openRenameScenario(scenario.name)}
                  className="min-h-[28px] border border-border px-2 font-ui text-xs text-muted hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Edit scenario name"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteScenario(true)}
                  className="min-h-[28px] border border-border px-2 font-ui text-xs text-muted hover:border-red-700 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Delete scenario"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
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
              {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed' : 'Copy link'}
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
              />
              {isPersistedTape(tape) ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditPanel(tape)}
                    className="min-h-[44px] border border-border px-3 font-ui text-xs uppercase tracking-wide text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setTapeToDelete(tape)}
                    className="min-h-[44px] border border-border px-3 font-ui text-xs uppercase tracking-wide text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <DeleteConfirmSheet
          open={tapeToDelete !== null}
          title="Remove this tape?"
          description="This removes the tape for everyone with the scenario link. This cannot be undone."
          confirmLabel="Remove tape"
          onCancel={() => {
            if (!deleteMutation.isPending) {
              setTapeToDelete(null)
              deleteMutation.reset()
            }
          }}
          onConfirm={() => {
            if (tapeToDelete) deleteMutation.mutate(tapeToDelete.id)
          }}
          pending={deleteMutation.isPending}
          errorMessage={tapeToDelete && deleteErr ? deleteErr : null}
        />

        <DeleteConfirmSheet
          open={confirmDeleteScenario}
          title="Delete this scenario?"
          description="This permanently removes the scenario and all its tapes for everyone with the link. This cannot be undone."
          confirmLabel="Delete scenario"
          onCancel={() => {
            if (!deleteScenarioMutation.isPending) {
              setConfirmDeleteScenario(false)
              deleteScenarioMutation.reset()
            }
          }}
          onConfirm={() => deleteScenarioMutation.mutate()}
          pending={deleteScenarioMutation.isPending}
          errorMessage={confirmDeleteScenario && deleteScenarioErr ? deleteScenarioErr : null}
        />

        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
        >
          {editTape ? (
            <div className="mx-auto mb-3 max-h-[min(70svh,28rem)] w-full max-w-[480px] space-y-3 overflow-y-auto overscroll-contain md:max-w-[640px]">
              <label className="block font-ui text-xs text-muted" htmlFor={`${formId}-edit`}>
                Edit tape text
              </label>
              <textarea
                ref={creatorTextRef}
                id={`${formId}-edit`}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full resize-y border border-border bg-surface-raised px-3 py-2 font-display text-lg uppercase tracking-wide text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
              />
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-ui text-xs text-muted">Color</span>
                <ColorPickerSwatch value={editColor} onChange={setEditColor} aria-label="Tape color" />
              </div>
              <div className="space-y-2">
                <p className="font-ui text-xs font-medium uppercase tracking-wide text-foreground">Preview</p>
                <div className="overflow-x-auto border border-border bg-surface p-3">
                  <TapeRenderer
                    text={editText}
                    color={editColor}
                    state={editText.trim().length === 0 ? 'empty' : 'live'}
                  />
                </div>
              </div>
              {editErr ? (
                <p className="font-ui text-xs text-red-400" role="alert">
                  {editErr}. You can try again.
                </p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={updateMutation.isPending || editText.trim().length === 0}
                  onClick={handleSaveEdit}
                  className="min-h-[44px] flex-1 bg-accent px-4 py-2 font-ui text-sm font-medium text-accent-text disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={closeEditPanel}
                  className="min-h-[44px] border border-border px-4 font-ui text-sm text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : addOpen ? (
            <div className="mx-auto mb-3 max-h-[min(70svh,28rem)] w-full max-w-[480px] space-y-3 overflow-y-auto overscroll-contain md:max-w-[640px]">
              <label className="block font-ui text-xs text-muted" htmlFor={`${formId}-new`}>
                New tape text
              </label>
              <textarea
                ref={creatorTextRef}
                id={`${formId}-new`}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full resize-y border border-border bg-surface-raised px-3 py-2 font-display text-lg uppercase tracking-wide text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
              />
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-ui text-xs text-muted">Color</span>
                <ColorPickerSwatch value={newColor} onChange={setNewColor} aria-label="New tape color" />
              </div>
              <div className="space-y-2">
                <p className="font-ui text-xs font-medium uppercase tracking-wide text-foreground">Preview</p>
                <div className="overflow-x-auto border border-border bg-surface p-3">
                  <TapeRenderer
                    text={newText}
                    color={newColor}
                    state={newText.trim().length === 0 ? 'empty' : 'live'}
                  />
                </div>
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
                <button type="button" onClick={closeAddPanel} className="min-h-[44px] border border-border px-4 font-ui text-sm text-muted">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div className="mx-auto flex h-12 max-w-[480px] items-center justify-center md:max-w-[640px]">
            {editTape ? (
              <p className="font-ui text-xs text-muted" aria-live="polite">
                Editing tape — save or cancel to continue.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => (addOpen ? closeAddPanel() : openAddPanel())}
                className="min-h-[44px] w-full max-w-sm bg-accent px-6 font-ui text-sm font-semibold uppercase tracking-wide text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-expanded={addOpen}
              >
                {addOpen ? 'Close' : 'Add tape'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
