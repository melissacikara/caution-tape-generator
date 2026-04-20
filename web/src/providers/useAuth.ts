import { useContext } from 'react'

import type { AuthContextValue } from './auth-context'
import { AuthContext } from './auth-context'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
