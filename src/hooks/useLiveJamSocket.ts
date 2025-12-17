/**
 * Live Jam Socket Hook
 * Manages real-time WebSocket connection with intelligent polling fallback
 * Features:
 * - Attempts socket connection first
 * - Falls back to polling on socket failure
 * - Exponential backoff for connection retries
 * - Automatic recovery on network restoration
 * - Smart pausing when tab is inactive
 */

import {useEffect, useRef, useState} from 'react'
import {io, Socket} from 'socket.io-client'
import type {JamResponseDto, ScheduleResponseDto} from '../types/api.types'
import {jamService} from '../services'
import {getToken} from '../lib/auth'

interface UseLiveJamSocketReturn {
  jam: JamResponseDto | null
  currentSong: ScheduleResponseDto | null
  nextSongs: ScheduleResponseDto[]
  isConnected: boolean
  isLoading: boolean
  error: string | null
  connectionMode: 'socket' | 'polling' | 'idle'
}

interface SocketManager {
  socket: Socket<any, any> | null
  isConnected: boolean
  connectAttempts: number
  lastAttemptTime: number
}

/**
 * Hook for managing live jam socket connection with intelligent polling fallback
 * @param jamId - The jam ID to listen for updates
 * @returns Live jam state, connection status, error handling, and connection mode
 */
