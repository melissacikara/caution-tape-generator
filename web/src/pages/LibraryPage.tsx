import { startTransition, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { LoginModal } from '../components/LoginModal'
import { ScenarioLibrary } from '../components/ScenarioLibrary'
import { useLoginGate } from '../hooks/useLoginGate'
import { useAuth } from '../providers/AuthProvider'
import {
  ApiError,
  isSupabaseConfigured,
  listFollowedScenarios,
  listInvitedScenarios,
  listMyScenarios,
  listPublicScenarios,
  listUnreadScenarios,
} from '../api/client'
import { scenarioKeys } from '../api/queryKeys'

export function LibraryPage() {
  const { user, loading } = useAuth()
  const { isLoginGateOpen, openLoginGate, closeLoginGate } = useLoginGate()
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: scenarioKeys.publicFeed,
    queryFn: listPublicScenarios,
    enabled: isSupabaseConfigured(),
  })

  // Warm Private tab while on Public: fetch when logged in (same pattern as optional "fewer calls" alternative).
  const {
    data: myData,
    isLoading: myLoading,
    error: myError,
    refetch: refetchMine,
  } = useQuery({
    queryKey: scenarioKeys.myScenarios(user?.id ?? '__none__'),
    queryFn: listMyScenarios,
    enabled: isSupabaseConfigured() && user !== null,
  })

  // Invited bucket — warmed alongside My Scenarios when user is logged in.
  const {
    data: invitedData,
    isLoading: invitedLoading,
    error: invitedError,
    refetch: refetchInvited,
  } = useQuery({
    queryKey: scenarioKeys.invitedScenarios(user?.id ?? '__none__'),
    queryFn: listInvitedScenarios,
    enabled: isSupabaseConfigured() && user !== null,
  })

  const {
    data: followingData,
    isLoading: followingLoading,
    error: followingError,
    refetch: refetchFollowing,
  } = useQuery({
    queryKey: scenarioKeys.followingScenarios(user?.id ?? '__none__'),
    queryFn: listFollowedScenarios,
    enabled: isSupabaseConfigured() && user !== null,
  })

  const { data: unreadData } = useQuery({
    queryKey: scenarioKeys.unread(user?.id ?? '__none__'),
    queryFn: listUnreadScenarios,
    enabled: isSupabaseConfigured() && user !== null,
  })

  const unreadIds = useMemo(
    () => new Set(unreadData?.scenarioIds ?? []),
    [unreadData?.scenarioIds],
  )

  function switchTab(tab: 'public' | 'private') {
    startTransition(() => setActiveTab(tab))
  }

  const tabBase =
    'min-h-[44px] flex-1 cursor-pointer px-4 py-2 font-ui text-sm uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
  const activeTabClass = `${tabBase} bg-surface-raised border-b-2 border-accent text-foreground`
  const inactiveTabClass = `${tabBase} text-muted hover:text-foreground`

  return (
    <>
      <main className="flex justify-center px-4 py-8">
        <div className="w-full max-w-[480px] md:max-w-[640px]">
          <h1 className="font-display text-2xl uppercase tracking-wide text-foreground">
            Library
          </h1>

          <div className="mt-4 flex border-b border-border" role="tablist" aria-label="Library tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'public'}
              aria-controls="tab-panel-public"
              id="tab-public"
              className={activeTab === 'public' ? activeTabClass : inactiveTabClass}
              onClick={() => switchTab('public')}
            >
              Public
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'private'}
              aria-controls="tab-panel-private"
              id="tab-private"
              className={activeTab === 'private' ? activeTabClass : inactiveTabClass}
              onClick={() => switchTab('private')}
            >
              Private
            </button>
          </div>

          {activeTab === 'public' ? (
            <div
              id="tab-panel-public"
              role="tabpanel"
              aria-labelledby="tab-public"
              className="mt-6"
            >
              {isSupabaseConfigured() ? (
                <ScenarioLibrary
                  items={data?.scenarios ?? []}
                  isLoading={isLoading}
                  errorMessage={
                    error instanceof ApiError
                      ? error.message
                      : error
                        ? 'Could not load public scenarios.'
                        : undefined
                  }
                  onRetry={() => void refetch()}
                  emptyMessage="No public scenarios yet. Check back soon."
                  zeroTapeCaption="No tapes on this board yet."
                />
              ) : null}
            </div>
          ) : null}

          {activeTab === 'private' ? (
            <div
              id="tab-panel-private"
              role="tabpanel"
              aria-labelledby="tab-private"
              className="mt-6"
            >
              {loading ? (
                <ScenarioLibrary items={[]} isLoading />
              ) : user === null ? (
                <div className="flex flex-col gap-4">
                  <p className="font-ui text-sm text-foreground">
                    Your private collection lives here.
                  </p>
                  <p className="font-ui text-sm text-muted">
                    Log in to see your scenarios, invites, and followed boards.
                  </p>
                  <button
                    type="button"
                    onClick={openLoginGate}
                    className="min-h-[44px] cursor-pointer self-start bg-accent px-4 py-2 font-ui text-sm font-medium text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Log in
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {isSupabaseConfigured() ? (
                    <section aria-labelledby="my-scenarios-heading">
                      <h2
                        id="my-scenarios-heading"
                        className="font-display text-xl uppercase tracking-wide text-foreground"
                      >
                        My Scenarios
                      </h2>
                      <div className="mt-4">
                        {myLoading ? (
                          <ScenarioLibrary items={[]} isLoading />
                        ) : myError ? (
                          <ScenarioLibrary
                            items={[]}
                            isLoading={false}
                            errorMessage={
                              myError instanceof ApiError
                                ? myError.message
                                : 'Could not load your scenarios.'
                            }
                            onRetry={() => void refetchMine()}
                          />
                        ) : (
                          <ScenarioLibrary
                            items={myData?.scenarios ?? []}
                            isLoading={false}
                            emptyMessage={
                              <>
                                You haven&apos;t created any scenarios yet.{' '}
                                <Link
                                  to="/create"
                                  className="inline-flex min-h-[44px] items-center text-accent underline decoration-accent underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                >
                                  Create your own!
                                </Link>
                              </>
                            }
                            unreadScenarioIds={unreadIds}
                          />
                        )}
                      </div>
                    </section>
                  ) : null}
                  {isSupabaseConfigured() ? (
                    <section aria-labelledby="invited-heading">
                      <h2
                        id="invited-heading"
                        className="font-display text-xl uppercase tracking-wide text-foreground"
                      >
                        Invited
                      </h2>
                      <div className="mt-4">
                        {invitedLoading ? (
                          <ScenarioLibrary items={[]} isLoading />
                        ) : invitedError ? (
                          <ScenarioLibrary
                            items={[]}
                            isLoading={false}
                            errorMessage={
                              invitedError instanceof ApiError
                                ? invitedError.message
                                : 'Could not load your invited scenarios.'
                            }
                            onRetry={() => void refetchInvited()}
                          />
                        ) : (
                          <ScenarioLibrary
                            items={invitedData?.scenarios ?? []}
                            isLoading={false}
                            emptyMessage="No scenarios have been shared with you yet."
                            unreadScenarioIds={unreadIds}
                          />
                        )}
                      </div>
                    </section>
                  ) : null}
                  {isSupabaseConfigured() ? (
                    <section aria-labelledby="following-heading">
                      <h2
                        id="following-heading"
                        className="font-display text-xl uppercase tracking-wide text-foreground"
                      >
                        Following
                      </h2>
                      <div className="mt-4">
                        {followingLoading ? (
                          <ScenarioLibrary items={[]} isLoading />
                        ) : followingError ? (
                          <ScenarioLibrary
                            items={[]}
                            isLoading={false}
                            errorMessage={
                              followingError instanceof ApiError
                                ? followingError.message
                                : 'Could not load followed scenarios.'
                            }
                            onRetry={() => void refetchFollowing()}
                          />
                        ) : (
                          <ScenarioLibrary
                            items={followingData?.scenarios ?? []}
                            isLoading={false}
                            emptyMessage="You're not following any scenarios yet. Open a public board and use Follow to save it here."
                            unreadScenarioIds={unreadIds}
                          />
                        )}
                      </div>
                    </section>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>

      {isLoginGateOpen ? <LoginModal onClose={closeLoginGate} /> : null}
    </>
  )
}
