/**
 * Musician Service
 * Handles all API operations related to Musicians (Músicos)
 */

import { apiClient, API_ENDPOINTS } from '../lib/api'
import type {
  MusicianResponseDto,
  CreateMusicianDto,
  UpdateMusicianDto,
  ApiResponse,
} from '../types/api.types'

/**
 * Musician Service
 * Encapsulates all musician-related API calls
 */
export const musicianService = {
  /**
   * Create a new musician
   * @param data - Musician creation data
   * @returns Promise with created musician
   */
  async create(data: CreateMusicianDto): Promise<ApiResponse<MusicianResponseDto>> {
    return apiClient.post<MusicianResponseDto>(API_ENDPOINTS.musicians as string, data)
  },

  /**
   * Get all musicians
   * @returns Promise with array of musicians
   */
  async findAll(): Promise<ApiResponse<MusicianResponseDto[]>> {
    return apiClient.get<MusicianResponseDto[]>(API_ENDPOINTS.musicians as string)
  },

  /**
   * Update a musician
   * @param id - Musician ID
   * @param data - Update data
   * @returns Promise with updated musician
   */
  async update(id: string, data: UpdateMusicianDto): Promise<ApiResponse<MusicianResponseDto>> {
    return apiClient.patch<MusicianResponseDto>(API_ENDPOINTS.musicianById(id), data)
  },

  /**
   * Delete a musician
   * @param id - Musician ID
   * @returns Promise with deletion confirmation
   */
  async remove(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.musicianById(id))
  },
}

