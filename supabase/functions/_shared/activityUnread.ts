import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

export type MarkUnreadForNewTapeArgs = {
  scenarioId: string
  tapeAuthorId: string | null
  /** ISO 8601 from DB (`tapes.created_at`) — compared lexicographically to invite/follow `created_at`. */
  tapeCreatedAt: string
}

/**
 * Fan-out unread markers to owner, invitees, and followers after a **new** tape insert.
 * Call only on successful insert — not on idempotent replay.
 */
export async function markUnreadForNewTape(
  supabase: SupabaseClient,
  args: MarkUnreadForNewTapeArgs,
): Promise<void> {
  const { scenarioId, tapeAuthorId, tapeCreatedAt } = args

  const [{ data: scenarioRow, error: sErr }, { data: inviteRows, error: iErr }, { data: followRows, error: fErr }] =
    await Promise.all([
      supabase.from('scenarios').select('owner_id').eq('id', scenarioId).single(),
      supabase.from('scenario_invites').select('user_id, created_at').eq('scenario_id', scenarioId),
      supabase.from('scenario_follows').select('user_id, created_at').eq('scenario_id', scenarioId),
    ])

  if (sErr || !scenarioRow) {
    console.warn('markUnreadForNewTape: scenario fetch failed', sErr?.message)
    return
  }
  if (iErr) {
    console.warn('markUnreadForNewTape: invites', iErr.message)
  }
  if (fErr) {
    console.warn('markUnreadForNewTape: follows', fErr.message)
  }

  const recipientIds = new Set<string>()
  const ownerId = scenarioRow.owner_id as string | null
  if (ownerId !== null && ownerId !== tapeAuthorId) {
    recipientIds.add(ownerId)
  }

  // Anti-retroactive unread: only invitees whose membership existed at tape time (`<=` tape created_at).
  for (const row of inviteRows ?? []) {
    const uid = row.user_id as string
    const invitedAt = row.created_at as string
    if (invitedAt <= tapeCreatedAt && uid !== tapeAuthorId) {
      recipientIds.add(uid)
    }
  }

  for (const row of followRows ?? []) {
    const uid = row.user_id as string
    const followedAt = row.created_at as string
    if (followedAt <= tapeCreatedAt && uid !== tapeAuthorId) {
      recipientIds.add(uid)
    }
  }

  if (recipientIds.size === 0) {
    return
  }

  const rows = [...recipientIds].map((user_id) => ({
    user_id,
    scenario_id: scenarioId,
    has_unread: true,
    updated_at: new Date().toISOString(),
  }))

  const { error: uErr } = await supabase.from('scenario_user_unread').upsert(rows, {
    onConflict: 'user_id,scenario_id',
  })
  if (uErr) {
    console.warn('markUnreadForNewTape: upsert', uErr.message)
  }
}
