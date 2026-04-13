import type { Session, User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { supabaseClient } from '../lib/supabase'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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
        // Clear cached anon-era data so queries re-fetch with the user's JWT
        void queryClient.invalidateQueries()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setSession(null)
        // Clear user-scoped data so the next visitor starts fresh
        void queryClient.invalidateQueries()
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
