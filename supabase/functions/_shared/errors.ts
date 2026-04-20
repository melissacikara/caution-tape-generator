import { getCorsHeaders } from './cors.ts'

export function jsonError(req: Request, code: string, message: string, status: number): Response {
  const cors = getCorsHeaders(req)
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

export function jsonOk(req: Request, body: unknown, status = 200): Response {
  const cors = getCorsHeaders(req)
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

/** Log DB/provider details server-side; never expose raw Postgres/Supabase messages to clients. */
export function jsonDatabaseError(req: Request, err: unknown, status = 500): Response {
  const detail = err instanceof Error ? err.message : String(err)
  console.error('[DATABASE_ERROR]', detail)
  return jsonError(
    req,
    'DATABASE_ERROR',
    'A server error occurred. Please try again.',
    status,
  )
}
