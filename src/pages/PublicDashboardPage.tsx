/**
 * Public Dashboard Page
 * Live display for jam sessions showing current song, next song, and upcoming musicians
 * Route: /jams/:jamId/dashboard
 */

import {useState, lazy, Suspense} from 'react'
import {useParams} from 'react-router-dom'
import useSWR from 'swr'
import {SWR_DEFAULTS} from '../config/swrDefaults'
import {
    CurrentSongCard,
    Header,
    DashboardControlsPanel,
    NextSongCard,
    OfflineBanner,
    CarouselDashboard
} from '../components/publicDashboard'
import {useStageHandover} from '../components/publicDashboard/useStageHandover'
import {useJoinSpotlight} from '../components/publicDashboard/useJoinSpotlight'
import {JoinSpotlight} from '../components/publicDashboard/JoinSpotlight'
import {StageFlight} from '../components/publicDashboard/StageFlight'
import {VenueProgramme} from '../components/publicDashboard/VenueProgramme'
import {ShowConfetti} from '../components/publicDashboard/ShowConfetti'
import {useAudienceReactions} from '../components/publicDashboard/useAudienceReactions'
import type {ReactionFeed} from '../lib/realtime/jamReactions'
import {usePageVisible} from '../components/publicDashboard/useVenueChangeMotion'

// Lazy load heavy components to reduce main bundle size
const ConfettiWrapper = lazy(() => import('../components/publicDashboard/ConfettiWrapper'))
const QRCodePanel = lazy(() => import('../components/publicDashboard/carousel/QRCodePanel').then(module => ({default: module.QRCodePanel})))
import {useAppLanguage} from '../hooks'
import {useConfettiOnSongChange} from '../hooks'
import {useFullscreen} from '../hooks'
import {useOfflineQueue} from '../hooks'
import {useDashboardLayout} from '../hooks'
import {useReducedMotion} from '../hooks/useReducedMotion'
import {Action, Alert} from '../components'
import {useTranslation} from 'react-i18next'
import type {LiveDashboardResponseDto} from '../types/api.types'
import type {DashboardLayout} from '../hooks/useDashboardLayout'

export type PublicDashboardViewState =
  | {status: 'loading'}
  | {status: 'error'; message: string}
  | {status: 'stale'; data: LiveDashboardResponseDto; message: string}
  | {status: 'loaded'; data: LiveDashboardResponseDto}

interface PublicDashboardPageProps {
  viewState?: PublicDashboardViewState
  onRetry?: () => void | Promise<void>
  layoutOverride?: DashboardLayout
  /** Review stories feed reactions here instead of the live channel. */
  reactionFeed?: ReactionFeed
}

