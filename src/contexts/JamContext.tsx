/**
 * Jam Context
 * Global state management for active jam session
 */

import {createContext, type ReactNode, useCallback, useMemo, useRef, useState} from 'react'
import type {
  JamResponseDto,
  MusicianResponseDto,
  RegistrationResponseDto,
  ScheduleResponseDto,
} from '../types/api.types'
import {jamService} from '../services'
import {useAuth} from '../hooks'

export type JamRole = 'host' | 'musician' | 'public' | null

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
  userRole: JamRole
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
  const [userRole, setUserRole] = useState<JamRole>(null)

  const activeJamIdRef = useRef<string | null>(null)


  // Derive current performance from schedule (memoized)
  const currentPerformance = useMemo(
    () => jam?.schedules?.find((s) => s.status === 'IN_PROGRESS') || null,
    [jam?.schedules]
  )



  // Derive all registrations from schedules (single source of truth)
  const registrations = useMemo(
    () => jam?.schedules?.flatMap(s => s.registrations || []) || [],
    [jam?.schedules]
  )

  // Memoize musicians calculation with Set-based deduplication (O(n) instead of O(n²))
  const musicians = useMemo(() => {
    if (registrations.length === 0) return []

    const seen = new Set<string>()
    return registrations.reduce((unique, reg) => {
      const musician = reg.musician
      if (musician?.id && !seen.has(musician.id)) {
        seen.add(musician.id)
        unique.push(musician)
      }
      return unique
    }, [] as MusicianResponseDto[])
  }, [registrations])

  const schedule = useMemo(
    () => jam?.schedules || [],
    [jam?.schedules]
  )

  /**
   * Determine user role in jam
   */
  const determineUserRole = useCallback(
    (jamData: JamResponseDto | null | undefined): JamRole => {
      if (!user || !jamData) return 'public'

      // Check if host by musician ID (primary) or name fallback
      if (jamData.hostMusicianId && jamData.hostMusicianId === user.id) {
        return 'host'
      }
      if (!jamData.hostMusicianId && jamData.hostName && jamData.hostName === user.name) {
        return 'host'
      }

      // Check if registered musician (derive from schedules)
      const allRegs = jamData.schedules?.flatMap(s => s.registrations || []) || []
      const isMusician = allRegs.some(
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
    } catch (err) {
      console.error('❌ Failed to leave jam:', err)
      throw err
    }
  }, []) // Empty deps - function doesn't depend on external values

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

  const value: JamContextType = useMemo(() => ({
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
  }), [
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
  ])

  return <JamContext.Provider value={value}>{children}</JamContext.Provider>
}
