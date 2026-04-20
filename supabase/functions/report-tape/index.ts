import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { getCorsHeaders } from '../_shared/cors.ts'
import { jsonDatabaseError, jsonError, jsonOk } from '../_shared/errors.ts'
import { rateLimitOr429 } from '../_shared/rateLimit.ts'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  scenarioSlug: z.string().min(1),
  tapeId: z.string().uuid(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  if (req.method !== 'POST') {
    return jsonError(req, 'METHOD_NOT_ALLOWED', 'Use POST', 405)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return jsonError(req, 'SERVER_CONFIG', 'Missing Supabase env', 500)

  const limited = rateLimitOr429(req, null, 'report-tape', {
    max: 20,
    windowMs: 60_000,
  })
  if (limited) return limited

  const supabase = createClient(url, key)

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError(req, 'BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return jsonError(req, 'VALIDATION_ERROR', formatZodError(parsed.error), 400)
  }

  const { scenarioSlug, tapeId } = parsed.data

  const { error } = await supabase
    .from('tape_reports')
    .insert({ tape_id: tapeId, scenario_slug: scenarioSlug })

  if (error) return jsonDatabaseError(req, error)

  return jsonOk(req, { ok: true })
})
