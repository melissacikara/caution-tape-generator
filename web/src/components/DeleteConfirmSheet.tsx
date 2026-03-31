import { useEffect, useId, useRef } from 'react'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  pending?: boolean
  errorMessage?: string | null
}

/**
 * FR32: explicit confirmation before permanent delete — bottom-anchored on small screens, centered on sm+.
 */
export function DeleteConfirmSheet({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  pending = false,
  errorMessage,
}: Props) {
  const titleId = useId()
  const descId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  useEffect(() => {
    if (open) cancelRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75"
        aria-label="Dismiss"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-[61] w-full max-w-md border border-border bg-background p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] sm:rounded-none sm:shadow-lg"
      >
        <h2 id={titleId} className="font-display text-lg uppercase tracking-wide text-foreground">
          {title}
        </h2>
        <p id={descId} className="mt-2 font-ui text-sm text-muted">
          {description}
        </p>
        {errorMessage ? (
          <p className="mt-3 font-ui text-xs text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="min-h-[44px] border border-border px-4 font-ui text-sm text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="min-h-[44px] bg-red-700 px-4 font-ui text-sm font-semibold uppercase tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
          >
            {pending ? 'Removing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
