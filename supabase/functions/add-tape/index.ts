import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { extractUserId } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'
import { mapTape } from '../_shared/map.ts'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  scenarioSlug: z.string().min(1).max(128),
  tapeText: z.string().min(1).max(2000),
  color: z.string().min(1).max(32),
  idempotencyKey: z.string().min(1).max(128).optional(),
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

  const userId = await extractUserId(req)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !key) {
    return jsonError('SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const supabase = createClient(supabaseUrl, key)
  const { scenarioSlug, tapeText, color, idempotencyKey } = parsed.data

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

  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('idempotency_tapes')
      .select('tape_id')
      .eq('scenario_id', scenario.id)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existing?.tape_id) {
      const { data: tape, error: te } = await supabase
        .from('tapes')
        .select('id, scenario_id, tape_text, color, author_id, created_at, updated_at')
        .eq('id', existing.tape_id)
        .single()
      if (!te && tape) {
        return jsonOk({ tape: mapTape(tape), idempotent: true })
      }
    }
  }

  const { data: tape, error: tErr } = await supabase
    .from('tapes')
    .insert({
      scenario_id: scenario.id,
      tape_text: tapeText,
      color,
      ...(userId ? { author_id: userId } : {}),
    })
    .select('id, scenario_id, tape_text, color, author_id, created_at, updated_at')
    .single()

  if (tErr || !tape) {
    return jsonError('DATABASE_ERROR', tErr?.message ?? 'Insert failed', 500)
  }

  if (idempotencyKey) {
    const { error: idemErr } = await supabase.from('idempotency_tapes').insert({
      idempotency_key: idempotencyKey,
      scenario_id: scenario.id,
      tape_id: tape.id,
    })
    if (idemErr) {
      // Duplicate race: return tape anyway
      console.warn('idempotency insert', idemErr.message)
    }
  }

  return jsonOk({ tape: mapTape(tape), idempotent: false })
})
