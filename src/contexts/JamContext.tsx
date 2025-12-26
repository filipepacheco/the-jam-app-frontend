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
import {jamService} from '../services'
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

        // Use REST to fetch initial state
        const resp = await jamService.findOne(newJamId)
        if (resp && resp.data) {
          setJam(resp.data)
          setUserRole(determineUserRole(resp.data))
          setIsConnected(true)
        }

        activeJamIdRef.current = newJamId
        setJamId(newJamId)

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
    [determineUserRole]
  )


  /**
   * Leave jam session
   */
  const leaveJam = useCallback(async () => {
    try {
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
  }, [determineUserRole])

  /**
   * Update jam state helper (exposed to consumers)
   */
  const updateJamState = useCallback((newJam: JamResponseDto) => {
    setJam(newJam)
  }, [])

  /**
   * Request state refresh
   */
  const requestStateRefresh = useCallback(async () => {
    try {
      if (!activeJamIdRef.current) return
      const resp = await jamService.findOne(activeJamIdRef.current)
      if (resp && resp.data) {
        setJam(resp.data)
        setUserRole(determineUserRole(resp.data))
      }
    } catch (err) {
      console.error('❌ Failed to request state refresh:', err)
    }
  }, [determineUserRole])

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
    updateJamState,
  }

  return <JamContext.Provider value={value}>{children}</JamContext.Provider>
}
