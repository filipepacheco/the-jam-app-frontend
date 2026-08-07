/**
 * Schedule Service
 * Handles all API operations related to Schedules (Escalas)
 */

import { apiClient, API_ENDPOINTS , unwrapResponse } from '../lib/api'
import type {
  ScheduleResponseDto,
  CreateScheduleDto,
  UpdateScheduleDto,
} from '../types/api.types'

/**
 * Schedule Service
 * Encapsulates all schedule-related API calls
 */
export const scheduleService = {
  /**
   * Create a new schedule entry
   * @param data - Schedule creation data
   * @returns Promise with created schedule
   */
  async create(data: CreateScheduleDto): Promise<ScheduleResponseDto> {
    return unwrapResponse(() => apiClient.post<ScheduleResponseDto>(API_ENDPOINTS.schedules as string, data))
  },

  /**
   * Update a schedule entry
   * @param id - Schedule ID
   * @param data - Update data
   * @returns Promise with updated schedule
   */
  async update(id: string, data: UpdateScheduleDto): Promise<ScheduleResponseDto> {
    return unwrapResponse(() => apiClient.patch<ScheduleResponseDto>(API_ENDPOINTS.scheduleById(id), data))
  },

  /**
   * Remove a schedule entry
   * @param id - Schedule ID
   * @returns Promise with deletion confirmation
   */
  async remove(id: string): Promise<void> {
    return unwrapResponse(() => apiClient.delete<void>(API_ENDPOINTS.scheduleById(id)))
  },
  // Note: Reorder functionality moved to jamControlService.reorderQueue()
}

