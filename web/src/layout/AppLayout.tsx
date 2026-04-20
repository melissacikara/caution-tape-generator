import { Component, Suspense, type ReactNode } from 'react'
import { Outlet } from 'react-router'

import { AppFooter } from '../components/AppFooter'
import { AppHeader } from '../components/AppHeader'
import { isSupabaseConfigured } from '../api/client'

class ChunkErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex justify-center px-4 py-12" role="alert">
          <p className="font-ui text-sm text-muted">
            Failed to load page.{' '}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Reload
            </button>
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

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
        <ChunkErrorBoundary>
          <Suspense
            fallback={
              <div
                className="flex justify-center px-4 py-12"
                role="status"
                aria-live="polite"
              >
                <p className="font-ui text-sm text-muted">Loading…</p>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </ChunkErrorBoundary>
      </div>
      <AppFooter />
    </div>
  )
}
