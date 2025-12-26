/**
 * Public Dashboard Page
 * Live display for jam sessions showing current song, next song, and upcoming musicians
 * Route: /jams/:jamId/dashboard
 */

import {useEffect, useState} from 'react'
import {useParams} from 'react-router-dom'
import {
    ConfettiWrapper,
    CurrentSongCard,
    Header,
    Navbar,
    NextSongCard,
    OfflineBanner,
    QRCodeCorner,
    StartingSoonCard
} from '../components/publicDashboard'
import {useAppLanguage, useConfettiOnSongChange, useDashboardLive, useFullscreen, useOfflineQueue} from '../hooks'
import {ErrorAlert} from "../components"
import {useTranslation} from 'react-i18next'

export function PublicDashboardPage() {
  const { t } = useTranslation()
  const { jamId } = useParams<{ jamId: string }>()
  const { currentLang, changeLanguage } = useAppLanguage()

  // Use dashboard-specific live polling hook
  const dashboard = useDashboardLive(jamId, { pollingIntervalMs: 5000 })
  const { isOfflineMode } = useOfflineQueue()

  // Polling interval (ms) - default 5s, presets available
  const [pollingMs, setPollingMs] = useState<number>(5000)

  // Wire polling interval to dashboard hook
  useEffect(() => {
    dashboard.setPollingIntervalMs(pollingMs)
  }, [pollingMs, dashboard])

  // UI state management
  const [showNavbar, setShowNavbar] = useState(false)

  // Custom hooks for UI behaviors
  const { confettiVisible, confettiDimensions, containerRef } = useConfettiOnSongChange(
    dashboard.currentSong?.id
  )
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef)

  // Dashboard data is already sorted and filtered from the endpoint
  const nextSongs = dashboard.nextSongs || []

  // Get first scheduled song for "starting soon" display
  const firstScheduledSong = dashboard.currentSong || nextSongs[0]

  // Show loading state
  if (dashboard.isLoading && !dashboard.currentSong) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  // Show error state
  if (dashboard.error) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <ErrorAlert message={dashboard.error.message} title={t('publicDashboard.errorTitle', 'Error Loading Dashboard')} />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden"
      data-theme="dark"
    >
      {/* Confetti */}
      <ConfettiWrapper show={confettiVisible} width={confettiDimensions.width} height={confettiDimensions.height} />

      {/* Offline Indicator */}
      <OfflineBanner visible={isOfflineMode} message={t('publicDashboard.offlineIndicator', 'You are offline - showing cached data')} />

      {/* Header with Navbar Toggle & Fullscreen Button */}
      <Header
        title={t('publicDashboard.title', { name: dashboard.jamName || '' })}
        showNavbar={showNavbar}
        setShowNavbar={setShowNavbar}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        currentLang={currentLang}
        onChangeLanguage={changeLanguage}
        ariaToggleLabel={t('publicDashboard.toggleNavbar', 'Toggle navbar')}
      />

      <Navbar
        visible={showNavbar}
        jamId={jamId}
        onClose={() => setShowNavbar(false)}
        currentLang={currentLang}
        onChangeLanguage={changeLanguage}
        pollingMs={pollingMs}
        onPollingChange={setPollingMs}
      />

      {/* Main Content */}
      <div className="pt-20 pb-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Current Song Section */}
          {dashboard.currentSong ? (
            <CurrentSongCard song={dashboard.currentSong} />
          ) : firstScheduledSong ? (
            <StartingSoonCard song={firstScheduledSong} />
          ) : null}

          {/* Next Song Section */}
          {nextSongs && nextSongs.length > 0 && nextSongs[0] && (
            <NextSongCard song={nextSongs[0]} />
          )}

         </div>
       </div>

       {/* QR Code Corner */}
      <QRCodeCorner jamId={jamId} />
     </div>
   )
 }
