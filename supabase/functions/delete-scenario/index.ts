import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { extractUserId } from '../_shared/auth.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { jsonDatabaseError, jsonError, jsonOk } from '../_shared/errors.ts'
import { orphanClaimDecision } from '../_shared/orphanClaim.ts'
import { sameUuid } from '../_shared/uuid.ts'
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

  if (scenario.is_public) {
    return jsonError(req, 
      'FORBIDDEN',
      'Public scenarios cannot be deleted. Make it private first to regain delete rights.',
      403,
    )
  }

  let mayDelete = false
  if (scenario.owner_id) {
    mayDelete = sameUuid(userId, scenario.owner_id as string)
  } else {
    const decision = await orphanClaimDecision(supabase, scenario.id as string, userId)
    if (decision === 'claim') {
      mayDelete = true
    } else if (decision === 'unattributed') {
      return jsonError(req, 
        'NO_OWNER',
        'This scenario has no owner and only anonymous tapes. Remove tapes in SQL or contact support to delete.',
        409,
      )
    } else {
      mayDelete = false
    }
  }

  if (!mayDelete) {
    return jsonError(req, 'FORBIDDEN', 'You do not have permission to modify this scenario', 403)
  }

  const { error: dErr } = await supabase.from('scenarios').delete().eq('id', scenario.id)

  if (dErr) {
    return jsonDatabaseError(req, dErr)
  }

  return jsonOk(req, { ok: true })
})
