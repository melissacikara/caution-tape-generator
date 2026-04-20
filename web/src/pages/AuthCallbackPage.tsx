import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { supabaseClient } from '../lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const didNavigate = useRef(false)

  useEffect(() => {
    // The Supabase SDK processes the #access_token fragment automatically during
    // client init. getSession() may race that processing, so we also subscribe to
    // onAuthStateChange as a fallback — whichever fires first wins.

    function handleSuccess() {
      if (didNavigate.current) return
      didNavigate.current = true
      void navigate('/')
    }

    // Fallback: listen for SIGNED_IN in case getSession() resolves before the
    // SDK has hydrated the session from the URL hash.
    const { data } = supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        handleSuccess()
      }
    })

    // Primary: try getSession() immediately
    supabaseClient.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (session) {
        handleSuccess()
      } else if (sessionError) {
        data.subscription.unsubscribe()
        setError(sessionError.message)
      }
      // If no session and no error, the onAuthStateChange listener above will
      // catch the SIGNED_IN event once the SDK finishes processing the hash.
    }).catch(() => {
      data.subscription.unsubscribe()
      setError('Something went wrong. Please try again.')
    })

    // Safety timeout: if neither path resolves in 8s, show an error
    const timeout = setTimeout(() => {
      if (!didNavigate.current) {
        data.subscription.unsubscribe()
        setError('Login link expired or invalid. Please try again.')
      }
    }, 8000)

    return () => {
      data.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

  if (error) {
    return (
      <main className="flex justify-center px-4 py-8">
        <div className="w-full max-w-[480px] md:max-w-[640px]">
          <p className="font-ui text-sm text-red-400" role="alert">
            {error}
          </p>
          <Link
            to="/"
            className="mt-4 inline-block font-ui text-sm text-muted underline-offset-4 hover:text-foreground"
          >
            Try again
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex justify-center px-4 py-8">
      <div className="w-full max-w-[480px] md:max-w-[640px]">
        <p className="font-ui text-sm text-muted">Signing you in…</p>
      </div>
    </main>
  )
}
