/**
 * Music Hook
 * Custom hook for fetching music data
 */

import {useQuery, type UseQueryResult} from './useQuery'
import {musicService} from '../services'
import type {ApiResponse, MusicResponseDto} from '../types/api.types'

/**
 * Fetch single music by ID
 * @param id - Music ID (will skip fetch if empty)
 * @returns Query result with music data
 */
export function useMusic(id: string): UseQueryResult<MusicResponseDto> {
  return useQuery(
    () => {
      if (!id || id.trim() === '') {
        return Promise.resolve(null as unknown as MusicResponseDto)
      }
      return musicService.findOne(id).then((res: ApiResponse<MusicResponseDto>) => res.data)
    },
    [id]
  )
}

/**
 * Fetch all music
 * @returns Query result with music array
 */
export function useAllMusic(): UseQueryResult<MusicResponseDto[]> {
  return useQuery(
    () => musicService.findAll().then((res: ApiResponse<MusicResponseDto[]>) => res.data ?? []),
    []
  )
}

/**
 * Fetch music for a specific jam
 * @param jamId - Jam ID (will skip fetch if empty)
 * @returns Query result with music array for the jam
 */
export function useMusicByJam(jamId: string): UseQueryResult<MusicResponseDto[]> {
  return useQuery(
    () => {
      if (!jamId || jamId.trim() === '') {
        return Promise.resolve([])
      }
      return musicService.findByJam(jamId).then((res: ApiResponse<MusicResponseDto[]>) => res.data ?? [])
    },
    [jamId]
  )
}

