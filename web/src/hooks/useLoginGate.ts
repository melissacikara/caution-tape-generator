import { useState } from 'react'

import { useAuth } from '../providers/AuthProvider'

export function useLoginGate() {
  const { user, loading } = useAuth()
  const [isLoginGateOpen, setIsLoginGateOpen] = useState(false)

  function openLoginGate() {
    if (user !== null || loading) return
    setIsLoginGateOpen(true)
  }

  function closeLoginGate() {
    setIsLoginGateOpen(false)
  }

  return { isLoginGateOpen, openLoginGate, closeLoginGate }
}
