import { useEffect, useId, useRef } from 'react'

export type ColorPickerSwatchProps = {
  /** Current color, e.g. `#FFD000` */
  value: string
  onChange: (hex: string) => void
  /** Accessible name for the color control (native picker). */
  'aria-label'?: string
  /** When true, color cannot be changed (e.g. locked tape). */
  disabled?: boolean
  className?: string
}

function normalizeHex(v: string): string {
  const s = v.trim()
  if (!s) return '#000000'
  const withHash = s.startsWith('#') ? s : `#${s}`
  return withHash.length >= 7 ? withHash.slice(0, 7) : withHash
}

/**
 * UX-DR5: full-spectrum pick (MVP = native color input) + hex label beside swatch.
 * Swatch hit area ≥ 44×44px (UX-DR16).
 */
export function ColorPickerSwatch({
  value,
  onChange,
  'aria-label': ariaLabel = 'Tape color',
  disabled = false,
  className = '',
}: ColorPickerSwatchProps) {
  const id = useId()
  const display = normalizeHex(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Imperatively keep the DOM attribute in sync so mobile browsers
  // (iOS Safari, Chrome for Android) read the correct value when the
  // native color-picker sheet opens — they inspect the DOM attribute at
  // open time, which can lag behind React's reconciliation.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = display
    }
  }, [display])

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <label
        htmlFor={id}
        className={`relative inline-flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 border border-border focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-background ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: display }}
          aria-hidden
        />
        <input
          ref={inputRef}
          id={id}
          type="color"
          value={display}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-full w-full min-h-[44px] min-w-[44px] cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label={ariaLabel}
        />
      </label>
      <span
        className="font-ui text-sm tabular-nums tracking-wide text-foreground"
        aria-live="polite"
      >
        {display.toUpperCase()}
      </span>
    </div>
  )
}
