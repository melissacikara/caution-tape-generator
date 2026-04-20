import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.23.8'

import { extractUserId } from '../_shared/auth.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { jsonDatabaseError, jsonError, jsonOk } from '../_shared/errors.ts'
import { mapScenario } from '../_shared/map.ts'
import { mapScenarioRowWithTapeCount } from '../_shared/scenarioList.ts'
import { formatZodError } from '../_shared/zod.ts'

const bodySchema = z.object({
  slugs: z.array(z.string().min(1).max(128)).max(50),
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

  // Auth wiring — userId available for Epic 2/4 ownership filtering; anonymous access unchanged
  const _userId = await extractUserId(req)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !key) {
    return jsonError(req, 'SERVER_CONFIG', 'Missing Supabase env', 500)
  }

  const supabase = createClient(supabaseUrl, key)
  const uniqueSlugs = [...new Set(parsed.data.slugs)]

  if (uniqueSlugs.length === 0) {
    return jsonOk(req, { scenarios: [] as { scenario: ReturnType<typeof mapScenario>; tapeCount: number }[] })
  }

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
    .in('public_slug', uniqueSlugs)

  if (sErr) {
    return jsonDatabaseError(req, sErr)
  }

  const scenarios = rows ?? []
  if (scenarios.length === 0) {
    return jsonOk(req, { scenarios: [] })
  }

  const withCounts = scenarios.map((row) => mapScenarioRowWithTapeCount(row))

  withCounts.sort(
    (a, b) =>
      new Date(b.scenario.createdAt).getTime() - new Date(a.scenario.createdAt).getTime(),
  )

  return jsonOk(req, { scenarios: withCounts })
})
