import { mapScenario } from './map.ts'

/** PostgREST embed `tapes(count)` returns `tapes: [{ count: n }]` (or empty / missing when zero). */
export function mapScenarioRowWithTapeCount(row: {
  id: string
  name: string
  public_slug: string
  owner_id?: string | null
  is_public: boolean
  created_at: string
  updated_at?: string
  tapes?: { count: number }[] | null
}): { scenario: ReturnType<typeof mapScenario>; tapeCount: number } {
  const { tapes, ...rest } = row
  const tapeCount =
    Array.isArray(tapes) && tapes[0] != null && typeof tapes[0].count === 'number'
      ? Number(tapes[0].count)
      : 0
  return { scenario: mapScenario(rest), tapeCount }
}
