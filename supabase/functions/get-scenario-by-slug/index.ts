import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

import { extractUserId } from '../_shared/auth.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { jsonDatabaseError, jsonError, jsonOk } from '../_shared/errors.ts'
import { mapScenario, mapTape } from '../_shared/map.ts'
import { orphanClaimDecision } from '../_shared/orphanClaim.ts'
import { sameUuid } from '../_shared/uuid.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  if (req.method !== 'GET') {
    return jsonError(req, 'METHOD_NOT_ALLOWED', 'Use GET', 405)
  }

  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')?.trim()
  if (!slug) {
    return jsonError(req, 'BAD_REQUEST', 'Query parameter slug is required', 400)
  }

  const userId = await extractUserId(req)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !key) {
    return jsonError(req, 'SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const supabase = createClient(supabaseUrl, key)

  const { data: scenario, error: sErr } = await supabase
    .from('scenarios')
    .select('id, name, public_slug, owner_id, is_public, created_at, updated_at')
    .eq('public_slug', slug)
    .maybeSingle()

  if (sErr) {
    return jsonDatabaseError(req, sErr)
  }
  if (!scenario) {
    return jsonError(req, 'NOT_FOUND', 'Scenario not found', 404)
  }

  // Best-effort invite tracking: record that this logged-in non-owner opened a private board.
  // The upsert is fire-and-complete (await ensures it runs before response) but errors are swallowed
  // so a DB hiccup never blocks the scenario load.
  if (userId && !scenario.is_public && scenario.owner_id !== userId) {
    await supabase
      .from('scenario_invites')
      .upsert(
        { user_id: userId, scenario_id: scenario.id },
        { onConflict: 'user_id,scenario_id', ignoreDuplicates: true },
      )
      .then(() => {})
  }

  const { data: tapeRows, error: tErr } = await supabase
    .from('tapes')
    .select('id, scenario_id, tape_text, color, author_id, created_at, updated_at')
    .eq('scenario_id', scenario.id)
    .order('created_at', { ascending: false })

  if (tErr) {
    return jsonDatabaseError(req, tErr)
  }

  let viewerFollowsScenario = false
  let viewerIsScenarioOwner = false
  if (userId) {
    const { data: followRow, error: foErr } = await supabase
      .from('scenario_follows')
      .select('user_id')
      .eq('user_id', userId)
      .eq('scenario_id', scenario.id)
      .maybeSingle()

    if (foErr) {
      return jsonDatabaseError(req, foErr)
    }
    viewerFollowsScenario = followRow !== null

    if (scenario.owner_id) {
      viewerIsScenarioOwner = sameUuid(userId, scenario.owner_id as string)
    } else {
      const decision = await orphanClaimDecision(supabase, scenario.id as string, userId)
      viewerIsScenarioOwner = decision === 'claim'
    }
  }

  return jsonOk(req, {
    scenario: mapScenario(scenario),
    tapes: (tapeRows ?? []).map(mapTape),
    ...(userId
      ? { viewerFollowsScenario, viewerIsScenarioOwner }
      : {}),
  })
})
