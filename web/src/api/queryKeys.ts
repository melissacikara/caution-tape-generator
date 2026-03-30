export const scenarioKeys = {
  all: ['scenarios'] as const,
  bySlug: (slug: string) => [...scenarioKeys.all, 'slug', slug] as const,
  /** Stable key for a sorted list of public slugs (device “known” scenarios). */
  list: (slugsSorted: string) => [...scenarioKeys.all, 'list', slugsSorted] as const,
}