export function PublicDashboardPage({viewState, onRetry, layoutOverride, reactionFeed}: PublicDashboardPageProps = {}) {
  const { t } = useTranslation()
  const { jamId } = useParams<{ jamId: string }>()
  const { currentLang, changeLanguage } = useAppLanguage()
  const { isOfflineMode } = useOfflineQueue()
  const {prefersReducedMotion} = useReducedMotion()

  // Layout toggle
  const dashboardLayout = useDashboardLayout()
  const layout = layoutOverride ?? dashboardLayout.layout
  const {setLayout, carouselIntervalMs, setCarouselIntervalMs} = dashboardLayout

  // Polling interval (ms) - default 5s, presets available
  const [pollingMs, setPollingMs] = useState<number>(5000)

  // Fetch live dashboard data with SWR
  const swrKey = !viewState && jamId ? `/jams/${jamId}/live/dashboard` : null
  const {
    data: fetchedDashboardData,
    error: fetchError,
    isLoading: fetchLoading,
    mutate,
  } = useSWR<LiveDashboardResponseDto>(swrKey, {
    ...SWR_DEFAULTS,
    refreshInterval: pollingMs,
  })
  const dashboardData = viewState?.status === 'loaded' || viewState?.status === 'stale'
    ? viewState.data
    : fetchedDashboardData
  const error = viewState?.status === 'error' || viewState?.status === 'stale'
    ? new Error(viewState.message)
    : fetchError
  const isLoading = viewState?.status === 'loading' || (!viewState && fetchLoading)

  // Extract fields from response
  const jamName = dashboardData?.jamName ?? null
  const jamStatus = dashboardData?.jamStatus ?? null
  const playbackState = dashboardData?.playbackState ?? 'STOPPED'
  const currentSong = dashboardData?.currentSong ?? null
  const nextSongs = dashboardData?.nextSongs ?? []

  // UI state management
  const [showControlsPanel, setShowControlsPanel] = useState(false)

  // Custom hooks for UI behaviors
  const { confettiVisible, confettiDimensions, containerRef } = useConfettiOnSongChange(
    layout === 'carousel' && !prefersReducedMotion ? currentSong?.id : null
  )
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef)

  // The venue board applauds each band, then the up-next song flies to the stage.
  const pageVisible = usePageVisible()
  const show = useStageHandover({
    currentSong,
    nextSong: nextSongs[0] ?? null,
    playbackState,
    finished: jamStatus === 'FINISHED',
  }, {enabled: layout !== 'carousel', flight: !prefersReducedMotion && pageVisible})
  // New sign-ups get the spotlight, then fly into their lineup slot. The first
  // poll only sets the lineup the room already knows, so it waits for data.
  const stageBusy = Boolean(show.applause || show.boarding)
  const spotlight = useJoinSpotlight(currentSong, nextSongs, {
    enabled: dashboardData !== undefined && layout !== 'carousel' && jamStatus !== 'FINISHED' && pageVisible,
    flight: !prefersReducedMotion && pageVisible,
    paused: stageBusy,
  })
  // The room's reactions float up on the stage while the classic board is on screen.
  const liveReactions = useAudienceReactions(
    dashboardData?.jamId ?? jamId,
    !viewState && !reactionFeed && layout !== 'carousel' && pageVisible && jamStatus !== 'FINISHED',
  )
  const reactions = reactionFeed ?? liveReactions

  // Build ticker text for carousel header
  const tickerText = (() => {
    if (layout !== 'carousel' || !jamName) return null
    const host = typeof window !== 'undefined' ? window.location.host.replace(/^www\./, '') : ''
    const slug = dashboardData?.slug
    const shortCode = dashboardData?.shortCode
    // Use short root-level URL: jamapp.com.br/slug
    const path = slug ? `/${slug}` : shortCode ? `/j/${shortCode}` : ''
    const joinUrl = path ? `${host}${path}` : ''
    const joinLabel =  '' //t('publicDashboard.joinAt', 'Join at')
    return joinUrl ? `${jamName}  |  ${joinLabel} ${joinUrl}` : jamName
  })()

  // Show loading state
  if (isLoading && !currentSong) {
    return (
      <div
        className="min-h-screen bg-base-300 text-base-content ds-shared-display"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">{t('publicDashboard.loading')}</span>
        <div className="pt-20 pb-8 px-4 md:px-8">
          <div className="max-w-6xl mx-auto animate-pulse">
            {/* Now Playing skeleton */}
            <div className="bg-base-200 rounded-2xl p-6 sm:p-8 mb-8">
              <div className="skeleton h-6 w-24 mb-4" />
              <div className="skeleton h-10 w-3/4 mb-3" />
              <div className="skeleton h-6 w-1/2 mb-6" />
              <div className="flex gap-2">
                <div className="skeleton h-8 w-20 rounded-full" />
                <div className="skeleton h-8 w-20 rounded-full" />
                <div className="skeleton h-8 w-20 rounded-full" />
              </div>
            </div>
            {/* Up Next skeleton */}
            <div className="bg-base-200 rounded-xl p-4">
              <div className="skeleton h-4 w-16 mb-3" />
              <div className="skeleton h-6 w-2/3 mb-2" />
              <div className="skeleton h-4 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  // Keep the last usable dashboard visible during a transient polling failure;
  // the offline/stale banner communicates that recovery is in progress.
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4 ds-shared-display">
        <Alert
          type="error"
          message={error.message}
          title={t('publicDashboard.errorTitle')}
          action={(
            <Action
              variant="quiet"
              onClick={() => onRetry ? void onRetry() : void mutate()}
            >
              {t('common.try_again')}
            </Action>
          )}
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-base-300 text-base-content ds-shared-display overflow-hidden relative"
    >
      {/* Confetti */}
      <Suspense fallback={null}>
        <ConfettiWrapper show={layout === 'carousel' && !prefersReducedMotion && confettiVisible} width={confettiDimensions.width} height={confettiDimensions.height} />
      </Suspense>

      {/* The whole display celebrates while the room applauds. */}
      <ShowConfetti applause={layout !== 'carousel' && !prefersReducedMotion && pageVisible ? show.applause?.id ?? null : null} container={containerRef} />

      {/* Offline Indicator */}
      <OfflineBanner
        visible={isOfflineMode || Boolean(error)}
        message={isOfflineMode
          ? t('publicDashboard.offlineIndicator')
          : t('publicDashboard.staleIndicator')}
      />

      {/* Header with controls-panel toggle and fullscreen button */}
      <Header
        title={t('publicDashboard.title', { name: jamName || '' })}
        showControlsPanel={showControlsPanel}
        setShowControlsPanel={setShowControlsPanel}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        ariaToggleLabel={t('publicDashboard.toggleControls')}
        tickerText={tickerText}
      />

      <DashboardControlsPanel
        visible={showControlsPanel}
        jamId={jamId}
        jamSlug={dashboardData?.slug}
        onClose={() => setShowControlsPanel(false)}
        currentLang={currentLang}
        onChangeLanguage={changeLanguage}
        pollingMs={pollingMs}
        onPollingChange={setPollingMs}
        layout={layout}
        onLayoutChange={setLayout}
        carouselIntervalMs={carouselIntervalMs}
        onCarouselIntervalChange={setCarouselIntervalMs}
      />

      {/* Main Content */}
      {layout === 'carousel' ? (
        <CarouselDashboard
          jamStatus={jamStatus}
          playbackState={playbackState}
          currentSong={currentSong}
          nextSongs={nextSongs}
          jamId={dashboardData?.jamId ?? jamId}
          slug={dashboardData?.slug}
          intervalMs={carouselIntervalMs}
        />
      ) : (
        <main className="venue-board">
            {/* The cards resize smoothly when a song change makes them taller or shorter. */}
            <VenueProgramme still={prefersReducedMotion || !pageVisible}>
              {/* Now Playing stays visible while the Jam waits for a current
                  Performance. The next Performance remains a separate region. */}
              {/* The finale stays on the stage card, so the last song rolls
                  out and the closing message rolls in. */}
              <CurrentSongCard song={show.stage} playbackState={playbackState} finished={show.finished} applause={show.applause} awaiting={spotlight.awaiting} boarding={show.boarding?.id} reactions={reactions} />

              {!show.finished && (
                <NextSongCard song={show.next} awaiting={spotlight.awaiting} boarding={show.boarding?.id}>
                  <JoinSpotlight moment={spotlight.next} paused={stageBusy} gentle={prefersReducedMotion} onDone={spotlight.finish} />
                </NextSongCard>
              )}

              {/* After the cards: it measures the up-next card before they change. */}
              <StageFlight boarding={show.boarding} onLand={show.land} />

            </VenueProgramme>
            <Suspense fallback={null}>
              <QRCodePanel
                variant="invitation"
                jamId={dashboardData?.jamId ?? jamId}
                slug={dashboardData?.slug}
                shortCode={dashboardData?.shortCode}
                finished={show.finished}
              >
                <JoinSpotlight moment={spotlight.queue} paused={stageBusy} gentle={prefersReducedMotion} onDone={spotlight.finish} />
              </QRCodePanel>
            </Suspense>
        </main>
      )}
     </div>
   )
 }
