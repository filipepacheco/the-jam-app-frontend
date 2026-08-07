/**
 * Musician Service
 * Handles all API operations related to Musicians (Músicos)
 */

import { apiClient, API_ENDPOINTS, unwrapResponse, unwrapPaginatedResponse } from '../lib/api'
import type {
  MusicianResponseDto,
  MusicianProfileWithStats,
  CreateMusicianDto,
  UpdateMusicianDto,
  PaginatedResponse,
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
  async create(data: CreateMusicianDto): Promise<MusicianResponseDto> {
    return unwrapResponse(() => apiClient.post<MusicianResponseDto>(API_ENDPOINTS.musicians as string, data))
  },

  /**
   * Get musicians with pagination
   */
  async findAll(skip = 0, take = 20): Promise<PaginatedResponse<MusicianResponseDto>> {
    return unwrapPaginatedResponse(() =>
      apiClient.get<MusicianResponseDto[]>(`${API_ENDPOINTS.musicians}?skip=${skip}&take=${take}`)
    )
  },

  async findOne(id: string): Promise<MusicianProfileWithStats> {
    return unwrapResponse(() => apiClient.get<MusicianProfileWithStats>(API_ENDPOINTS.musicianById(id)))
  },

  /**
   * Update a musician
   * @param id - Musician ID
   * @param data - Update data
   * @returns Promise with updated musician
   */
  async update(id: string, data: UpdateMusicianDto): Promise<MusicianResponseDto> {
    return unwrapResponse(() => apiClient.patch<MusicianResponseDto>(API_ENDPOINTS.musicianById(id), data))
  },

  /**
   * Delete a musician
   * @param id - Musician ID
   */
  async remove(id: string): Promise<void> {
    return unwrapResponse(() => apiClient.delete<void>(API_ENDPOINTS.musicianById(id)))
  },
}

