/**
 * Music Table Row Component
 * Displays a single music entry in the table with actions
 */

import type {MusicResponseDto} from '../types/api.types'
import {useTranslation} from 'react-i18next'

interface MusicTableRowProps {
  music: MusicResponseDto
  formatDuration: (seconds?: number) => string
  isHost: boolean
  onEdit: (music: MusicResponseDto) => void
  onDelete: (music: MusicResponseDto) => void
  onApprove?: (music: MusicResponseDto) => void
  onReject?: (music: MusicResponseDto) => void
}

export function MusicTableRow({
  music,
  formatDuration,
  isHost,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: MusicTableRowProps) {
  const { t } = useTranslation()
  return (
    <tr className="hover">
      <td className="font-semibold">{music.title}</td>
      <td>{music.artist}</td>
      <td>
        <span className="badge badge-outline">{music.genre || t('common.unknown')}</span>
      </td>
      <td>{formatDuration(music.duration)}</td>
      <td>
        {music.link ? (
          <a
            href={music.link}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary text-sm truncate"
            title={music.link}
          >
            🔗 {t('common.link')}
          </a>
        ) : (
          <span className="text-xs text-base-content/50">-</span>
        )}
      </td>
      <td>
        <div
          className={`badge badge-lg ${music.status === 'SUGGESTED' ? 'badge-warning' : 'badge-success'}`}
        >
          {music.status === 'SUGGESTED' ? `💡 ${t('schedule.statuses.suggested')}` : `✅ ${t('schedule.statuses.approved')}`}
        </div>
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
}

/**
 * Musicians Badges Component
 * Displays needed musicians for a song
 */
interface MusiciansBadgesProps {
  music: MusicResponseDto
}

export function MusiciansBadges({ music }: MusiciansBadgesProps) {
  const { t } = useTranslation()
  const instrumentCounts = [
    { count: music.neededDrums || 0, emoji: '🥁', label: t('schedule.instruments.drums') },
    { count: music.neededGuitars || 0, emoji: '🎸', label: t('schedule.instruments.guitars') },
    { count: music.neededVocals || 0, emoji: '🎤', label: t('schedule.instruments.vocals') },
    { count: music.neededBass || 0, emoji: '🎸', label: t('schedule.instruments.bass') },
    { count: music.neededKeys || 0, emoji: '🎹', label: t('schedule.instruments.keys') },
  ]

  const hasInstruments = instrumentCounts.some((inst) => inst.count > 0)

  return (
    <div className="flex flex-wrap gap-1">
      {instrumentCounts.map((inst) =>
        inst.count > 0 ? (
          <span key={inst.label} className="badge badge-sm">
            {inst.emoji} {inst.count}
          </span>
        ) : null
      )}
      {!hasInstruments && <span className="text-xs text-base-content/50">{t('common.none')}</span>}
    </div>
  )
}

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
    <div className="flex gap-1 flex-wrap">
      {isSuggested && isHost ? (
        <>
          <button
            onClick={() => onApprove?.(music)}
            className="btn btn-xs btn-success"
            title={t('common.approve')}
          >
            ✅
          </button>
          <button
            onClick={() => onReject?.(music)}
            className="btn btn-xs btn-error btn-outline"
            title={t('common.reject')}
          >
            ❌
          </button>
        </>
      ) : isHost && !isSuggested ? (
        <>
          <button
            onClick={() => onEdit(music)}
            className="btn btn-xs btn-ghost"
            title={t('common.edit')}
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(music)}
            className="btn btn-xs btn-error btn-outline"
            title={t('common.delete')}
          >
            🗑️
          </button>
        </>
      ) : (
        <span className="text-xs text-base-content/50">-</span>
      )}
    </div>
  )
}

