/**
 * Musician Hook
 * Custom hook for fetching musician data
 */

import {useQuery, type UseQueryResult} from './useQuery'
import {musicianService} from '../services'
import type {ApiResponse, MusicianResponseDto} from '../types/api.types'

/**
 * Fetch single musician by ID
 * @param id - Musician ID (will skip fetch if empty)
 * @returns Query result with musician data
 */
export function useMusician(id: string): UseQueryResult<MusicianResponseDto> {
  return useQuery(
    () => {
      if (!id || id.trim() === '') {
        return Promise.resolve(null as unknown as MusicianResponseDto)
      }
      return musicianService.findOne(id).then((res: ApiResponse<MusicianResponseDto>) => res.data)
    },
    [id]
  )
}

/**
 * Fetch all musicians
 * @returns Query result with musician array
 */
export function useMusicians(): UseQueryResult<MusicianResponseDto[]> {
  return useQuery(
    () => musicianService.findAll().then((res: ApiResponse<MusicianResponseDto[]>) => res.data ?? []),
    []
  )
}

