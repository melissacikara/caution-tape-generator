import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

import { extractUserId } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'

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

  const { data: rows, error } = await supabase
    .from('scenario_user_unread')
    .select('scenario_id')
    .eq('user_id', userId)
    .eq('has_unread', true)

  if (error) {
    return jsonError('DATABASE_ERROR', error.message, 500)
  }

  const scenarioIds = (rows ?? []).map((r) => r.scenario_id as string)
  return jsonOk({ scenarioIds })
})
