/**
 * ScheduleOverflowMenu - Compact dropdown for schedule actions
 * Replaces inline action buttons with a three-dot overflow menu
 */

import { useRef } from 'react'
import { MoreVertical, CheckCircle, Trash2, UserPlus, CheckCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ScheduleOverflowMenuProps {
  status: string | undefined
  loading?: boolean
  hasPendingRegistrations?: boolean
  onStatusChange?: (status: string) => void
  onDelete?: () => void
  onAddMusician?: () => void
  onApproveAll?: () => void
}

export function ScheduleOverflowMenu({
  status,
  loading = false,
  hasPendingRegistrations = false,
  onStatusChange,
  onDelete,
  onAddMusician,
  onApproveAll,
}: ScheduleOverflowMenuProps) {
  const { t } = useTranslation()
  const triggerRef = useRef<HTMLDivElement>(null)

  const handleAction = (action: () => void) => {
    (document.activeElement as HTMLElement)?.blur()
    action()
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      ;(document.activeElement as HTMLElement)?.blur()
    }
  }

  return (
    <div className="dropdown dropdown-end">
      <div
        ref={triggerRef}
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-sm btn-circle"
        aria-label={t('common.actions')}
      >
        <MoreVertical className="w-4 h-4" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-50 w-48 p-1 shadow-lg border border-base-300"
        onKeyDown={handleKeyDown}
      >
        {/* Status transitions */}
        {status === 'IN_PROGRESS' && (
          <li>
            <button
              onClick={() => handleAction(() => onStatusChange?.('COMPLETED'))}
              disabled={loading}
              className="text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {t('schedule.statuses.completed')}
            </button>
          </li>
        )}
        {onAddMusician && (
          <li>
            <button
              onClick={() => handleAction(onAddMusician)}
              disabled={loading}
              className="text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t('schedule.add_musician_btn')}
            </button>
          </li>
        )}
        {hasPendingRegistrations && onApproveAll && (
          <li>
            <button
              onClick={() => handleAction(onApproveAll)}
              disabled={loading}
              className="text-xs text-success"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {t('schedule.approve_all', 'Approve all')}
            </button>
          </li>
        )}

        {/* Delete */}
        <li>
          <button
            onClick={() => handleAction(() => onDelete?.())}
            disabled={loading}
            className="text-xs text-error"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('common.delete')}
          </button>
        </li>
      </ul>
    </div>
  )
}
