import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { extractUserId } from '../_shared/auth.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { jsonDatabaseError, jsonError, jsonOk } from '../_shared/errors.ts'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  scenarioSlug: z.string().min(1).max(128),
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
  const { scenarioSlug } = parsed.data

  const { data: scenario, error: sErr } = await supabase
    .from('scenarios')
    .select('id, owner_id, is_public')
    .eq('public_slug', scenarioSlug)
    .maybeSingle()

  if (sErr) {
    return jsonDatabaseError(req, sErr)
  }
  if (!scenario) {
    return jsonError(req, 'NOT_FOUND', 'Scenario not found', 404)
  }

  if (!scenario.is_public) {
    return jsonError(req, 'FORBIDDEN', 'Only public scenarios can be followed', 403)
  }
  if (scenario.owner_id === userId) {
    return jsonError(req, 'FORBIDDEN', 'You cannot follow your own scenario', 403)
  }

  const { error: iErr } = await supabase.from('scenario_follows').upsert(
    { user_id: userId, scenario_id: scenario.id },
    { onConflict: 'user_id,scenario_id', ignoreDuplicates: true },
  )

  if (iErr) {
    return jsonDatabaseError(req, iErr)
  }

  return jsonOk(req, { ok: true })
})
