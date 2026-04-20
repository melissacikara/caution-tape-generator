import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

import { sameUuid } from './uuid.ts'

export type SupabaseServiceClient = ReturnType<typeof createClient>

/**
 * Orphan scenario (owner_id null): caller may claim only when no tape is attributed
 * to someone else. All-null authors cannot be claimed safely → unattributed.
 */
export async function orphanClaimDecision(
  supabase: SupabaseServiceClient,
  scenarioId: string,
  userId: string,
): Promise<'claim' | 'forbidden' | 'unattributed'> {
  const { data: rows, error } = await supabase
    .from('tapes')
    .select('author_id')
    .eq('scenario_id', scenarioId)

  if (error) return 'unattributed'
  const tapes = rows ?? []
  if (tapes.length === 0) return 'claim'

  for (const t of tapes) {
    const a = t.author_id as string | null
    if (a != null && !sameUuid(a, userId)) return 'forbidden'
  }

  const hasAttributedTape = tapes.some((t) => (t.author_id as string | null) != null)
  if (!hasAttributedTape) return 'unattributed'
  return 'claim'
}
