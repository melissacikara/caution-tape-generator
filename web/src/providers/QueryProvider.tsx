import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            /** One retry on flaky networks; safe for GET-style scenario fetches (Epic 4.3). */
            retry: 1,
          },
          mutations: {
            /** Avoid automatic POST retries that could duplicate non-idempotent creates (add-tape uses idempotency keys in-app). */
            retry: 0,
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
