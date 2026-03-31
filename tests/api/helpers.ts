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
