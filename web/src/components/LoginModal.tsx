import { useEffect, useRef, useState } from 'react'

import { supabaseClient } from '../lib/supabase'

interface LoginModalProps {
  onClose: () => void
}

type ModalState = 'idle' | 'sending' | 'verify' | 'verifying' | 'error'

export function LoginModal({ onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [modalState, setModalState] = useState<ModalState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  useEffect(() => {
    if (modalState === 'verify') {
      requestAnimationFrame(() => codeRef.current?.focus())
    }
  }, [modalState])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setModalState('sending')
    setErrorMessage('')

    const { error } = await supabaseClient.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })

    if (error) {
      setErrorMessage(error.message)
      setModalState('error')
    } else {
      setModalState('verify')
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return

    setModalState('verifying')
    setErrorMessage('')

    const { error } = await supabaseClient.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    })

    if (error) {
      setErrorMessage(error.message)
      setModalState('verify')
    } else {
      onClose()
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

        {modalState === 'verify' || modalState === 'verifying' ? (
          <form onSubmit={(e) => void handleVerify(e)} className="mt-4 flex flex-col gap-4" noValidate>
            <p className="font-ui text-sm text-foreground">
              Check your inbox for a 6-digit code sent to <strong>{email}</strong>.
            </p>
            <div>
              <label htmlFor="login-code" className="block font-ui text-xs text-muted">
                Verification code
              </label>
              <input
                ref={codeRef}
                id="login-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="mt-1 w-full border border-border bg-background px-3 py-2 font-ui text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              />
            </div>

            {errorMessage ? (
              <p className="font-ui text-xs text-red-400" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={modalState === 'verifying' || !code.trim()}
              className="min-h-[44px] w-full cursor-pointer bg-accent px-4 py-3 font-ui text-sm font-semibold uppercase tracking-wide text-accent-text transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {modalState === 'verifying' ? 'Verifying…' : 'Verify Code'}
            </button>

            <button
              ref={closeRef}
              type="button"
              onClick={() => {
                setModalState('idle')
                setCode('')
                setErrorMessage('')
              }}
              className="min-h-[44px] w-full cursor-pointer border border-border bg-background px-4 py-2 font-ui text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Use a different email
            </button>
          </form>
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
              {modalState === 'sending' ? 'Sending…' : 'Send Code'}
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
