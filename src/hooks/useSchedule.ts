import {useQuery, type UseQueryResult} from './useQuery'
import {scheduleService} from '../services'
import type {ApiResponse, ScheduleResponseDto} from '../types/api.types'

/**
 * Fetch schedules for a specific jam
 * @param jamId - Jam ID (will skip fetch if empty)
 * @returns Query result with schedule array
 */
export function useScheduleByJam(jamId: string): UseQueryResult<ScheduleResponseDto[]> {
  return useQuery(
    () => {
      if (!jamId || jamId.trim() === '') {
        return Promise.resolve([])
      }
      return scheduleService.findByJam(jamId).then((res: ApiResponse<ScheduleResponseDto[]>) => res.data ?? [])
    },
    [jamId]
  )
}

/**
 * Fetch schedules for a specific musician
 * @param musicianId - Musician ID (will skip fetch if empty)
 * @returns Query result with schedule array
 */
export function useScheduleByMusician(musicianId: string): UseQueryResult<ScheduleResponseDto[]> {
  return useQuery(
    () => {
      if (!musicianId || musicianId.trim() === '') {
        return Promise.resolve([])
      }
      return scheduleService.findByMusician(musicianId).then((res: ApiResponse<ScheduleResponseDto[]>) => res.data ?? [])
    },
    [musicianId]
  )
}

