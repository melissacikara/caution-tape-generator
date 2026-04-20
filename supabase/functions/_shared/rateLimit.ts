import { jsonError } from './errors.ts'

const buckets = new Map<string, number[]>()

export function getRequestRateKey(req: Request, userId: string | null): string {
  const fwd = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const cf = req.headers.get('cf-connecting-ip')
  const ip = fwd || cf || 'unknown'
  if (userId) return `u:${userId}`
  return `ip:${ip}`
}

/** Returns a 429 Response if limit exceeded; otherwise records this hit and returns null. */
export function rateLimitOr429(
  req: Request,
  userId: string | null,
  namespace: string,
  opts: { max: number; windowMs: number },
): Response | null {
  const key = `${namespace}:${getRequestRateKey(req, userId)}`
  const now = Date.now()
  const { max, windowMs } = opts
  let arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (arr.length >= max) {
    buckets.set(key, arr)
    return jsonError(
      req,
      'RATE_LIMITED',
      'Too many requests. Try again in a minute.',
      429,
    )
  }
  arr.push(now)
  buckets.set(key, arr)
  return null
}
