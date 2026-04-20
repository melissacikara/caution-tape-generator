/** Comma-separated list of allowed browser origins (e.g. https://your-app.vercel.app,http://localhost:5173).
 * If unset or empty, Access-Control-Allow-Origin is * (convenient for local dev only).
 * Set in Supabase Dashboard → Edge Functions → Secrets for production. */
const ALLOW_HEADERS =
  'authorization, x-client-info, apikey, content-type, idempotency-key'

export function getAllowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS')?.trim()
  if (!raw) return []
  return raw.split(',').map((o) => o.trim()).filter(Boolean)
}

/** CORS headers for this request. When ALLOWED_ORIGINS is set, only listed Origins get ACAO (browser calls). */
export function getCorsHeaders(req: Request): Record<string, string> {
  const allowed = getAllowedOrigins()
  const origin = req.headers.get('Origin') ?? ''

  if (allowed.length === 0) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': ALLOW_HEADERS,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    }
  }

  if (origin && allowed.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': ALLOW_HEADERS,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      Vary: 'Origin',
    }
  }

  return {
    'Access-Control-Allow-Headers': ALLOW_HEADERS,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  }
}

/** @deprecated Use getCorsHeaders(req). Kept for any legacy imports; prefer per-request headers in production. */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': ALLOW_HEADERS,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}
