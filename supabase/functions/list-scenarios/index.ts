import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { corsHeaders } from '../_shared/cors.ts'
import { jsonError, jsonOk } from '../_shared/errors.ts'
import { mapScenario } from '../_shared/map.ts'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  slugs: z.array(z.string().min(1).max(128)).max(50),
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !key) {
    return jsonError('SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const supabase = createClient(supabaseUrl, key)
  const uniqueSlugs = [...new Set(parsed.data.slugs)]

  if (uniqueSlugs.length === 0) {
    return jsonOk({ scenarios: [] as { scenario: ReturnType<typeof mapScenario>; tapeCount: number }[] })
  }

  const { data: rows, error: sErr } = await supabase
    .from('scenarios')
    .select('id, name, public_slug, created_at, updated_at')
    .in('public_slug', uniqueSlugs)

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

  withCounts.sort(
    (a, b) =>
      new Date(b.scenario.createdAt).getTime() - new Date(a.scenario.createdAt).getTime(),
  )

  return jsonOk({ scenarios: withCounts })
})
