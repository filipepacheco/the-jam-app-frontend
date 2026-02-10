const SPOTIFY_PLAYLIST_URL_PATTERN = /^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/
const SPOTIFY_PLAYLIST_URI_PATTERN = /^spotify:playlist:[a-zA-Z0-9]+$/
const SPOTIFY_TRACK_URL_PATTERN = /open\.spotify\.com\/track\/[a-zA-Z0-9]+/
const SPOTIFY_TRACK_URI_PATTERN = /spotify:track:[a-zA-Z0-9]+/

export function isValidSpotifyPlaylistUrl(url: string): boolean {
  return SPOTIFY_PLAYLIST_URL_PATTERN.test(url) || SPOTIFY_PLAYLIST_URI_PATTERN.test(url)
}

export function isValidSpotifyTrackUrl(url: string): boolean {
  if (!url.trim()) return false
  return SPOTIFY_TRACK_URL_PATTERN.test(url) || SPOTIFY_TRACK_URI_PATTERN.test(url)
}
