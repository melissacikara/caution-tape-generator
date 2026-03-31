import { memo } from 'react'

export type TapeRendererState = 'empty' | 'live' | 'generated'

export type TapeRendererProps = {
  /** User-entered warning text (may be empty). */
  text: string
  /** Tape field color, e.g. `#FFD000`. */
  color: string
  /** Optional explicit state; otherwise empty is derived from trimmed `text`. */
  state?: TapeRendererState
  className?: string
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace(/^#/, '')
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    }
  }
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    }
  }
  return null
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function mixTowardBlack(hex: string, amount: number): string {
  const p = parseHex(hex)
  if (!p) return '#333333'
  const r = Math.round(p.r * (1 - amount))
  const g = Math.round(p.g * (1 - amount))
  const b = Math.round(p.b * (1 - amount))
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

function inkForTapeBackground(bgHex: string): string {
  const p = parseHex(bgHex)
  if (!p) return '#111111'
  const L = relativeLuminance(p.r, p.g, p.b)
  return L > 0.55 ? '#111111' : '#f0f0f0'
}

function normalizeHex(color: string): string {
  const t = color.trim()
  return t.startsWith('#') ? t : `#${t}`
}

/**
 * Renders caution-tape visuals: diagonal stripes + repeating `CAUTION: [text] ⚠` (FR4).
 * Accessible name is provided once via `aria-label`; the repeating strip is `aria-hidden`.
 * Memoized so parent re-renders (e.g. typing elsewhere) don’t redraw the full strip (Epic 4.2).
 */
function TapeRendererInner({ text, color, state, className = '' }: TapeRendererProps) {
  const trimmed = text.trim()
  const isEmpty = state === 'empty' || trimmed.length === 0
  const baseHex = normalizeHex(color)
  const stripeA = baseHex
  const stripeB = mixTowardBlack(baseHex, 0.38)
  const ink = inkForTapeBackground(baseHex)

  if (isEmpty) {
    return (
      <div
        className={`flex min-h-16 w-full items-center justify-center border border-dashed border-border bg-surface-raised px-4 py-6 ${className}`}
        role="region"
        aria-label="Tape preview — empty. Type to see caution tape."
      >
        <span className="font-ui text-sm text-muted">
          Preview appears here as you type
        </span>
      </div>
    )
  }

  const upper = trimmed.toUpperCase()
  const segment = `CAUTION: ${upper} ⚠ `
  const repeats = Math.min(64, Math.max(18, 14 + upper.length * 3))
  /** FR5: wider tape for longer phrases */
  const minWidthCh = Math.max(20, 14 + upper.length * 2.4)

  const stripeBackground = `repeating-linear-gradient(
    -45deg,
    ${stripeA},
    ${stripeA} 11px,
    ${stripeB} 11px,
    ${stripeB} 22px
  )`

  const isGenerated = state === 'generated'
  const ariaLabel = isGenerated
    ? `Generated caution tape: CAUTION: ${upper}`
    : `Caution tape: CAUTION: ${upper}`

  return (
    <div
      className={`relative w-full max-w-full overflow-hidden border border-border ${isGenerated ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''} ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: stripeBackground }}
        aria-hidden
      />
      <div
        className="relative z-10 flex w-max max-w-none flex-nowrap items-center px-3 py-3 font-display text-xl uppercase leading-none tracking-wide"
        style={{
          color: ink,
          minWidth: `${minWidthCh}ch`,
        }}
        aria-hidden
      >
        {Array.from({ length: repeats }, (_, i) => (
          <span key={i} className="inline-block shrink-0 whitespace-pre">
            {segment}
          </span>
        ))}
      </div>
    </div>
  )
}

export const TapeRenderer = memo(TapeRendererInner)
TapeRenderer.displayName = 'TapeRenderer'