export function useLiveJamSocket(jamId: string): UseLiveJamSocketReturn {
  const [jam, setJam] = useState<JamResponseDto | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionMode, setConnectionMode] = useState<'socket' | 'polling' | 'idle'>('idle')

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const socketRef = useRef<SocketManager | null>(null)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSuccessfulFetchRef = useRef<number>(0)

  // Extract current song (IN_PROGRESS status)
  const currentSong = jam?.schedules?.find((s) => s.status === 'IN_PROGRESS') || null

  // Extract next 3 songs (SCHEDULED status, ordered)
  const nextSongs = jam?.schedules
    ?.filter((s) => s.status === 'SCHEDULED')
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 3) || []

  /**
   * Calculate exponential backoff delay (max 30 seconds)
   */
  const getBackoffDelay = (attemptCount: number): number => {
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay)
    return delay + Math.random() * 1000 // Add jitter
  }

  /**
   * Fetch jam state from API with error recovery
   */
  const fetchJamState = async (showLoadingState = false) => {
    if (!jamId) return

    try {
      if (showLoadingState) setIsLoading(true)
      setError(null)

      // Use existing jamService API instead of non-existent /live/state endpoint
      const response = await jamService.findOne(jamId)

      if (!response || !response.data) {
        throw new Error('Invalid response: missing jam data')
      }

      // Use the jam data directly - it's already the correct format
      setJam(response.data)
      lastSuccessfulFetchRef.current = Date.now()

      // Clear any previous polling errors on success
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection error during polling'
      console.error('❌ Polling error:', err)

      // Don't set error state on timeout - just log it
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('⚠️ Polling request timeout')
        return
      }

      setError(errorMessage)
    } finally {
      if (showLoadingState) setIsLoading(false)
    }
  }

  /**
   * Attempt to establish socket connection
   */
  const attemptSocketConnection = async (): Promise<boolean> => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const token = getToken()

      console.log('🔗 Attempting socket connection to:', baseUrl)
      console.log('🔐 Auth token available:', !!token)

      const socket = io(baseUrl, {
        auth: {
          token: token ? `Bearer ${token}` : '',
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
      })

      // Handle successful connection
      socket.on('connect', () => {
        console.log('✅ Socket connected, joining jam room:', jamId)

        // Join the jam-specific room
        if (jamId) {
          socket.emit('join-jam', { jamId })
        }

        // Fetch initial state when socket connects
        fetchJamState(false)

        if (socketRef.current) {
          socketRef.current.isConnected = true
          socketRef.current.connectAttempts = 0
        }

        setIsConnected(true)
        setConnectionMode('socket')
        setError(null)
      })

      // Handle real-time jam updates
      socket.on('jam:action-executed', (updatedJam: JamResponseDto) => {
        console.log('🔄 Socket update received for jam:', updatedJam.id)
        setJam(updatedJam)
        setError(null)
      })

      // Handle disconnect
      socket.on('disconnect', (reason: string) => {
        console.log('❌ Socket disconnected, reason:', reason)
        setIsConnected(false)

        if (socketRef.current) {
          socketRef.current.isConnected = false
        }

        // Fall back to polling on disconnect
        if (connectionMode === 'socket') {
          console.log('📡 Switching to polling fallback')
          startPolling()
        }
      })

      // Handle connection errors
      socket.on('connect_error', (error: any) => {
        console.error('❌ Socket connection error:', {
          message: error.message || error,
          data: error.data,
          type: error.type,
        })
        const errorMsg = error.data?.message || error.message || 'Connection failed'
        setError(`Socket error: ${errorMsg}`)
      })

      socketRef.current = {
        socket,
        isConnected: true,
        connectAttempts: 0,
        lastAttemptTime: Date.now(),
      }

      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Socket connection failed'
      console.error('❌ Socket connection error:', err)
      setError(errorMsg)
      return false
    }
  }

  /**
   * Start polling as fallback mechanism
   */
  const startPolling = () => {
    // Avoid duplicate intervals
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    console.log('📡 Starting polling fallback using jamService API (5s interval)')
    setConnectionMode('polling')

    // Initial fetch
    fetchJamState(false)

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchJamState(false)
      }
    }, 5000)
  }

  /**
   * Stop polling and cleanup
   */
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
      console.log('⏹️ Polling stopped')
    }
  }

  /**
   * Retry socket connection with exponential backoff
   */
  const retrySocketConnection = async (attemptCount: number) => {
    const delay = getBackoffDelay(attemptCount)
    console.log(`🔄 Retrying socket connection in ${delay}ms (attempt ${attemptCount + 1})`)

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    retryTimeoutRef.current = setTimeout(async () => {
      const connected = await attemptSocketConnection()
      if (!connected && attemptCount < 3) {
        // Max 3 retry attempts, then fall back to polling permanently
        retrySocketConnection(attemptCount + 1)
      } else if (!connected) {
        console.warn('⚠️ Socket connection failed after max retries, using polling')
        startPolling()
      }
    }, delay)
  }

  // Main initialization effect
  useEffect(() => {
    if (!jamId) {
      setConnectionMode('idle')
      return
    }

    let isMounted = true
    let visibilityUnsubscribe: (() => void) | null = null

    const initialize = async () => {
      try {
        setIsLoading(true)
        console.log('🚀 Initializing live jam connection for:', jamId)

        // Step 1: Try socket connection first
        const socketConnected = await attemptSocketConnection()

        if (socketConnected) {
          console.log('✅ Using socket connection')
          if (isMounted) {
            setIsConnected(true)
            setConnectionMode('socket')
          }
        } else {
          // Step 2: Fall back to polling if socket unavailable
          console.log('📡 Socket unavailable, falling back to polling')

          if (isMounted) {
            setIsConnected(false)
          }

          // Start polling immediately
          if (isMounted) {
            startPolling()
          }
        }

        // Step 3: Handle visibility changes
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            console.log('👁️ Tab visible, resuming updates')

            // Fetch immediately when tab becomes visible
            if (connectionMode === 'polling') {
              fetchJamState(false)
            }

            // Resume polling interval if needed
            if (connectionMode === 'polling' && !pollingIntervalRef.current) {
              startPolling()
            }
          } else {
            console.log('😴 Tab hidden, pausing updates')

            // Pause polling when tab is hidden
            if (connectionMode === 'polling') {
              stopPolling()
            }
          }
        }

        if (isMounted) {
          document.addEventListener('visibilitychange', handleVisibilityChange)
          visibilityUnsubscribe = () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
          }
        }

        // Handle network status changes
        const handleOnline = () => {
          console.log('🌐 Network restored, attempting reconnection')
          if (isMounted && !isConnected && connectionMode === 'polling') {
            // Try socket connection again
            retrySocketConnection(0)
          }
        }

        const handleOffline = () => {
          console.log('📵 Network lost')
        }

        if (isMounted) {
          window.addEventListener('online', handleOnline)
          window.addEventListener('offline', handleOffline)
        }
      } catch (err) {
        console.error('❌ Initialization error:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize connection')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initialize()

    // Cleanup function
    return () => {
      isMounted = false

      // Stop polling
      stopPolling()

      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }

      // Unsubscribe from visibility changes
      if (visibilityUnsubscribe) {
        visibilityUnsubscribe()
      }

      // Clean up socket if it exists
      if (socketRef.current?.socket) {
        socketRef.current.socket.disconnect()
        socketRef.current.socket.off('connect')
        socketRef.current.socket.off('disconnect')
        socketRef.current.socket.off('jam:action-executed')
        socketRef.current.socket.off('connect_error')
        socketRef.current = null
      }
    }
  }, [jamId])

  return {
    jam,
    currentSong,
    nextSongs,
    isConnected,
    isLoading,
    error,
    connectionMode,
  }
}

