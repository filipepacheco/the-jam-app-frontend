/**
 * MusicianSlotRow - Compact single-line row for a registered musician
 * Shows: instrument emoji + name (+ contact/level on desktop) + status dot + action buttons
 */

import type { RegistrationResponseDto } from '../../types/api.types'
import { Check, X, Trash2 } from 'lucide-react'
import { getInstrumentEmoji } from '../../lib/schedule/instrumentHelpers'
import { useTranslation } from 'react-i18next'

interface MusicianSlotRowProps {
  registration: RegistrationResponseDto
  loading?: boolean
  showActions?: boolean
  onApprove?: (registrationId: string) => void
  onReject?: (registrationId: string) => void
  onDelete?: (registrationId: string) => void
  onMusicianClick?: (musicianId: string) => void
}

const statusDotColor: Record<string, string> = {
  APPROVED: 'bg-success',
  REJECTED: 'bg-error',
  PENDING: 'bg-warning',
}

export function MusicianSlotRow({
  registration,
  loading = false,
  showActions = false,
  onApprove,
  onReject,
  onDelete,
  onMusicianClick,
}: MusicianSlotRowProps) {
  const { t } = useTranslation()
  const status = registration.status || 'PENDING'
  const instrument = registration.instrument ?? registration.musician?.instrument ?? ''
  const name = registration.musician?.name || t('common.unknown')

  return (
    <div className="group flex items-center gap-1.5 py-1 text-xs min-h-[44px]">
      {/* Instrument icon */}
      <span className="flex-shrink-0 w-4 text-center text-sm leading-none">
        {getInstrumentEmoji(instrument)}
      </span>

      {/* Status dot - informational, inline with identity */}
      <span
        className={`flex-shrink-0 w-2 h-2 rounded-full ${statusDotColor[status] || 'bg-warning'}`}
        title={t(`registration.statuses.${status.toLowerCase()}`)}
        role="img"
        aria-label={t(`registration.statuses.${status.toLowerCase()}`)}
      />

      {/* Musician name */}
      {onMusicianClick ? (
        <button
          type="button"
          className="truncate flex-1 lg:flex-initial min-w-0 font-medium text-left text-primary/80 hover:text-primary hover:underline cursor-pointer transition-colors"
          onClick={() => registration.musician?.id && onMusicianClick(registration.musician.id)}
        >
          {name}
        </button>
      ) : (
        <span className="truncate flex-1 lg:flex-initial min-w-0 font-medium text-base-content">
          {name}
        </span>
      )}
      {registration.musician?.contact && (
        <span className="hidden lg:inline text-base-content/50 truncate max-w-[120px]">
          {registration.musician.contact}
        </span>
      )}
      {registration.musician?.level && (
        <span className="hidden lg:inline badge badge-xs badge-ghost">
          {t(`schedule.levels.${registration.musician.level}`)}
        </span>
      )}

      {/* Action buttons */}
      {showActions && (
        <div className="flex-shrink-0 flex items-center gap-1">
          {status !== 'APPROVED' && status !== 'REJECTED' && (
            <>
              <button
                onClick={() => onApprove?.(registration.id)}
                className="btn btn-circle btn-ghost btn-sm min-h-[44px] min-w-[44px]"
                disabled={loading}
                title={t('common.approve')}
                aria-label={t('common.approve')}
              >
                <Check className="w-3 h-3 text-success" />
              </button>
              <button
                onClick={() => onReject?.(registration.id)}
                className="btn btn-circle btn-ghost btn-sm min-h-[44px] min-w-[44px]"
                disabled={loading}
                title={t('common.reject')}
                aria-label={t('common.reject')}
              >
                <X className="w-3 h-3 text-error" />
              </button>
            </>
          )}
          {status === 'APPROVED' && (
            <button
              onClick={() => onDelete?.(registration.id)}
              className="btn btn-circle btn-ghost btn-sm min-h-[44px] min-w-[44px] text-error/40 hover:text-error transition-colors"
              disabled={loading}
              title={t('common.delete')}
              aria-label={t('common.delete')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
