/**
 * Music Service
 * Handles all API operations related to Music (Músicas)
 */

import { apiClient, API_ENDPOINTS, unwrapResponse, unwrapPaginatedResponse } from '../lib/api'
import type {
  MusicResponseDto,
  JamMusicResponseDto,
  CreateMusicDto,
  UpdateMusicDto,
  PaginatedResponse,
} from '../types/api.types'

/**
 * Music Service
 * Encapsulates all music-related API calls
 */
export const musicService = {
/**
   * Create a new music
   * @param data - Music creation data
   * @returns Promise with created music
   */
  async create(data: CreateMusicDto): Promise<MusicResponseDto> {
    return unwrapResponse(() => apiClient.post<MusicResponseDto>(API_ENDPOINTS.music as string, data))
  },

  /**
   * Get music with pagination and optional status filter
   */
  async findAll(skip = 0, take = 50, status?: string): Promise<PaginatedResponse<MusicResponseDto>> {
    const params = new URLSearchParams({ skip: String(skip), take: String(take) })
    if (status) params.set('status', status)
    return unwrapPaginatedResponse(() =>
      apiClient.get<MusicResponseDto[]>(`${API_ENDPOINTS.music}?${params.toString()}`)
    )
  },

  /**
   * Link a music to a jam
   * @param musicId - Music ID
   * @param jamId - Jam ID
   * @returns Promise with confirmation
   */
  async linkToJam(musicId: string, jamId: string): Promise<Record<string, unknown>> {
    return unwrapResponse(() => apiClient.patch<Record<string, unknown>>(API_ENDPOINTS.linkMusicToJam(musicId, jamId), {}))
  },

  async updateJamMusic(jamMusicId: string, jamId: string, data: { notes?: string }): Promise<JamMusicResponseDto> {
    return unwrapResponse(() => apiClient.patch<JamMusicResponseDto>(API_ENDPOINTS.updateJamMusic(jamMusicId, jamId), data))
  },

  /**
   * Update a music
   * @param id - Music ID
   * @param data - Update data
   * @returns Promise with updated music
   */
  async update(id: string, data: UpdateMusicDto): Promise<MusicResponseDto> {
    return unwrapResponse(() => apiClient.patch<MusicResponseDto>(API_ENDPOINTS.musicById(id), data))
  },

  /**
   * Delete a music
   * @param id - Music ID
   * @returns Promise with deletion confirmation
   */
  async remove(id: string): Promise<void> {
    return unwrapResponse(() => apiClient.delete<void>(API_ENDPOINTS.musicById(id)))
  },
}

