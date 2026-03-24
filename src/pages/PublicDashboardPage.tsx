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
    Navbar,
    NextSongCard,
    OfflineBanner,
    StartingSoonCard,
    CarouselDashboard
} from '../components/publicDashboard'

// Lazy load heavy components to reduce main bundle size
const ConfettiWrapper = lazy(() => import('../components/publicDashboard/ConfettiWrapper'))
const QRCodeCorner = lazy(() => import('../components/publicDashboard/QRCodeCorner'))
import {useAppLanguage} from '../hooks'
import {useConfettiOnSongChange} from '../hooks'
import {useFullscreen} from '../hooks'
import {useOfflineQueue} from '../hooks'
import {useDashboardLayout} from '../hooks'
import {Alert, FullPageSpinner} from '../components'
import {useTranslation} from 'react-i18next'
import type {LiveDashboardResponseDto} from '../types/api.types'

export function PublicDashboardPage() {
  const { t } = useTranslation()
  const { jamId } = useParams<{ jamId: string }>()
  const { currentLang, changeLanguage } = useAppLanguage()
  const { isOfflineMode } = useOfflineQueue()

  // Layout toggle
  const { layout, setLayout, carouselIntervalMs, setCarouselIntervalMs } = useDashboardLayout()

  // Polling interval (ms) - default 5s, presets available
  const [pollingMs, setPollingMs] = useState<number>(5000)

  // Fetch live dashboard data with SWR
  const swrKey = jamId ? `/jams/${jamId}/live/dashboard` : null
  const {
    data: dashboardData,
    error,
    isLoading,
  } = useSWR<LiveDashboardResponseDto>(swrKey, {
    ...SWR_DEFAULTS,
    refreshInterval: pollingMs,
  })

  // Extract fields from response
  const jamName = dashboardData?.jamName ?? null
  const jamStatus = dashboardData?.jamStatus ?? null
  const currentSong = dashboardData?.currentSong ?? null
  const nextSongs = dashboardData?.nextSongs ?? []

  // UI state management
  const [showNavbar, setShowNavbar] = useState(false)

  // Custom hooks for UI behaviors
  const { confettiVisible, confettiDimensions, containerRef } = useConfettiOnSongChange(
    currentSong?.id
  )
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef)

  // When jam hasn't started, StartingSoonCard shows nextSongs[0],
  // so NextSongCard should show nextSongs[1] to avoid duplicate
  const isNotStarted = !currentSong
  const nextSongToShow = isNotStarted ? nextSongs[1] : nextSongs[0]

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
    return <FullPageSpinner />
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <Alert type="error" message={error.message} title={t('publicDashboard.errorTitle', 'Error Loading Dashboard')} />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen animate-gradient-shift text-white overflow-hidden relative"
      data-theme="dark"
    >
      {/* Radial Glow Spotlight */}
      <div className="radial-glow" />

      {/* Confetti */}
      <Suspense fallback={null}>
        <ConfettiWrapper show={confettiVisible} width={confettiDimensions.width} height={confettiDimensions.height} />
      </Suspense>

      {/* Offline Indicator */}
      <OfflineBanner visible={isOfflineMode} message={t('publicDashboard.offlineIndicator', 'You are offline - showing cached data')} />

      {/* Header with Navbar Toggle & Fullscreen Button */}
      <Header
        title={t('publicDashboard.title', { name: jamName || '' })}
        showNavbar={showNavbar}
        setShowNavbar={setShowNavbar}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        ariaToggleLabel={t('publicDashboard.toggleNavbar', 'Toggle navbar')}
        tickerText={tickerText}
      />

      <Navbar
        visible={showNavbar}
        jamId={jamId}
        jamSlug={dashboardData?.slug}
        onClose={() => setShowNavbar(false)}
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
          currentSong={currentSong}
          nextSongs={nextSongs}
          jamId={jamId}
          slug={dashboardData?.slug}
          intervalMs={carouselIntervalMs}
        />
      ) : (
        <>
          <div className="relative pt-20 pb-8 px-4 md:px-8 z-10">
            <div className="max-w-6xl mx-auto">
              {/* Current Song / Starting Soon Section */}
              {jamStatus === 'FINISHED' ? (
                <div className="mb-12 text-center">
                  <div className="bg-linear-to-br from-slate-800/40 to-slate-700/40 backdrop-blur border border-slate-500/30 rounded-2xl p-8 md:p-12">
                    <p className="text-5xl md:text-7xl mb-6">👏</p>
                    <h2 className="text-4xl md:text-6xl font-black mb-4">{t('publicDashboard.jamFinished', 'That\'s a wrap!')}</h2>
                    <p className="text-lg md:text-2xl text-slate-300">{t('publicDashboard.thankYou', 'Thanks for jamming with us!')}</p>
                  </div>
                </div>
              ) : currentSong ? (
                <CurrentSongCard song={currentSong} />
              ) : (
                <StartingSoonCard song={nextSongs[0] ?? null} />
              )}

              {/* Next Song Section - only if there's a different song to show */}
              {nextSongToShow && (
                <NextSongCard song={nextSongToShow} />
              )}

            </div>
          </div>

          {/* QR Code Corners */}
          <Suspense fallback={null}>
            <QRCodeCorner jamId={jamId} shortCode={dashboardData?.shortCode} position="top-left" />
            <QRCodeCorner jamId={jamId} shortCode={dashboardData?.shortCode} position="top-right" />
          </Suspense>
        </>
      )}
     </div>
   )
 }
