export type ApiErrorBody = {
  error: {
    code: string
    message: string
  }
}

export function getSupabaseEnv(): {
  url: string
  anon: string
  configured: boolean
} {
  const url = process.env.VITE_SUPABASE_URL?.trim() ?? ''
  const anon = process.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  return { url, anon, configured: Boolean(url && anon) }
}

export function fnUrl(base: string, functionName: string): string {
  return `${base.replace(/\/$/, '')}/functions/v1/${functionName}`
}

export function authHeaders(anon: string, withJson = true): HeadersInit {
  const h: Record<string, string> = {
    Authorization: `Bearer ${anon}`,
    apikey: anon,
  }
  if (withJson) h['Content-Type'] = 'application/json'
  return h
}

export async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

/** Same env vars as Playwright E2E — used for integration tests that need a real JWT. */
export function hasE2EUserCredentials(): boolean {
  const email = process.env.E2E_LOGIN_EMAIL?.trim()
  const password = process.env.E2E_LOGIN_PASSWORD?.trim()
  return Boolean(email && password)
}

/** Returns a user access token, or null if E2E creds are not set / sign-in fails. */
export async function getUserAccessToken(): Promise<string | null> {
  const { url, anon, configured } = getSupabaseEnv()
  if (!configured) return null
  if (!hasE2EUserCredentials()) return null
  const { createClient } = await import('@supabase/supabase-js')
  const email = process.env.E2E_LOGIN_EMAIL!.trim()
  const password = process.env.E2E_LOGIN_PASSWORD!.trim()
  const sb = createClient(url, anon)
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error || !data.session) return null
  return data.session.access_token
}

export function userAuthHeaders(anon: string, accessToken: string, withJson = true): HeadersInit {
  const h: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    apikey: anon,
  }
  if (withJson) h['Content-Type'] = 'application/json'
  return h
}
