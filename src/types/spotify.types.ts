export interface SpotifyImportRequest {
  playlistUrl: string
  name?: string
  description?: string
  date?: string
  location?: string
}

export interface SpotifyImportResponse {
  jam: { id: string; name: string }
  importedTracks: number
  reusedTracks: number
  skippedTracks: number
  errors?: string[]
}

export interface SpotifyExportRequest {
  jamId: string
  spotifyAccessToken: string
  playlistName?: string
  playlistDescription?: string
  public?: boolean
}

export interface SpotifyExportResponse {
  spotifyPlaylistId: string
  spotifyPlaylistUrl: string
  totalTracks: number
  skippedTracks: number
  errors: string[]
}

export interface SpotifyPKCEState {
  codeVerifier: string
  state: string
  jamId: string
  redirectUri: string
}
