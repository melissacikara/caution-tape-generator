import type { ZodError } from 'https://esm.sh/zod@3.23.8'

/** Single-line message for API responses (no raw flatten dumps). */
export function formatZodError(err: ZodError): string {
  const first = err.issues[0]
  if (!first) return 'Invalid request'
  const path = first.path.length ? `${String(first.path[0])}: ` : ''
  return `${path}${first.message}`
}
