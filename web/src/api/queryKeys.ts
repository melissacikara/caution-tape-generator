export const scenarioKeys = {
  all: ['scenarios'] as const,
  bySlug: (slug: string) => [...scenarioKeys.all, 'slug', slug] as const,
  /** Stable key for a sorted list of public slugs (device "known" scenarios). */
  list: (slugsSorted: string) => [...scenarioKeys.all, 'list', slugsSorted] as const,
  publicFeed: ['scenarios', 'public-feed'] as const,
  /** Owned scenarios for the signed-in user; include userId so caches do not leak across accounts. */
  myScenarios: (userId: string) => [...scenarioKeys.all, 'mine', userId] as const,
  /** Private scenarios the user was invited to (accessed via link); userId prevents cross-account cache leaks. */
  invitedScenarios: (userId: string) => [...scenarioKeys.all, 'invited', userId] as const,
  /** Public scenarios the user follows; userId prevents cross-account cache leaks. */
  followingScenarios: (userId: string) => [...scenarioKeys.all, 'following', userId] as const,
}
