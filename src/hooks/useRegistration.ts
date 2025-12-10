/**
 * Registration Hook
 * Custom hook for fetching registration data
 */

import {useQuery, type UseQueryResult} from './useQuery'
import {registrationService} from '../services'
import type {ApiResponse, RegistrationResponseDto} from '../types/api.types'

/**
 * Fetch registrations for a specific jam
 * @param jamId - Jam ID (will skip fetch if empty)
 * @returns Query result with registration array
 */
export function useRegistrationsByJam(jamId: string): UseQueryResult<RegistrationResponseDto[]> {
  return useQuery(
    () => {
      if (!jamId || jamId.trim() === '') {
        return Promise.resolve([])
      }
      return registrationService.findByJam(jamId).then((res: ApiResponse<RegistrationResponseDto[]>) => res.data ?? [])
    },
    [jamId]
  )
}

/**
 * Fetch registrations for a specific musician
 * @param musicianId - Musician ID (will skip fetch if empty)
 * @returns Query result with registration array
 */
export function useRegistrationsByMusician(
  musicianId: string
): UseQueryResult<RegistrationResponseDto[]> {
  return useQuery(
    () => {
      if (!musicianId || musicianId.trim() === '') {
        return Promise.resolve([])
      }
      return registrationService.findByMusician(musicianId).then((res: ApiResponse<RegistrationResponseDto[]>) => res.data ?? [])
    },
    [musicianId]
  )
}

