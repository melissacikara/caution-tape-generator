import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'
import { mapTape } from '../_shared/map.ts'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  scenarioSlug: z.string().min(1).max(128),
  tapeId: z.string().uuid(),
  tapeText: z.string().min(1).max(2000),
  color: z.string().min(1).max(32),
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !key) {
    return jsonError('SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const supabase = createClient(supabaseUrl, key)
  const { scenarioSlug, tapeId, tapeText, color } = parsed.data

  const { data: scenario, error: sErr } = await supabase
    .from('scenarios')
    .select('id')
    .eq('public_slug', scenarioSlug)
    .maybeSingle()

  if (sErr) {
    return jsonError('DATABASE_ERROR', sErr.message, 500)
  }
  if (!scenario) {
    return jsonError('NOT_FOUND', 'Scenario not found', 404)
  }

  const { data: rows, error: uErr } = await supabase
    .from('tapes')
    .update({
      tape_text: tapeText,
      color,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tapeId)
    .eq('scenario_id', scenario.id)
    .select('id, scenario_id, tape_text, color, created_at, updated_at')

  if (uErr) {
    return jsonError('DATABASE_ERROR', uErr.message, 500)
  }
  const tape = rows?.[0]
  if (!tape) {
    return jsonError('NOT_FOUND', 'Tape not found in this scenario', 404)
  }

  return jsonOk({ tape: mapTape(tape) })
})
