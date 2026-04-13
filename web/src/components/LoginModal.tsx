import { useState } from 'react'

import { supabaseClient } from '../lib/supabase'

interface LoginModalProps {
  onClose: () => void
}

type ModalState = 'idle' | 'loading' | 'sent' | 'error'

export function LoginModal({ onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [modalState, setModalState] = useState<ModalState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setModalState('loading')
    setErrorMessage('')

    const { error } = await supabaseClient.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrorMessage(error.message)
      setModalState('error')
    } else {
      setModalState('sent')
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

        {modalState === 'sent' ? (
          <div className="mt-4">
            <p className="font-ui text-sm text-foreground">
              Magic link sent! Check your inbox.
            </p>
            <p className="mt-1 font-ui text-xs text-muted">
              Click the link in your email to sign in.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full cursor-pointer border border-border bg-background px-4 py-2 font-ui text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block font-ui text-xs text-muted">
                Email address
              </label>
              <input
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

            {(modalState === 'error') && errorMessage ? (
              <p className="font-ui text-xs text-red-400" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={modalState === 'loading' || !email.trim()}
              className="min-h-[44px] w-full cursor-pointer bg-accent px-4 py-3 font-ui text-sm font-semibold uppercase tracking-wide text-accent-text transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {modalState === 'loading' ? 'Sending…' : 'Send Magic Link'}
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
