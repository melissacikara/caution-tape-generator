import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { extractUserId } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  scenarioSlug: z.string().min(1).max(128),
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
  if (!userId) {
    return jsonError('UNAUTHORIZED', 'Login required', 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !key) {
    return jsonError('SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const supabase = createClient(supabaseUrl, key)
  const { scenarioSlug } = parsed.data

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

  const { error: dErr } = await supabase
    .from('scenario_follows')
    .delete()
    .eq('user_id', userId)
    .eq('scenario_id', scenario.id)

  if (dErr) {
    return jsonError('DATABASE_ERROR', dErr.message, 500)
  }

  const { error: uErr } = await supabase.from('scenario_user_unread').upsert(
    {
      user_id: userId,
      scenario_id: scenario.id,
      has_unread: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,scenario_id' },
  )

  if (uErr) {
    return jsonError('DATABASE_ERROR', uErr.message, 500)
  }

  return jsonOk({ ok: true })
})
