import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  scenarioSlug: z.string().min(1),
  tapeId: z.string().uuid(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonError('METHOD_NOT_ALLOWED', 'Use POST', 405)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return jsonError('SERVER_CONFIG', 'Missing Supabase env', 500)

  const supabase = createClient(url, key)

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', formatZodError(parsed.error), 400)
  }

  const { scenarioSlug, tapeId } = parsed.data

  const { error } = await supabase
    .from('tape_reports')
    .insert({ tape_id: tapeId, scenario_slug: scenarioSlug })

  if (error) return jsonError('DATABASE_ERROR', error.message, 500)

  return jsonOk({ ok: true })
})
