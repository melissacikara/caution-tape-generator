import { useEffect, useState } from 'react'

import { ColorPickerSwatch } from './ColorPickerSwatch'
import { TapeRenderer } from './TapeRenderer'

const DEFAULT_TAPE_COLOR = '#FFD000'

const TAPE_INPUT_LABEL = 'Caution tape warning text'

export type TapeCreatorPanelProps = {
  className?: string
  /** Called whenever the locked tape snapshot changes (including reset to null). */
  onLockedTapeChange?: (tape: { text: string; color: string } | null) => void
}

type LockedTape = { text: string; color: string }

/**
 * Direction B — Command Center: Warning Text, Live Preview, Generate / Reset (UX-DR4, UX-DR11).
 * “Add to scenario” uses `onLockedTapeChange` + home flow (Epic 2).
 */
export function TapeCreatorPanel({
  className = '',
  onLockedTapeChange,
}: TapeCreatorPanelProps) {
  const [warningText, setWarningText] = useState('')
  const [tapeColor, setTapeColor] = useState(DEFAULT_TAPE_COLOR)
  const [lockedTape, setLockedTape] = useState<LockedTape | null>(null)

  const isLocked = lockedTape !== null

  const previewText = isLocked ? lockedTape.text : warningText
  const previewColor = isLocked ? lockedTape.color : tapeColor
  const previewState =
    isLocked ? 'generated' : warningText.trim().length === 0 ? 'empty' : 'live'

  const handleGenerate = () => {
    const t = warningText.trim()
    if (t.length === 0) return
    setLockedTape({ text: t, color: tapeColor })
  }

  const handleReset = () => {
    setLockedTape(null)
    setWarningText('')
    setTapeColor(DEFAULT_TAPE_COLOR)
  }

  useEffect(() => {
    onLockedTapeChange?.(lockedTape)
  }, [lockedTape, onLockedTapeChange])

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
            Generate
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleReset}
          className="min-h-[44px] w-full border border-border bg-transparent px-4 py-3 font-ui text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Reset
        </button>
      </footer>
    </div>
  )
}
