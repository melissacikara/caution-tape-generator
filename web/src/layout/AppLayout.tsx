import { Outlet } from 'react-router'

import { AppFooter } from '../components/AppFooter'
import { AppHeader } from '../components/AppHeader'
import { isSupabaseConfigured } from '../api/client'

export function AppLayout() {
  const configured = isSupabaseConfigured()

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-background">
      {!configured ? (
        <div
          role="status"
          className="border-b border-accent/40 bg-surface-raised px-4 py-2 text-center font-ui text-xs text-muted"
        >
          Set <code className="text-foreground">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code> in{' '}
          <code className="text-foreground">.env</code> to load and create scenarios.
        </div>
      ) : null}
      <AppHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <AppFooter />
    </div>
  )
}
