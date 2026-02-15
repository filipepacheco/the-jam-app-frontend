/**
 * ScheduleOverflowMenu - Compact dropdown for schedule actions
 * Replaces inline action buttons with a three-dot overflow menu
 */

import { MoreVertical, Play, CheckCircle, XCircle, Trash2, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ScheduleOverflowMenuProps {
  status: string | undefined
  loading?: boolean
  onStatusChange?: (status: string) => void
  onDelete?: () => void
  onAddMusician?: () => void
}

export function ScheduleOverflowMenu({
  status,
  loading = false,
  onStatusChange,
  onDelete,
  onAddMusician,
}: ScheduleOverflowMenuProps) {
  const { t } = useTranslation()

  const closeDropdown = () => {
    const el = document.activeElement as HTMLElement
    el?.blur()
  }

  const handleAction = (action: () => void) => {
    closeDropdown()
    action()
  }

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-xs btn-circle"
        aria-label={t('common.actions')}
      >
        <MoreVertical className="w-4 h-4" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-50 w-48 p-1 shadow-lg border border-base-300"
      >
        {/* Status transitions */}
        {status === 'SCHEDULED' && (
          <li>
            <button
              onClick={() => handleAction(() => onStatusChange?.('IN_PROGRESS'))}
              disabled={loading}
              className="text-xs"
            >
              <Play className="w-3.5 h-3.5" />
              {t('schedule.actions.start')}
            </button>
          </li>
        )}
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
        {status !== 'CANCELED' && status !== 'COMPLETED' && (
          <li>
            <button
              onClick={() => handleAction(() => onStatusChange?.('CANCELED'))}
              disabled={loading}
              className="text-xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              {t('schedule.statuses.canceled')}
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
