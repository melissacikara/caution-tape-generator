/** Map DB row (snake_case) to HTTP DTO (camelCase). */

export function mapScenario(row: {
  id: string
  name: string
  public_slug: string
  created_at: string
  updated_at?: string
}) {
  return {
    id: row.id,
    name: row.name,
    publicSlug: row.public_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapTape(row: {
  id: string
  scenario_id: string
  tape_text: string
  color: string
  created_at: string
}) {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    tapeText: row.tape_text,
    color: row.color,
    createdAt: row.created_at,
  }
}
