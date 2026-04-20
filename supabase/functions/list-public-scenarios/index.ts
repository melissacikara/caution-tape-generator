import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !key) {
    return jsonError(req, 'SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const supabase = createClient(supabaseUrl, key)

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
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (sErr) {
    return jsonDatabaseError(req, sErr)
  }

  const withCounts = (rows ?? []).map((row) => mapScenarioRowWithTapeCount(row))

  return jsonOk(req, { scenarios: withCounts })
})
