const STORAGE_KEY = 'caution_known_scenario_slugs'

export function getKnownScenarioSlugs(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    return arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
  } catch {
    return []
  }
}

export function rememberScenarioSlug(slug: string): void {
  const s = new Set(getKnownScenarioSlugs())
  s.add(slug.trim())
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]))
}
