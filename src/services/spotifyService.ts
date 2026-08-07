/**
 * Spotify Service
 * Handles playlist import and export via backend API
 */

import { apiClient, API_ENDPOINTS , unwrapResponse } from '../lib/api'
import type {
  SpotifyImportRequest,
  SpotifyImportResponse,
  SpotifyExportRequest,
  SpotifyExportResponse,
  SpotifyTrackMetadata,
} from '../types/spotify.types'

export const spotifyService = {
  async importPlaylist(data: SpotifyImportRequest): Promise<SpotifyImportResponse> {
    return unwrapResponse(() => apiClient.post<SpotifyImportResponse>(API_ENDPOINTS.spotify.import, data))
  },

  async exportPlaylist(data: SpotifyExportRequest): Promise<SpotifyExportResponse> {
    return unwrapResponse(() => apiClient.post<SpotifyExportResponse>(API_ENDPOINTS.spotify.export, data))
  },

  async getTrackMetadata(trackUrl: string): Promise<SpotifyTrackMetadata> {
    return unwrapResponse(() => apiClient.post<SpotifyTrackMetadata>(API_ENDPOINTS.spotify.track, { trackUrl }))
  },
}
