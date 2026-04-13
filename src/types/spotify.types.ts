export interface SpotifyImportRequest {
  playlistUrl: string
  jamId?: string           // NEW: Optional - import to existing jam
  name?: string            // Ignored if jamId provided
  description?: string     // Ignored if jamId provided
  date?: string            // Ignored if jamId provided
  location?: string        // Ignored if jamId provided
  slug?: string            // Ignored if jamId provided
}

export interface SpotifyImportResponse {
  jam: { id: string; name: string }
  importedTracks: number       // New Music records created
  reusedTracks: number         // Existing Music records reused
  skippedTracks: number        // Failed to import
  addedTracks: number          // NEW: Actually added to jam
  duplicateTracks: number      // NEW: Skipped (already in jam)
  isExistingJam: boolean       // NEW: Whether existing jam was used
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

export interface SpotifyTrackMetadata {
  id: string
  title: string
  artist: string
  durationMs: number
  spotifyUrl: string
  albumName?: string
  albumImageUrl?: string
}
