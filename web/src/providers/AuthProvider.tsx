import type { Session, User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'

import { supabaseClient } from '../lib/supabase'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    const { data } = supabaseClient.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'INITIAL_SESSION') {
        setUser(currentSession?.user ?? null)
        setSession(currentSession)
        setLoading(false)
      } else if (event === 'SIGNED_IN') {
        setUser(currentSession?.user ?? null)
        setSession(currentSession)
        // Re-fetch scenario-backed data with the user's JWT (avoid invalidating unrelated caches).
        void queryClient.invalidateQueries({ queryKey: ['scenarios'] })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setSession(null)
        void queryClient.invalidateQueries({ queryKey: ['scenarios'] })
      } else if (event === 'TOKEN_REFRESHED') {
        setUser(currentSession?.user ?? null)
        setSession(currentSession)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [queryClient])

  async function signOut() {
    await supabaseClient.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
