/**
 * Music Card Component
 * Compact mobile-friendly card view for music library
 * Supports inline quick editing via expandable panel
 */

import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import type { MusicResponseDto, UpdateMusicDto } from '../types/api.types'
import { formatDuration } from '../lib/formatters'
import { getInstrumentIcon } from '../lib/schedule/instrumentHelpers'
import { SpotifyPreview, isSpotifyTrackLink } from './SpotifyPreview'
import { QuickEditPanel } from './QuickEditPanel'

interface MusicCardProps {
  music: MusicResponseDto
  isHost: boolean
  isExpanded?: boolean
  onDelete: (music: MusicResponseDto) => void
  onToggleExpand?: (musicId: string) => void
  onQuickSave?: (id: string, data: UpdateMusicDto) => Promise<boolean>
  onApprove?: (music: MusicResponseDto) => void
  onReject?: (music: MusicResponseDto) => void
}

// Spotify icon SVG
const SpotifyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-4"
    fill="currentColor"
    aria-label="Spotify"
  >
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
)

export const MusicCard = memo(function MusicCard({
  music,
  isHost,
  isExpanded = false,
  onDelete,
  onToggleExpand,
  onQuickSave,
  onApprove,
  onReject,
}: MusicCardProps) {
  const { t } = useTranslation()
  const isSuggested = music.status === 'SUGGESTED'

  const instrumentCounts = [
    { count: music.neededDrums || 0, key: 'drums', label: t('schedule.instruments.drums') },
    { count: music.neededGuitars || 0, key: 'guitars', label: t('schedule.instruments.guitars') },
    { count: music.neededVocals || 0, key: 'vocals', label: t('schedule.instruments.vocals') },
    { count: music.neededBass || 0, key: 'bass', label: t('schedule.instruments.bass') },
    { count: music.neededKeys || 0, key: 'keys', label: t('schedule.instruments.keys') },
  ].filter(inst => inst.count > 0)

  // Check if link is a Spotify track (playable preview)
  const hasSpotifyPreview = isSpotifyTrackLink(music.link)
  // Check if link is any Spotify URL (for icon display)
  const isSpotifyLink = music.link?.includes('spotify.com')

  const handlePencilClick = () => {
    if (onToggleExpand) {
      onToggleExpand(music.id)
    }
  }

  const metaInfo = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {music.genre && (
        <span className="badge badge-outline badge-xs">{music.genre}</span>
      )}
      {music.duration && (
        <span className="text-xs text-base-content/60">
          ⏱️ {formatDuration(music.duration)}
        </span>
      )}
      {instrumentCounts.map((inst) => (
        <span key={inst.key} className="text-xs text-base-content/60">
          {getInstrumentIcon(inst.key)} {inst.count}
        </span>
      ))}
      {hasSpotifyPreview ? (
        <SpotifyPreview link={music.link} title={music.title} size="sm" />
      ) : music.link ? (
        <a
          href={music.link}
          target="_blank"
          rel="noopener noreferrer"
          className="link link-primary flex items-center gap-1 text-xs"
          title={isSpotifyLink ? 'Spotify' : t('common.link')}
        >
          {isSpotifyLink ? <SpotifyIcon /> : '🔗'}
        </a>
      ) : null}
    </div>
  )

  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm compact">
      <div className="card-body p-3">
        {/* Main row: content + actions */}
        <div className="flex items-center gap-2">
          {/* Title, Artist & Meta - flows horizontally on tablet */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <div className="min-w-0 shrink-0 sm:shrink">
              <h3 className="font-bold text-base leading-tight truncate">{music.title}</h3>
              <p className="text-sm text-base-content/70 truncate">{music.artist}</p>
            </div>
            <div className="hidden sm:block">{metaInfo}</div>
          </div>

          {/* Action Buttons */}
          {isHost && (
            <div className="flex items-center gap-1 shrink-0">
              {isSuggested ? (
                <>
                  <button
                    onClick={() => { void onApprove?.(music) }}
                    className="btn btn-xs btn-success btn-circle"
                    title={t('common.approve')}
                    aria-label={t('common.approve')}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => onReject?.(music)}
                    className="btn btn-xs btn-error btn-outline btn-circle"
                    title={t('common.reject')}
                    aria-label={t('common.reject')}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePencilClick}
                    className={`btn btn-xs btn-ghost btn-circle ${isExpanded ? 'btn-active' : ''}`}
                    title={t('common.edit')}
                    aria-label={t('common.edit')}
                    aria-expanded={isExpanded}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(music)}
                    className="btn btn-xs btn-error btn-outline btn-circle"
                    title={t('common.delete')}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          )}

        </div>

        {/* Meta info below title on small screens only */}
        <div className="sm:hidden">{metaInfo}</div>

        {/* Quick Edit Panel - shown when expanded */}
        {isExpanded && onQuickSave && (
          <QuickEditPanel
            music={music}
            onSave={onQuickSave}
            onCancel={() => onToggleExpand?.(music.id)}
          />
        )}
      </div>
    </div>
  )
})
