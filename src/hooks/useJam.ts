/**
 * Jam Hook
 * Custom hook for fetching jam data
 */

import {useQuery, type UseQueryResult} from './useQuery'
import {jamService} from '../services'
import type {JamResponseDto} from '../types/api.types'

/**
 * Fetch single jam by ID
 * @param id - Jam ID (will skip fetch if empty)
 * @returns Query result with jam data
 */
export function useJam(id: string): UseQueryResult<JamResponseDto> {
  return useQuery(
    () => {
      if (!id || id.trim() === '') {
        return Promise.resolve(null as unknown as JamResponseDto)
      }
      return jamService.findOne(id).then((res) => res.data)
    },
    [id]
  )
}

/**
 * Fetch all jams
 * @returns Query result with jam array
 */
export function useJams(): UseQueryResult<JamResponseDto[]> {
  return useQuery(
    () => jamService.findAll().then((res) => res.data ?? []),
    []
  )
}

