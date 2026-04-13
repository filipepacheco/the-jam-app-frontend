/**
 * Music Table Row Component
 * Displays a single music entry in the table with actions
 */

import {memo} from 'react'
import type {MusicResponseDto} from '../types/api.types'
import {useTranslation} from 'react-i18next'
import {formatDuration} from '../lib/formatters'
import {getInstrumentIcon} from '../lib/schedule/instrumentHelpers'
import {SpotifyPlayButton, isSpotifyTrackLink} from './SpotifyPreview'

interface MusicTableRowProps {
  music: MusicResponseDto
  isHost: boolean
  onEdit: (music: MusicResponseDto) => void
  onDelete: (music: MusicResponseDto) => void
  onApprove?: (music: MusicResponseDto) => void
  onReject?: (music: MusicResponseDto) => void
}

memo(function MusicTableRow({
  music,
  isHost,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: MusicTableRowProps) {
  const { t } = useTranslation()
  return (
    <tr className="hover">
      <td className="font-semibold truncate" title={music.title}>{music.title}</td>
      <td className="truncate" title={music.artist}>{music.artist}</td>
      <td className="hidden sm:table-cell">
        {music.genre ? (
          <span className="badge badge-outline badge-sm">{music.genre}</span>
        ) : (
          <span className="text-xs text-base-content/40">-</span>
        )}
      </td>
      <td className="hidden sm:table-cell tabular-nums text-sm">{formatDuration(music.duration)}</td>
      <td>
        <div className="flex items-center gap-1">
          {music.link ? (
            isSpotifyTrackLink(music.link) ? (
              <SpotifyPlayButton link={music.link} title={music.title} />
            ) : (
              <a
                href={music.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-xs min-h-[44px] min-w-[44px]"
                title={music.link}
              >
                🔗
              </a>
            )
          ) : (
            <span className="text-xs text-base-content/40">-</span>
          )}
        </div>
      </td>
      <td>
        <span
          className={`badge badge-sm ${music.status === 'SUGGESTED' ? 'badge-warning' : 'badge-success'}`}
        >
          {music.status === 'SUGGESTED' ? '💡' : '✓'} {music.status === 'SUGGESTED' ? t('common.statuses.suggested') : t('common.statuses.approved')}
        </span>
      </td>
      <td>
        <MusiciansBadges music={music} />
      </td>
      <td>
        <MusicActionButtons
          music={music}
          isHost={isHost}
          onEdit={onEdit}
          onDelete={onDelete}
          onApprove={onApprove}
          onReject={onReject}
        />
      </td>
    </tr>
  )
});

/**
 * Musicians Badges Component
 * Displays needed musicians for a song
 */
interface MusiciansBadgesProps {
  music: MusicResponseDto
}

export const MusiciansBadges = memo(function MusiciansBadges({ music }: MusiciansBadgesProps) {
  const { t } = useTranslation()
  const instrumentCounts = getInstrumentCounts(music, t)

  const hasInstruments = instrumentCounts.some((inst) => inst.count > 0)

  return (
    <div className="flex flex-wrap gap-1">
      {instrumentCounts.map((inst) =>
        inst.count > 0 ? (
          <span key={inst.key} className="badge badge-sm gap-0.5" title={inst.label}>
            {getInstrumentIcon(inst.key)} {inst.count}
          </span>
        ) : null
      )}
      {!hasInstruments && <span className="text-xs text-base-content/40">-</span>}
    </div>
  )
})

/**
 * Music Action Buttons Component
 * Displays action buttons based on user role and song status
 */
interface MusicActionButtonsProps {
  music: MusicResponseDto
  isHost: boolean
  onEdit: (music: MusicResponseDto) => void
  onDelete: (music: MusicResponseDto) => void
  onApprove?: (music: MusicResponseDto) => void
  onReject?: (music: MusicResponseDto) => void
}

function MusicActionButtons({
  music,
  isHost,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: MusicActionButtonsProps) {
  const { t } = useTranslation()
  const isSuggested = music.status === 'SUGGESTED'

  return (
    <div className="flex gap-1">
      {isSuggested && isHost ? (
        <>
          <button
            onClick={() => { void onApprove?.(music) }}
            className="btn btn-xs btn-success gap-1 min-h-[44px] min-w-[44px]"
            title={t('common.approve')}
          >
            ✓ <span className="hidden xl:inline">{t('common.approve')}</span>
          </button>
          <button
            onClick={() => onReject?.(music)}
            className="btn btn-xs btn-ghost text-error hover:bg-error/10 gap-1 min-h-[44px] min-w-[44px]"
            title={t('common.reject')}
          >
            ✕ <span className="hidden xl:inline">{t('common.reject')}</span>
          </button>
        </>
      ) : isHost && !isSuggested ? (
        <>
          <button
            onClick={() => onEdit(music)}
            className="btn btn-xs btn-ghost gap-1 min-h-[44px] min-w-[44px]"
            title={t('common.edit')}
          >
            ✏️ <span className="hidden xl:inline">{t('common.edit')}</span>
          </button>
          <button
            onClick={() => onDelete(music)}
            className="btn btn-xs btn-ghost text-error hover:bg-error/10 gap-1 min-h-[44px] min-w-[44px]"
            title={t('common.delete')}
          >
            🗑️ <span className="hidden xl:inline">{t('common.delete')}</span>
          </button>
        </>
      ) : (
        <span className="text-xs text-base-content/40">-</span>
      )}
    </div>
  )
}

