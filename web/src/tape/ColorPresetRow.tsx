import { useEffect, useState } from 'react'
import { ColorPickerSwatch } from './ColorPickerSwatch'
import { TAPE_PRESETS } from './tapePresets'

export type ColorPresetRowProps = {
  value: string
  onChange: (hex: string) => void
  disabled?: boolean
  className?: string
}

function normalizeHex(v: string): string {
  const s = v.trim().toLowerCase()
  if (!s) return '#000000'
  const withHash = s.startsWith('#') ? s : `#${s}`
  // Expand 3-digit shorthand (#rgb → #rrggbb) to match ColorPickerSwatch behavior
  if (withHash.length === 4) {
    return `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`
  }
  return withHash.length >= 7 ? withHash.slice(0, 7) : withHash
}

function isPresetColor(hex: string): boolean {
  const normalized = normalizeHex(hex)
  return TAPE_PRESETS.some((p) => normalizeHex(p.hex) === normalized)
}

/**
 * Preset swatch row with a Custom toggle for full-spectrum color picking.
 * Preset colors are sourced exclusively from tapePresets.ts (AC: single source of truth).
 * Each swatch meets 44×44px touch target (UX-DR16).
 * Row is horizontally scrollable — no wrapping on small viewports.
 */
export function ColorPresetRow({
  value,
  onChange,
  disabled = false,
  className = '',
}: ColorPresetRowProps) {
  const [showCustom, setShowCustom] = useState(() => !isPresetColor(value))

  // Sync showCustom when the parent changes value externally (e.g. reset, load).
  useEffect(() => {
    setShowCustom(!isPresetColor(value))
  }, [value])

  const handlePresetClick = (hex: string) => {
    if (disabled) return
    setShowCustom(false)
    onChange(hex)
  }

  const handleCustomToggle = () => {
    if (disabled) return
    setShowCustom((prev) => !prev)
  }

  const currentNormalized = normalizeHex(value)

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Color presets"
      >
        {TAPE_PRESETS.map((preset) => {
          const isActive = normalizeHex(preset.hex) === currentNormalized && !showCustom
          return (
            <button
              key={preset.hex}
              type="button"
              aria-label={preset.label}
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => handlePresetClick(preset.hex)}
              className={`relative shrink-0 min-h-[44px] min-w-[44px] border transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? 'border-accent ring-2 ring-accent ring-offset-1 ring-offset-background'
                  : 'border-border hover:border-accent'
              }`}
              style={{ backgroundColor: preset.hex }}
              title={preset.label}
            />
          )
        })}

        <button
          type="button"
          aria-label="Custom color"
          aria-pressed={showCustom}
          disabled={disabled}
          onClick={handleCustomToggle}
          className={`shrink-0 min-h-[44px] min-w-[44px] border px-2 font-ui text-xs uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 ${
            showCustom
              ? 'border-accent bg-accent text-accent-text'
              : 'border-border bg-transparent text-muted hover:border-accent hover:text-foreground'
          }`}
        >
          Custom
        </button>
      </div>

      {showCustom ? (
        <ColorPickerSwatch
          value={value}
          onChange={(hex) => {
            if (!disabled) onChange(hex)
          }}
          disabled={disabled}
          aria-label="Tape color"
        />
      ) : null}
    </div>
  )
}
