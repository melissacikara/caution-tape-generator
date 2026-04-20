import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

import { extractUserId } from '../_shared/auth.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { jsonDatabaseError, jsonError, jsonOk } from '../_shared/errors.ts'
import { mapScenarioRowWithTapeCount } from '../_shared/scenarioList.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  if (req.method !== 'GET') {
    return jsonError(req, 'METHOD_NOT_ALLOWED', 'Use GET', 405)
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

  // Phase 1: follow rows for this user, most recently followed first.
  const { data: followRows, error: fErr } = await supabase
    .from('scenario_follows')
    .select('scenario_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (fErr) {
    return jsonDatabaseError(req, fErr)
  }

  if (!followRows || followRows.length === 0) {
    return jsonOk(req, { scenarios: [] })
  }

  const followIds = followRows.map((r) => r.scenario_id as string)

  // Phase 2: only others' public boards (Following vs My Scenarios; hide went-private).
  // Order by scenarios.created_at DESC for MVP; follow order is not preserved through IN (documented).
  const { data: rows, error: sErr } = await supabase
    .from('scenarios')
    .select(
      `
      id,
      name,
      public_slug,
      owner_id,
      is_public,
      created_at,
      updated_at,
      tapes(count)
    `,
    )
    .in('id', followIds)
    .eq('is_public', true)
    .neq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (sErr) {
    return jsonDatabaseError(req, sErr)
  }

  const scenarios = rows ?? []
  if (scenarios.length === 0) {
    return jsonOk(req, { scenarios: [] })
  }

  const withCounts = scenarios.map((row) => mapScenarioRowWithTapeCount(row))

  return jsonOk(req, { scenarios: withCounts })
})
