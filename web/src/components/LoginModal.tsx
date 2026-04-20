import { useEffect, useRef, useState } from 'react'

import { supabaseClient } from '../lib/supabase'

interface LoginModalProps {
  onClose: () => void
}

type ModalState = 'idle' | 'sending' | 'link_sent' | 'error'

/** Avoid leaking whether an email is registered (Supabase error strings vary). */
const OTP_ERROR_GENERIC =
  "If this address can receive mail from us, you'll get a sign-in link shortly. Check your inbox and spam folder."

export function LoginModal({ onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [modalState, setModalState] = useState<ModalState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [resendBusy, setResendBusy] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const linkSentPrimaryRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  useEffect(() => {
    if (modalState === 'link_sent') {
      requestAnimationFrame(() => linkSentPrimaryRef.current?.focus())
    }
  }, [modalState])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setModalState('sending')
    setErrorMessage('')

    const emailRedirectTo = `${window.location.origin}/auth/callback`

    const { error } = await supabaseClient.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo,
      },
    })

    if (!mountedRef.current) return

    if (error) {
      setErrorMessage(OTP_ERROR_GENERIC)
      setModalState('error')
    } else {
      setModalState('link_sent')
    }
  }

  async function handleResend() {
    if (!email.trim()) return
    setResendBusy(true)
    setErrorMessage('')
    const emailRedirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabaseClient.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo,
      },
    })
    setResendBusy(false)
    if (!mountedRef.current) return
    if (error) {
      setErrorMessage(OTP_ERROR_GENERIC)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-sm border border-border bg-surface p-6">
        <h2
          id="login-modal-title"
          className="font-display text-2xl uppercase tracking-wide text-foreground"
        >
          Log in
        </h2>

        {modalState === 'link_sent' ? (
          <div className="mt-4 flex flex-col gap-4">
            <p className="font-ui text-sm text-foreground">
              Check your inbox for a <strong>sign-in link</strong> sent to{' '}
              <strong>{email}</strong>. Open it on this device to finish logging in.
            </p>
            {errorMessage ? (
              <p className="font-ui text-xs text-red-400" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <button
              ref={linkSentPrimaryRef}
              type="button"
              disabled={resendBusy}
              onClick={() => void handleResend()}
              className="min-h-[44px] w-full cursor-pointer bg-accent px-4 py-3 font-ui text-sm font-semibold uppercase tracking-wide text-accent-text transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendBusy ? 'Sending…' : 'Resend link'}
            </button>

            <button
              ref={closeRef}
              type="button"
              onClick={() => {
                setModalState('idle')
                setErrorMessage('')
                setResendBusy(false)
              }}
              className="min-h-[44px] w-full cursor-pointer border border-border bg-background px-4 py-2 font-ui text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSend(e)} className="mt-4 flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block font-ui text-xs text-muted">
                Email address
              </label>
              <input
                ref={emailRef}
                id="login-email"
                type="email"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1 w-full border border-border bg-background px-3 py-2 font-ui text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              />
            </div>

            {modalState === 'error' && errorMessage ? (
              <p className="font-ui text-xs text-red-400" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={modalState === 'sending' || !email.trim()}
              className="min-h-[44px] w-full cursor-pointer bg-accent px-4 py-3 font-ui text-sm font-semibold uppercase tracking-wide text-accent-text transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {modalState === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] w-full cursor-pointer border border-border bg-background px-4 py-2 font-ui text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
