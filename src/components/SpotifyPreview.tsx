/**
 * Spotify Preview Component
 * Provides quick access to Spotify tracks
 */

import { memo } from 'react'

/**
 * Extracts Spotify track ID from various Spotify URL formats
 */
function extractSpotifyTrackId(link: string): string | null {
  if (!link) return null

  // Match open.spotify.com/track/{id}
  const webMatch = link.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/)
  if (webMatch) return webMatch[1]

  // Match spotify:track:{id}
  const uriMatch = link.match(/spotify:track:([a-zA-Z0-9]+)/)
  if (uriMatch) return uriMatch[1]

  return null
}

// Spotify logo SVG
const SpotifyLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
)

interface SpotifyPreviewProps {
  link?: string | null
  title?: string
  size?: 'sm' | 'md'
}

/**
 * Spotify Preview Button - opens track in Spotify
 * More reliable than embedded player
 */
export const SpotifyPreview = memo(function SpotifyPreview({
  link,
  title,
  size = 'sm'
}: SpotifyPreviewProps) {
  const trackId = link ? extractSpotifyTrackId(link) : null

  if (!trackId) return null

  const spotifyUrl = `https://open.spotify.com/track/${trackId}`
  const buttonSize = size === 'sm' ? 'btn-xs' : 'btn-sm'

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <a
      href={spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`btn ${buttonSize} btn-ghost gap-1 text-[#1DB954] hover:bg-[#1DB954]/10`}
      title={`Open "${title || 'track'}" in Spotify`}
    >
      <SpotifyLogo className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      <span className="hidden sm:inline">Spotify</span>
    </a>
  )
})

/**
 * Compact Spotify button (icon only) - opens track in Spotify
 */
export const SpotifyPlayButton = memo(function SpotifyPlayButton({
  link,
  title
}: { link?: string | null; title?: string }) {
  const trackId = link ? extractSpotifyTrackId(link) : null

  if (!trackId) return null

  const spotifyUrl = `https://open.spotify.com/track/${trackId}`

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <a
      href={spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="btn btn-circle btn-xs btn-ghost text-[#1DB954] hover:bg-[#1DB954]/20"
      title={`Open "${title || 'track'}" in Spotify`}
      aria-label={`Open ${title || 'track'} in Spotify`}
    >
      <SpotifyLogo />
    </a>
  )
})

// Utility export for checking if a link is a Spotify track
export function isSpotifyTrackLink(link?: string | null): boolean {
  return link ? extractSpotifyTrackId(link) !== null : false
}
