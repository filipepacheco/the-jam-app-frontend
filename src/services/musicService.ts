/**
 * Music Service
 * Handles all API operations related to Music (Músicas)
 */

import { apiClient, API_ENDPOINTS } from '../lib/api'
import type {
  MusicResponseDto,
  JamMusicResponseDto,
  CreateMusicDto,
  UpdateMusicDto,
  ApiResponse,
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
  async create(data: CreateMusicDto): Promise<ApiResponse<MusicResponseDto>> {
    return apiClient.post<MusicResponseDto>(API_ENDPOINTS.music as string, data)
  },

  /**
   * Get all music (independent of jam)
   * @returns Promise with array of music
   */
  async findAll(): Promise<ApiResponse<MusicResponseDto[]>> {
    return apiClient.get<MusicResponseDto[]>(API_ENDPOINTS.music as string)
  },

  /**
   * Link a music to a jam
   * @param musicId - Music ID
   * @param jamId - Jam ID
   * @returns Promise with confirmation
   */
  async linkToJam(musicId: string, jamId: string): Promise<ApiResponse<Record<string, unknown>>> {
    return apiClient.patch<Record<string, unknown>>(API_ENDPOINTS.linkMusicToJam(musicId, jamId), {})
  },

  async updateJamMusic(jamMusicId: string, jamId: string, data: { notes?: string }): Promise<ApiResponse<JamMusicResponseDto>> {
    return apiClient.patch<JamMusicResponseDto>(API_ENDPOINTS.updateJamMusic(jamMusicId, jamId), data)
  },

  /**
   * Update a music
   * @param id - Music ID
   * @param data - Update data
   * @returns Promise with updated music
   */
  async update(id: string, data: UpdateMusicDto): Promise<ApiResponse<MusicResponseDto>> {
    return apiClient.patch<MusicResponseDto>(API_ENDPOINTS.musicById(id), data)
  },

  /**
   * Delete a music
   * @param id - Music ID
   * @returns Promise with deletion confirmation
   */
  async remove(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.musicById(id))
  },
}

