import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'
import { mapScenario, mapTape } from '../_shared/map.ts'
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
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonError('METHOD_NOT_ALLOWED', 'Use POST', 405)
  }

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

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    return jsonError('SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const supabase = createClient(url, key)

  const { name, firstTape } = parsed.data

  const { data: scenario, error: sErr } = await supabase
    .from('scenarios')
    .insert({ name })
    .select('id, name, public_slug, created_at, updated_at')
    .single()

  if (sErr || !scenario) {
    return jsonError('DATABASE_ERROR', sErr?.message ?? 'Insert failed', 500)
  }

  const tapes: ReturnType<typeof mapTape>[] = []

  if (firstTape) {
    const { data: tape, error: tErr } = await supabase
      .from('tapes')
      .insert({
        scenario_id: scenario.id,
        tape_text: firstTape.tapeText,
        color: firstTape.color,
      })
      .select('id, scenario_id, tape_text, color, created_at, updated_at')
      .single()

    if (tErr || !tape) {
      await supabase.from('scenarios').delete().eq('id', scenario.id)
      return jsonError('DATABASE_ERROR', tErr?.message ?? 'Tape insert failed', 500)
    }
    tapes.push(mapTape(tape))
  }

  return jsonOk({
    scenario: mapScenario(scenario),
    tapes,
  })
})
