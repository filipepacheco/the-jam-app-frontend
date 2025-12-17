/**
 * Public Dashboard Page
 * Live display for jam sessions showing current song, next song, and upcoming musicians
 * Route: /jams/:jamId/dashboard
 */

import {useEffect, useRef, useState} from 'react'
import {useParams} from 'react-router-dom'
import {motion} from 'framer-motion'
import Confetti from 'react-confetti'
import type {RegistrationResponseDto} from '../types/api.types'
import {getInstrumentIcon} from '../components/schedule/RegistrationList'
import {ConnectionStatus, ErrorAlert} from '../components'
import {QRCodeSVG} from "qrcode.react"
import {useJamState, useOfflineQueue, useSocketError} from '../hooks'
import {formatDuration} from '../lib/formatters'

export function PublicDashboardPage() {
  const { jamId } = useParams<{ jamId: string }>()

  // Use global jam state via JamContext
  const { jam, currentPerformance, schedule, joinJam, leaveJam, isLoading, error } = useJamState()
  const { userMessage, recoveryAction, clearError, hasError } = useSocketError('PublicDashboard')
  const { isOfflineMode } = useOfflineQueue()

  // State
  const [showConfetti, setShowConfetti] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showNavbar, setShowNavbar] = useState(false)
  const [confettiDimensions, setConfettiDimensions] = useState({ width: 0, height: 0 })
  const [previousInProgressId, setPreviousInProgressId] = useState<string | null>(null)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)

  // Join jam on mount
  useEffect(() => {
    if (jamId) {
      joinJam(jamId).catch(err => console.error('Failed to join jam:', err))
    }
    return () => {
      leaveJam().catch(() => {})
    }
  }, [jamId, joinJam, leaveJam])

  // Watch for song completion and trigger confetti
  useEffect(() => {
    if (currentPerformance) {
      // Check if song changed and previous one exists
      if (previousInProgressId && previousInProgressId !== currentPerformance.id) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 5000)
      }
      setPreviousInProgressId(currentPerformance.id)
    }
  }, [currentPerformance?.id, previousInProgressId])

  // Update confetti dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setConfettiDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen()
        setIsFullscreen(true)
      } catch (err) {
        console.error('Error requesting fullscreen:', err)
      }
    } else {
      try {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } catch (err) {
        console.error('Error exiting fullscreen:', err)
      }
    }
  }

  // Get sorted schedules and derive next songs
  const sortedSchedules = schedule
    ? [...schedule].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : []

  const nextSongs = sortedSchedules
    .filter((s) => s.status === 'SCHEDULED')
    .slice(0, 3)

  // Get first scheduled song for "starting soon" display
  const firstScheduledSong = sortedSchedules.find((s) => s.status === 'SCHEDULED')

  // Show loading state
  if (isLoading && !jam) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  // Show error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <div className="card bg-error text-error-content w-full max-w-md">
          <div className="card-body">
            <h2 className="card-title">Connection Error</h2>
            <p className="text-sm">{userMessage}</p>
            {recoveryAction === 'retry' && (
              <div className="card-actions justify-end">
                <button className="btn btn-sm btn-primary" onClick={clearError}>
                  Retry Connection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <ErrorAlert message={error.message} title="Error Loading Dashboard" />
      </div>
    )
  }

  // ...existing code...

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden"
      data-theme="dark"
    >
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={confettiDimensions.width}
          height={confettiDimensions.height}
          numberOfPieces={200}
          recycle={false}
        />
      )}

      {/* Offline Indicator */}
      {isOfflineMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 bg-warning text-warning-content px-4 py-2 rounded-b-lg"
        >
          📵 You are offline - showing cached data
        </motion.div>
      )}

      {/* Header with Navbar Toggle & Fullscreen Button */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
        {/* Navbar Toggle */}
        <button
          onClick={() => setShowNavbar(!showNavbar)}
          className="btn btn-sm btn-ghost text-white"
          title="Toggle navbar"
        >
          ☰
        </button>

        {/* Jam Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-center flex-1">🎤 {jam?.name}</h1>

        {/* Connection Status and Fullscreen Button */}
        <div className="flex items-center gap-2">
          <ConnectionStatus />
          <button
            onClick={toggleFullscreen}
            className="btn btn-sm btn-ghost text-white"
            title="Toggle fullscreen"
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        </div>
      </div>

      {/* Optional Navbar */}
      {showNavbar && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-base-200 border-b border-base-300 p-4"
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <a href="/" className="link link-hover">
              ← Back to Home
            </a>
            <a href={`/jams/${jamId}`} className="link link-hover">
              View Full Details →
            </a>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="pt-20 pb-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Current Song Section */}
          {currentPerformance && currentPerformance.music ? (
            // ...existing Now Playing section...
            <motion.div
              key={`current-${currentPerformance.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <div className="bg-linear-to-br from-purple-900/40 to-blue-900/40 backdrop-blur border border-purple-500/30 rounded-2xl p-8 md:p-12">
                <p className="text-purple-300 text-sm md:text-lg font-semibold uppercase tracking-widest mb-4">
                  🎵 Now Playing
                </p>

                <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 text-wrap">
                  {currentPerformance.music.title}
                </h2>

                <p className="md:text-3xl text-purple-200 mb-2">
                  by {currentPerformance.music.artist}
                </p>

                {currentPerformance.music.duration && (
                  <p className="text-lg md:text-xl text-purple-300 mb-8">
                    ⏱️ {formatDuration(currentPerformance.music.duration)}
                  </p>
                )}


                {/* Current Musicians */}
                {currentPerformance.registrations && currentPerformance.registrations.length > 0 ? (
                  <div className="mt-8">
                    <p className="text-lg md:text-2xl font-bold text-white mb-6">
                      🎸 Current Musicians
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {(() => {
                        // Group musicians by instrument
                        const groupedByInstrument = (currentPerformance.registrations || []).reduce((acc: Record<string, RegistrationResponseDto[]>, reg: RegistrationResponseDto) => {
                          const instrument = reg.instrument || reg.musician?.instrument || 'Unknown'
                          if (!acc[instrument]) {
                            acc[instrument] = []
                          }
                          acc[instrument].push(reg)
                          return acc
                        }, {})

                        return Object.entries(groupedByInstrument).map(([instrument, regs]) => (
                          <motion.div
                            key={instrument}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center"
                          >
                            <p className="text-4xl mb-4">
                              {getInstrumentIcon(instrument)}
                            </p>
                            <div className="space-y-2">
                              {regs && regs.map((reg: RegistrationResponseDto) => (
                                <p key={reg.id} className="font-semibold text-white text-sm">
                                  {reg.musician?.name || 'Unknown'}
                                </p>
                              ))}
                            </div>
                          </motion.div>
                        ))
                      })()}
                    </div>
                  </div>
                ) : (
                  <p className="text-purple-300 text-lg">No musicians registered yet</p>
                )}
              </div>
            </motion.div>
          ) : firstScheduledSong && firstScheduledSong.music ? (
            // No current song but there are scheduled songs - show "Starting Soon"
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <div className="bg-linear-to-br from-slate-800/40 to-slate-700/40 backdrop-blur border border-slate-500/30 rounded-2xl p-8 md:p-12 text-center">
                <div className="animate-pulse mb-6">
                  <p className="text-5xl md:text-7xl font-black mb-4">🎉</p>
                </div>
                <h2 className="text-4xl md:text-6xl font-black mb-4">
                  Starting Soon!
                </h2>
                <div className="mt-8">
                  <p className="text-lg md:text-2xl text-slate-300 mb-2">
                    First up:
                  </p>
                  <p className="text-3xl md:text-5xl font-bold text-white mb-2">
                    {firstScheduledSong.music.title}
                  </p>
                  <p className="text-xl md:text-2xl text-slate-400">
                    by {firstScheduledSong.music.artist}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* Next Song Section - Show first of nextSongs array */}
          {nextSongs && nextSongs.length > 0 && nextSongs[0] && nextSongs[0].music && (
            <motion.div
              key={`next-${nextSongs[0].id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-12"
            >
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 md:p-8">
                <p className="text-slate-300 text-sm md:text-base font-semibold uppercase tracking-widest mb-3">
                  ⏭️ Up Next
                </p>

                <h3 className="text-3xl md:text-5xl font-bold text-white mb-2">
                  {nextSongs[0].music.title}
                </h3>

                <p className="text-lg md:text-2xl text-slate-300 mb-4">
                  {nextSongs[0].music.artist}
                </p>

                {/* Next Song Musicians */}
                {nextSongs[0].registrations && nextSongs[0].registrations.length > 0 && (
                  <div className="mt-6">
                    <p className="text-base md:text-lg font-semibold text-white mb-3">
                      Musicians to be called:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {(() => {
                        // Group musicians by instrument
                        const groupedByInstrument = (nextSongs[0].registrations || []).reduce((acc: Record<string, RegistrationResponseDto[]>, reg: RegistrationResponseDto) => {
                          const instrument = reg.instrument || reg.musician?.instrument || 'Unknown'
                          if (!acc[instrument]) {
                            acc[instrument] = []
                          }
                          acc[instrument].push(reg)
                          return acc
                        }, {})

                        return Object.entries(groupedByInstrument).map(([instrument, regs]) => (
                          <motion.div
                            key={instrument}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-slate-700/50 rounded-lg p-3 text-center"
                          >
                            <p className="text-3xl mb-3">
                              {getInstrumentIcon(instrument)}
                            </p>
                            <div className="space-y-1">
                              {regs && regs.map((reg: RegistrationResponseDto) => (
                                <p key={reg.id} className="font-semibold text-white text-xs">
                                  {reg.musician?.name || 'Unknown'}
                                </p>
                              ))}
                            </div>
                          </motion.div>
                        ))
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* QR Code Corner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="fixed bottom-6 left-6 bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4 z-40"
      >
        <QRCodeSVG
          value={`${window.location.origin}/jams/${jamId}`}
          size={120}
          fgColor="#ffffff"
          bgColor="transparent"
        />
        <p className="text-xs text-center mt-2 text-slate-300">Scan to join</p>
      </motion.div>
    </div>
  )
}

