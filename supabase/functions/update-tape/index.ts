import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { extractUserId } from '../_shared/auth.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { jsonDatabaseError, jsonError, jsonOk } from '../_shared/errors.ts'
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
    return jsonError(req, 'UNAUTHORIZED', 'Login required', 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !key) {
    return jsonError(req, 'SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const supabase = createClient(supabaseUrl, key)
  const { scenarioSlug, tapeId, tapeText, color } = parsed.data

  const { data: scenario, error: sErr } = await supabase
    .from('scenarios')
    .select('id, owner_id')
    .eq('public_slug', scenarioSlug)
    .maybeSingle()

  if (sErr) {
    return jsonDatabaseError(req, sErr)
  }
  if (!scenario) {
    return jsonError(req, 'NOT_FOUND', 'Scenario not found', 404)
  }

  const { data: tapeRow, error: tErr } = await supabase
    .from('tapes')
    .select('id, author_id')
    .eq('id', tapeId)
    .eq('scenario_id', scenario.id)
    .maybeSingle()

  if (tErr) return jsonDatabaseError(req, tErr)
  if (!tapeRow) return jsonError(req, 'NOT_FOUND', 'Tape not found in this scenario', 404)

  if (userId !== tapeRow.author_id && userId !== scenario.owner_id) {
    return jsonError(req, 'FORBIDDEN', 'You do not have permission to modify this tape', 403)
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
    .select('id, scenario_id, tape_text, color, author_id, created_at, updated_at')

  if (uErr) {
    return jsonDatabaseError(req, uErr)
  }
  const tape = rows?.[0]
  if (!tape) {
    return jsonError(req, 'NOT_FOUND', 'Tape not found in this scenario', 404)
  }

  return jsonOk(req, { tape: mapTape(tape) })
})
