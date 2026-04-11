import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

import { extractUserId } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'
import { mapScenario, mapTape } from '../_shared/map.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'GET') {
    return jsonError('METHOD_NOT_ALLOWED', 'Use GET', 405)
  }

  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')?.trim()
  if (!slug) {
    return jsonError('BAD_REQUEST', 'Query parameter slug is required', 400)
  }

  // Auth wiring — userId available for Epic 2 permission checks; anonymous access unchanged
  const _userId = await extractUserId(req)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !key) {
    return jsonError('SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const supabase = createClient(supabaseUrl, key)

  const { data: scenario, error: sErr } = await supabase
    .from('scenarios')
    .select('id, name, public_slug, owner_id, created_at, updated_at')
    .eq('public_slug', slug)
    .maybeSingle()

  if (sErr) {
    return jsonError('DATABASE_ERROR', sErr.message, 500)
  }
  if (!scenario) {
    return jsonError('NOT_FOUND', 'Scenario not found', 404)
  }

  const { data: tapeRows, error: tErr } = await supabase
    .from('tapes')
    .select('id, scenario_id, tape_text, color, author_id, created_at, updated_at')
    .eq('scenario_id', scenario.id)
    .order('created_at', { ascending: false })

  if (tErr) {
    return jsonError('DATABASE_ERROR', tErr.message, 500)
  }

  return jsonOk({
    scenario: mapScenario(scenario),
    tapes: (tapeRows ?? []).map(mapTape),
  })
})
