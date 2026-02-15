/**
 * MusicianSlotRow - Compact single-line row for a registered musician
 * Shows: instrument emoji + name (+ contact/level on desktop) + status dot + action buttons
 * ~22px tall per row for maximum density on mobile
 */

import type { RegistrationResponseDto } from '../../types/api.types'
import { Check, X, Trash2 } from 'lucide-react'
import { getInstrumentIcon } from '../../lib/schedule/instrumentHelpers'
import { useTranslation } from 'react-i18next'

interface MusicianSlotRowProps {
  registration: RegistrationResponseDto
  loading?: boolean
  showActions?: boolean
  onApprove?: (registrationId: string) => void
  onReject?: (registrationId: string) => void
  onDelete?: (registrationId: string) => void
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
}: MusicianSlotRowProps) {
  const { t } = useTranslation()
  const status = registration.status || 'PENDING'
  const instrument = registration.instrument ?? registration.musician?.instrument ?? ''
  const name = registration.musician?.name || t('common.unknown')

  return (
    <div className="group flex items-center gap-1.5 py-0.5 text-xs min-h-[22px]">
      {/* Instrument icon */}
      <span className="flex-shrink-0 w-4 text-center text-sm leading-none">
        {getInstrumentIcon(instrument)}
      </span>

      {/* Musician name - flex-1 on mobile, natural width on lg+ (grid handles layout) */}
      <span className="truncate flex-1 lg:flex-initial min-w-0 font-medium text-base-content">
        {name}
      </span>
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

      {/* Status dot */}
      <span
        className={`flex-shrink-0 w-2 h-2 rounded-full ${statusDotColor[status] || 'bg-warning'}`}
        title={t(`registration.statuses.${status.toLowerCase()}`)}
      />

      {/* Action buttons */}
      {showActions && (
        <div className="flex-shrink-0 flex items-center gap-0.5">
          {status !== 'APPROVED' && status !== 'REJECTED' && (
            <>
              <button
                onClick={() => onApprove?.(registration.id)}
                className="btn btn-circle btn-ghost btn-xs"
                disabled={loading}
                title={t('common.approve')}
              >
                <Check className="w-3 h-3 text-success" />
              </button>
              <button
                onClick={() => onReject?.(registration.id)}
                className="btn btn-circle btn-ghost btn-xs"
                disabled={loading}
                title={t('common.reject')}
              >
                <X className="w-3 h-3 text-error" />
              </button>
            </>
          )}
          {status === 'APPROVED' && (
            <button
              onClick={() => onDelete?.(registration.id)}
              className="btn btn-circle btn-ghost btn-xs opacity-40 hover:opacity-100 transition-opacity"
              disabled={loading}
              title={t('common.delete')}
            >
              <Trash2 className="w-3 h-3 text-error" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
