/**
 * Music Table Row Component
 * Displays a single music entry in the table with actions
 */

import {memo} from 'react'
import type {MusicResponseDto} from '../types/api.types'
import {useTranslation} from 'react-i18next'
import {formatDuration} from '../lib/formatters'
import {getInstrumentCounts, getInstrumentIcon} from '../lib/schedule/instrumentHelpers'
import {SpotifyPlayButton, isSpotifyTrackLink} from './SpotifyPreview'
import {Action} from './Action'
import {Badge} from './data-display'

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
          <Badge size="sm">{music.genre}</Badge>
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
              // Kept as a native anchor: Action/IconAction render only a <button>, and this
              // control must keep native link semantics (browser context menu, Cmd/Ctrl-click,
              // status-bar preview) for an external link. See jam-music-migration.md.
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
        <Badge tone={music.status === 'SUGGESTED' ? 'warning' : 'success'} size="sm">
          {music.status === 'SUGGESTED' ? '💡' : '✓'} {music.status === 'SUGGESTED' ? t('common.statuses.suggested') : t('common.statuses.approved')}
        </Badge>
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

// Dense inline badge row sized for a table cell; kept hand-rolled rather than the canonical
// `Badge` because several badges must fit one table row (see jam-music-migration.md, matching
// the precedent set for `InstrumentBadges` in the Schedule migration).
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
          <Action onClick={() => { void onApprove?.(music) }} variant="primary" className="gap-1" title={t('common.approve')}>
            <Action.Label>✓ <span className="hidden xl:inline">{t('common.approve')}</span></Action.Label>
          </Action>
          <Action onClick={() => onReject?.(music)} variant="quiet" className="gap-1" title={t('common.reject')}>
            <Action.Label>✕ <span className="hidden xl:inline">{t('common.reject')}</span></Action.Label>
          </Action>
        </>
      ) : isHost && !isSuggested ? (
        <>
          <Action onClick={() => onEdit(music)} variant="quiet" className="gap-1" title={t('common.edit')}>
            <Action.Label>✏️ <span className="hidden xl:inline">{t('common.edit')}</span></Action.Label>
          </Action>
          <Action onClick={() => onDelete(music)} variant="quiet" className="gap-1" title={t('common.delete')}>
            <Action.Label>🗑️ <span className="hidden xl:inline">{t('common.delete')}</span></Action.Label>
          </Action>
        </>
      ) : (
        <span className="text-xs text-base-content/40">-</span>
      )}
    </div>
  )
}

