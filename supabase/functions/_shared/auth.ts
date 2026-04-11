import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

/**
 * Extract the authenticated user ID from the Authorization header.
 * Returns null for anonymous callers — never throws, never returns 401.
 */
export async function extractUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  if (!token) return null
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return null
  try {
    const supabase = createClient(url, key)
    const { data } = await supabase.auth.getUser(token)
    return data?.user?.id ?? null
  } catch {
    return null
  }
}
