import { useDeferredValue, useEffect, useState } from 'react'

import { LoginModal } from '../components/LoginModal'
import { useLoginGate } from '../hooks/useLoginGate'
import { clearCreateFlowDraft, loadCreateFlowDraft, mergeCreateFlowDraft } from '../lib/createFlowStorage'
import { useAuth } from '../providers/useAuth'
import { ColorPickerSwatch } from './ColorPickerSwatch'
import { exportTapeAsImage } from './exportTapeAsImage'
import { TapeRenderer } from './TapeRenderer'

const DEFAULT_TAPE_COLOR = '#FFD000'

const TAPE_INPUT_LABEL = 'Caution tape warning text'

export type TapeCreatorPanelProps = {
  className?: string
  /** Called whenever the locked tape snapshot changes (including reset to null). */
  onLockedTapeChange?: (tape: { text: string; color: string } | null) => void
  /** Called when the user resets the tape (clears draft persistence + scenario fields on the home flow). */
  onTapeReset?: () => void
}

type LockedTape = { text: string; color: string }

/**
 * Direction B — Command Center: Warning Text, Live Preview, Generate / Reset (UX-DR4, UX-DR11).
 * “Add to scenario” uses `onLockedTapeChange` + home flow (Epic 2).
 */
export function TapeCreatorPanel({
  className = '',
  onLockedTapeChange,
  onTapeReset,
}: TapeCreatorPanelProps) {
  const { user } = useAuth()
  const { isLoginGateOpen, openLoginGate, closeLoginGate } = useLoginGate()
  const [warningText, setWarningText] = useState(() => loadCreateFlowDraft().warningText)
  const [tapeColor, setTapeColor] = useState(() => loadCreateFlowDraft().tapeColor)
  const [lockedTape, setLockedTape] = useState<LockedTape | null>(
    () => loadCreateFlowDraft().lockedTape,
  )
  const [exportError, setExportError] = useState<string | null>(null)
  const [prevLockedTape, setPrevLockedTape] = useState(lockedTape)
  if (lockedTape !== prevLockedTape) {
    setPrevLockedTape(lockedTape)
    setExportError(null)
  }

  const isLocked = lockedTape !== null

  const deferredWarningText = useDeferredValue(warningText)
  /** Input stays synchronous; preview defers under CPU load so typing stays responsive (story 4-2). */
  const previewText =
    isLocked && lockedTape !== null ? lockedTape.text : deferredWarningText
  const previewColor =
    isLocked && lockedTape !== null ? lockedTape.color : tapeColor
  const previewState =
    isLocked ? 'generated' : deferredWarningText.trim().length === 0 ? 'empty' : 'live'

  const handleGenerate = () => {
    const t = warningText.trim()
    if (t.length === 0) return
    if (user === null) {
      openLoginGate()
      return
    }
    setLockedTape({ text: t, color: tapeColor })
  }

  const handleReset = () => {
    onTapeReset?.()
    setLockedTape(null)
    setWarningText('')
    setTapeColor(DEFAULT_TAPE_COLOR)
    setExportError(null)
    clearCreateFlowDraft()
  }

  const handleSaveTape = async () => {
    if (!lockedTape) return
    setExportError(null)
    try {
      await exportTapeAsImage(lockedTape)
    } catch (err) {
      if (err != null && (err as { name?: unknown }).name === 'AbortError') return
      setExportError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  useEffect(() => {
    onLockedTapeChange?.(lockedTape)
  }, [lockedTape, onLockedTapeChange])

  useEffect(() => {
    mergeCreateFlowDraft({ warningText, tapeColor, lockedTape })
  }, [warningText, tapeColor, lockedTape])

  return (
    <div className={`flex flex-col gap-8 ${className}`}>
      <section aria-labelledby="warning-text-heading">
        <h2
          id="warning-text-heading"
          className="font-ui text-sm font-medium uppercase tracking-wide text-foreground"
        >
          Warning Text
        </h2>
        <div className="mt-2 border border-border bg-surface-raised p-4">
          <div className="flex min-h-12 flex-wrap items-baseline gap-x-1.5">
            <span
              className="font-display text-2xl uppercase leading-none tracking-wide text-accent"
              aria-hidden
            >
              CAUTION:
            </span>
            <input
              type="text"
              value={warningText}
              disabled={isLocked}
              onChange={(e) => setWarningText(e.target.value)}
              maxLength={2000}
              className="min-w-[8ch] flex-1 bg-transparent font-display text-2xl uppercase leading-none tracking-wide text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={TAPE_INPUT_LABEL}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-ui text-xs text-muted">Tape color</span>
          <ColorPickerSwatch
            value={tapeColor}
            onChange={setTapeColor}
            disabled={isLocked}
            aria-label="Tape color"
          />
        </div>
      </section>

      <section aria-labelledby="live-preview-heading">
        <h2
          id="live-preview-heading"
          className="font-ui text-sm font-medium uppercase tracking-wide text-foreground"
        >
          Live Preview
        </h2>
        <div className="mt-2 overflow-x-auto border border-border bg-surface p-3">
          <TapeRenderer
            text={previewText}
            color={previewColor}
            state={previewState}
          />
        </div>
      </section>

      <footer className="flex flex-col gap-3" aria-label="Tape actions">
        {!isLocked ? (
          <button
            type="button"
            onClick={handleGenerate}
            className="min-h-[44px] w-full bg-accent px-4 py-3 font-ui text-sm font-medium text-accent-text transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            ISSUE A WARNING
          </button>
        ) : null}
        {isLocked && !exportError ? (
          <button
            type="button"
            onClick={() => void handleSaveTape()}
            className="min-h-[44px] w-full border border-accent bg-transparent px-4 py-3 font-ui text-sm text-accent transition-colors hover:bg-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Save tape
          </button>
        ) : null}
        {exportError ? (
          <p role="alert" className="font-ui text-xs text-red-400">
            {exportError}{' '}
            <button type="button" onClick={() => void handleSaveTape()} className="underline">
              Try again
            </button>
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleReset}
          className="min-h-[44px] w-full border border-border bg-transparent px-4 py-3 font-ui text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Reset
        </button>
      </footer>
      {isLoginGateOpen ? <LoginModal onClose={closeLoginGate} /> : null}
    </div>
  )
}
