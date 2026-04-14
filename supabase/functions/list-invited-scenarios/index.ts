import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

import { extractUserId } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'
import { mapScenario } from '../_shared/map.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'GET') {
    return jsonError('METHOD_NOT_ALLOWED', 'Use GET', 405)
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

  // Phase 1: get scenario IDs for this user's invites, most recently joined first.
  const { data: inviteRows, error: iErr } = await supabase
    .from('scenario_invites')
    .select('scenario_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (iErr) {
    return jsonError('DATABASE_ERROR', iErr.message, 500)
  }

  if (!inviteRows || inviteRows.length === 0) {
    return jsonOk({ scenarios: [] })
  }

  const inviteIds = inviteRows.map((r) => r.scenario_id as string)

  // Phase 2: fetch scenario rows — only private boards the user is a guest on.
  // Exclude public (they appear in the Public feed) and owned (they appear in My Scenarios).
  // Order by created_at DESC for consistency with My Scenarios; invite order is not preserved
  // by the IN query but is acceptable for MVP (documented decision).
  const { data: rows, error: sErr } = await supabase
    .from('scenarios')
    .select('id, name, public_slug, owner_id, is_public, created_at, updated_at')
    .in('id', inviteIds)
    .eq('is_public', false)
    .neq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (sErr) {
    return jsonError('DATABASE_ERROR', sErr.message, 500)
  }

  const scenarios = rows ?? []
  if (scenarios.length === 0) {
    return jsonOk({ scenarios: [] })
  }

  const ids = scenarios.map((s) => s.id)
  const { data: tapeRows, error: tErr } = await supabase
    .from('tapes')
    .select('scenario_id')
    .in('scenario_id', ids)

  if (tErr) {
    return jsonError('DATABASE_ERROR', tErr.message, 500)
  }

  const countByScenario = new Map<string, number>()
  for (const r of tapeRows ?? []) {
    const sid = r.scenario_id as string
    countByScenario.set(sid, (countByScenario.get(sid) ?? 0) + 1)
  }

  const withCounts = scenarios.map((row) => ({
    scenario: mapScenario(row),
    tapeCount: countByScenario.get(row.id) ?? 0,
  }))

  return jsonOk({ scenarios: withCounts })
})
