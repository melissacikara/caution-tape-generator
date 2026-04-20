import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { markUnreadForNewTape } from '../_shared/activityUnread.ts'
import { extractUserId } from '../_shared/auth.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { jsonDatabaseError, jsonError, jsonOk } from '../_shared/errors.ts'
import { mapTape } from '../_shared/map.ts'
import { rateLimitOr429 } from '../_shared/rateLimit.ts'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  scenarioSlug: z.string().min(1).max(128),
  tapeText: z.string().min(1).max(2000),
  color: z.string().min(1).max(32),
  idempotencyKey: z.string().min(1).max(128).optional(),
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !key) {
    return jsonError(req, 'SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const limited = rateLimitOr429(req, userId, 'add-tape', {
    max: 60,
    windowMs: 60_000,
  })
  if (limited) return limited

  const supabase = createClient(supabaseUrl, key)
  const { scenarioSlug, tapeText, color, idempotencyKey } = parsed.data

  const { data: scenario, error: sErr } = await supabase
    .from('scenarios')
    .select('id, is_public')
    .eq('public_slug', scenarioSlug)
    .maybeSingle()

  if (sErr) {
    return jsonDatabaseError(req, sErr)
  }
  if (!scenario) {
    return jsonError(req, 'NOT_FOUND', 'Scenario not found', 404)
  }
  // Public scenarios require auth; private/unlisted scenarios allow anonymous adds (link = invitation)
  if (!userId && scenario.is_public) {
    return jsonError(req, 'UNAUTHORIZED', 'Login required to add tapes to a public scenario', 401)
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
        return jsonOk(req, { tape: mapTape(tape), idempotent: true })
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
    return jsonDatabaseError(req, tErr ?? new Error('Tape insert failed'))
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

  await markUnreadForNewTape(supabase, {
    scenarioId: scenario.id,
    tapeAuthorId: (tape.author_id as string | null) ?? null,
    tapeCreatedAt: tape.created_at as string,
  })

  return jsonOk(req, { tape: mapTape(tape), idempotent: false })
})
