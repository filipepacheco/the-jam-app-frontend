/**
 * Spotify Service
 * Handles playlist import and export via backend API
 */

import { apiClient, API_ENDPOINTS } from '../lib/api'
import type { ApiResponse } from '../types/api.types'
import type {
  SpotifyImportRequest,
  SpotifyImportResponse,
  SpotifyExportRequest,
  SpotifyExportResponse,
  SpotifyTrackMetadata,
} from '../types/spotify.types'

export const spotifyService = {
  async importPlaylist(data: SpotifyImportRequest): Promise<ApiResponse<SpotifyImportResponse>> {
    return apiClient.post<SpotifyImportResponse>(API_ENDPOINTS.spotify.import, data)
  },

  async exportPlaylist(data: SpotifyExportRequest): Promise<ApiResponse<SpotifyExportResponse>> {
    return apiClient.post<SpotifyExportResponse>(API_ENDPOINTS.spotify.export, data)
  },

  async getTrackMetadata(trackUrl: string): Promise<ApiResponse<SpotifyTrackMetadata>> {
    return apiClient.post<SpotifyTrackMetadata>(API_ENDPOINTS.spotify.track, { trackUrl })
  },
}
