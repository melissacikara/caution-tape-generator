import '@testing-library/jest-dom'

// Stub Supabase env vars so any test that imports web/src/lib/supabase.ts
// does not throw at module init time.
Object.defineProperty(import.meta, 'env', {
  value: {
    ...import.meta.env,
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  },
})
