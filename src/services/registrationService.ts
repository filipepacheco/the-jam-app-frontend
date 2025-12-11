/**
 * Registration Service
 * Handles all API operations related to Registrations (Inscrições)
 */

import {API_ENDPOINTS, apiClient} from '../lib/api'
import type {ApiResponse, CreateRegistrationDto, RegistrationResponseDto,} from '../types/api.types'

/**
 * Registration Service
 * Encapsulates all registration-related API calls
 */
export const registrationService = {
  /**
   * Create a new registration
   * @param data - Registration creation data
   * @returns Promise with created registration
   */
  async create(data: CreateRegistrationDto): Promise<ApiResponse<RegistrationResponseDto>> {
    return apiClient.post<RegistrationResponseDto>(API_ENDPOINTS.registrations as string, data)
  },

  /**
   * Get all registrations for a specific jam
   * @param jamId - Jam ID
   * @returns Promise with array of registrations
   */
  async findByJam(jamId: string): Promise<ApiResponse<RegistrationResponseDto[]>> {
    return apiClient.get<RegistrationResponseDto[]>(API_ENDPOINTS.registrationsByJam(jamId))
  },

  /**
   * Get all registrations for a specific musician
   * @param musicianId - Musician ID (músico ID)
   * @returns Promise with array of registrations
   */
  async findByMusician(musicianId: string): Promise<ApiResponse<RegistrationResponseDto[]>> {
    return apiClient.get<RegistrationResponseDto[]>(API_ENDPOINTS.registrationsByMusician(musicianId))
  },

  /**
   * Update a registration
   * @param id - Registration ID
   * @param data - Registration data to update
   * @returns Promise with updated registration
   */
  async update(id: string, data: Partial<RegistrationResponseDto>): Promise<ApiResponse<RegistrationResponseDto>> {
    return apiClient.patch<RegistrationResponseDto>(API_ENDPOINTS.registrationById(id), data)
  },

  /**
   * Cancel/remove a registration
   * @param id - Registration ID
   * @returns Promise with deletion confirmation
   */
  async remove(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.registrationById(id))
  },
}

