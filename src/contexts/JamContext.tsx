/**
 * Jam Context
 * Global state management for active jam session
 */

import {createContext, type ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import type {
    JamResponseDto,
    MusicianResponseDto,
    RegistrationResponseDto,
    ScheduleResponseDto,
} from '../types/api.types'
import type {
    LiveStateSyncPayload,
    MusicianJoinedPayload,
    MusicianLeftPayload,
    RegistrationApprovedPayload,
    RegistrationCreatedPayload,
    ScheduleCreatedPayload,
    ScheduleUpdatedPayload,
} from '../types/socket.types'
import {getSocketService} from '../services'
import {useAuth} from '../hooks'

export type UserRole = 'host' | 'musician' | 'public' | null

export interface JamContextType {
  // State
  jamId: string | null
  jam: JamResponseDto | null
  currentPerformance: ScheduleResponseDto | null
  musicians: MusicianResponseDto[]
  registrations: RegistrationResponseDto[]
  schedule: ScheduleResponseDto[]
  isLoading: boolean
  error: Error | null
  userRole: UserRole
  isConnected: boolean

  // Actions
  joinJam(jamId: string): Promise<void>
  leaveJam(): Promise<void>
  requestStateRefresh(): Promise<void>
  updateJamState(jam: JamResponseDto): void
}

/**
 * Create the Jam Context
 */
const JamContext = createContext<JamContextType | undefined>(undefined)

export { JamContext }

/**
 * JamProvider component
 * Wraps components to provide jam context and socket connection
 */
export function JamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  // State
  const [jamId, setJamId] = useState<string | null>(null)
  const [jam, setJam] = useState<JamResponseDto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>(null)

  const socketService = getSocketService()
  const activeJamIdRef = useRef<string | null>(null)

  // Derive current performance from schedule
  // Find the schedule with IN_PROGRESS status
  const currentPerformance =
    jam?.schedules?.find((s) => s.status === 'IN_PROGRESS') || null

  // Debug logging
  useEffect(() => {
    if (jam) {
      console.log('📊 Jam data updated:', {
        jamId: jam.id,
        schedules: jam.schedules,
        schedulesCount: jam.schedules?.length,
        inProgressSchedules: jam.schedules?.filter((s) => s.status === 'IN_PROGRESS'),
        currentPerformance,
      })
    }
  }, [jam, currentPerformance])

  const musicians = jam?.registrations
    ?.map((reg) => reg.musician)
    .filter((m) => m && m.id)
    .reduce((unique: MusicianResponseDto[], musician) => {
      if (!unique.find((u) => u.id === musician?.id)) {
          if (musician) {
              unique.push(musician)
          }
      }
      return unique
    }, []) || []

  const registrations = jam?.registrations || []

  const schedule = jam?.schedules || []

  /**
   * Determine user role in jam
   */
  const determineUserRole = useCallback(
    (jamData: JamResponseDto | null | undefined): UserRole => {
      if (!user || !jamData) return 'public'

      // Check if host (assuming hostName matches user name)
      if (jamData.hostName && jamData.hostName === user.name) {
        return 'host'
      }

      // Check if registered musician
      const isMusician = jamData.registrations?.some(
        (reg) =>
          reg.musician?.id === user.id || reg.musician?.contact === user.contact
      )

      return isMusician ? 'musician' : 'public'
    },
    [user]
  )

  /**
   * Join jam session
   */
  const joinJam = useCallback(
    async (newJamId: string) => {
      try {
        setIsLoading(true)
        setError(null)

        // Connect socket if not already connected
        if (!socketService.isConnected()) {
          // Get token from auth
          const token = localStorage.getItem('token')
          if (token) {
            await socketService.connect(token)
          } else {
            await socketService.connect()
          }
        }

        // Emit join jam event
        activeJamIdRef.current = newJamId
        setJamId(newJamId)

        // Subscribe to jam events
        setupJamEventListeners()

        // Request initial state
        if (user) {
          socketService.emit('musician:request-state', { jamId: newJamId })
        } else {
          socketService.emit('public:request-state', { jamId: newJamId })
        }

        console.log('✅ Joined jam:', newJamId)
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
        console.error('❌ Failed to join jam:', err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [socketService, user]
  )

  /**
   * Leave jam session
   */
  const leaveJam = useCallback(async () => {
    try {
      if (activeJamIdRef.current) {
        socketService.emit('leaveJam', { jamId: activeJamIdRef.current })
      }

      activeJamIdRef.current = null
      setJamId(null)
      setJam(null)
      setUserRole(null)
      setIsConnected(false)

      console.log('✅ Left jam')
    } catch (err) {
      console.error('❌ Failed to leave jam:', err)
      throw err
    }
  }, [socketService])

  /**
   * Request state refresh
   */
  const requestStateRefresh = useCallback(async () => {
    try {
      if (!activeJamIdRef.current) return

      const role = userRole || 'public'
      const eventName =
        role === 'host'
          ? 'host:request-state'
          : role === 'musician'
            ? 'musician:request-state'
            : 'public:request-state'

      socketService.emit(eventName, { jamId: activeJamIdRef.current })
    } catch (err) {
      console.error('❌ Failed to request state refresh:', err)
    }
  }, [socketService, userRole])

  /**
   * Handle live state sync
   */
  const handleStateSync = useCallback(
    (data: LiveStateSyncPayload) => {
      setJam(data.state)
      setIsConnected(true)

      // Update user role
      const role = determineUserRole(data.state)
      setUserRole(role)
    },
    [determineUserRole]
  )

  /**
   * Handle schedule created
   */
  const handleScheduleCreated = useCallback(
    (data: ScheduleCreatedPayload) => {
      if (data.jamId !== activeJamIdRef.current) return

      setJam((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          schedules: [...(prev.schedules || []), data.schedule],
        }
      })
    },
    []
  )

  /**
   * Handle schedule updated
   */
  const handleScheduleUpdated = useCallback(
    (data: ScheduleUpdatedPayload) => {
      if (data.jamId !== activeJamIdRef.current) return

      setJam((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          schedules: prev.schedules?.map((s) =>
            s.id === data.scheduleId ? { ...s, ...data.updates } : s
          ),
        }
      })
    },
    []
  )

  /**
   * Handle musician joined
   */
  const handleMusicianJoined = useCallback(
    (data: MusicianJoinedPayload) => {
      if (data.jamId !== activeJamIdRef.current) return

      console.log('🎵 Musician joined:', data.musicianName)

      // Note: Just log for now - musicians list updates via state-sync
      // Don't add to registrations as we don't have full musician object
    },
    []
  )

  /**
   * Handle musician left
   */
  const handleMusicianLeft = useCallback(
    (data: MusicianLeftPayload) => {
      if (data.jamId !== activeJamIdRef.current) return

      console.log('👋 Musician left:', data.musicianName)

      // Note: Musicians list updates via state-sync
      // No need to filter registrations here
    },
    []
  )

  /**
   * Handle registration created
   */
  const handleRegistrationCreated = useCallback(
    (data: RegistrationCreatedPayload) => {
      if (data.jamId !== activeJamIdRef.current) return

      console.log('📝 New registration:', data.registration.musician?.name)

      setJam((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          registrations: [...(prev.registrations || []), data.registration],
        }
      })
    },
    []
  )

  /**
   * Handle registration approved
   */
  const handleRegistrationApproved = useCallback(
    (data: RegistrationApprovedPayload) => {
      if (data.jamId !== activeJamIdRef.current) return

      console.log('✅ Registration approved')

      setJam((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          registrations: prev.registrations?.map((reg) =>
            reg.id === data.registrationId
              ? { ...reg, status: 'APPROVED', registration: data.registration }
              : reg
          ),
        }
      })
    },
    []
  )

  /**
   * Setup socket event listeners for jam
   */
  const setupJamEventListeners = useCallback(
    () => {
      socketService.on('live:state-sync', handleStateSync)
      socketService.on('schedule:created', handleScheduleCreated)
      socketService.on('schedule:updated', handleScheduleUpdated)
      socketService.on('musicianJoined', handleMusicianJoined)
      socketService.on('musicianLeft', handleMusicianLeft)
      socketService.on('registration:created', handleRegistrationCreated)
      socketService.on('registration:approved', handleRegistrationApproved)
    },
    [
      socketService,
      handleStateSync,
      handleScheduleCreated,
      handleScheduleUpdated,
      handleMusicianJoined,
      handleMusicianLeft,
      handleRegistrationCreated,
      handleRegistrationApproved,
    ]
  )

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (activeJamIdRef.current) {
        leaveJam().catch(() => {})
      }

      // Unsubscribe from all events
      socketService.off('live:state-sync', handleStateSync)
      socketService.off('schedule:created', handleScheduleCreated)
      socketService.off('schedule:updated', handleScheduleUpdated)
      socketService.off('musicianJoined', handleMusicianJoined)
      socketService.off('musicianLeft', handleMusicianLeft)
      socketService.off('registration:created', handleRegistrationCreated)
      socketService.off('registration:approved', handleRegistrationApproved)
    }
  }, [
    socketService,
    leaveJam,
    handleStateSync,
    handleScheduleCreated,
    handleScheduleUpdated,
    handleMusicianJoined,
    handleMusicianLeft,
    handleRegistrationCreated,
    handleRegistrationApproved,
  ])

  const value: JamContextType = {
    jamId,
    jam,
    currentPerformance,
    musicians,
    registrations,
    schedule,
    isLoading,
    error,
    userRole,
    isConnected,
    joinJam,
    leaveJam,
    requestStateRefresh,
    updateJamState: setJam,
  }

  return <JamContext.Provider value={value}>{children}</JamContext.Provider>
}

