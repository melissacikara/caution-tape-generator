import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { extractUserId } from '../_shared/auth.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { jsonDatabaseError, jsonError, jsonOk } from '../_shared/errors.ts'
import { mapScenario, mapTape } from '../_shared/map.ts'
import { rateLimitOr429 } from '../_shared/rateLimit.ts'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  name: z.string().min(1).max(500),
  firstTape: z
    .object({
      tapeText: z.string().min(1).max(2000),
      color: z.string().min(1).max(32),
    })
    .optional(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  if (req.method !== 'POST') {
    return jsonError(req, 'METHOD_NOT_ALLOWED', 'Use POST', 405)
  }

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

  const userId = await extractUserId(req)
  if (!userId) {
    return jsonError(req, 'UNAUTHORIZED', 'Sign in to create a scenario.', 401)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    return jsonError(req, 'SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const limited = rateLimitOr429(req, userId, 'create-scenario', {
    max: 30,
    windowMs: 60_000,
  })
  if (limited) return limited

  const supabase = createClient(url, key)

  const { name, firstTape } = parsed.data

  const { data: scenario, error: sErr } = await supabase
    .from('scenarios')
    .insert({ name, owner_id: userId })
    .select('id, name, public_slug, owner_id, is_public, created_at, updated_at')
    .single()

  if (sErr || !scenario) {
    return jsonDatabaseError(req, sErr ?? new Error('Scenario insert failed'))
  }

  const tapes: ReturnType<typeof mapTape>[] = []

  if (firstTape) {
    const { data: tape, error: tErr } = await supabase
      .from('tapes')
      .insert({
        scenario_id: scenario.id,
        tape_text: firstTape.tapeText,
        color: firstTape.color,
        author_id: userId,
      })
      .select('id, scenario_id, tape_text, color, author_id, created_at, updated_at')
      .single()

    if (tErr || !tape) {
      await supabase.from('scenarios').delete().eq('id', scenario.id)
      return jsonDatabaseError(req, tErr ?? new Error('Tape insert failed'))
    }
    tapes.push(mapTape(tape))
  }

  return jsonOk(req, {
    scenario: mapScenario(scenario),
    tapes,
  })
})
