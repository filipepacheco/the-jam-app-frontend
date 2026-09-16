/**
 * ScheduleOverflowMenu - Compact dropdown for schedule actions
 * Wraps the canonical OverflowMenu with Schedule-specific status transitions
 */

import { CheckCircle, Trash2, UserPlus, CheckCheck, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { OverflowMenu, type NavigationMenuItem } from '../Navigation'

interface ScheduleOverflowMenuProps {
  status: string | undefined
  loading?: boolean
  hasPendingRegistrations?: boolean
  onStatusChange?: (status: string) => void
  onDelete?: () => void
  onAddMusician?: () => void
  onApproveAll?: () => void
  onEditMusic?: () => void
}

export function ScheduleOverflowMenu({
  status,
  loading = false,
  hasPendingRegistrations = false,
  onStatusChange,
  onDelete,
  onAddMusician,
  onApproveAll,
  onEditMusic,
}: ScheduleOverflowMenuProps) {
  const { t } = useTranslation()

  const items: NavigationMenuItem[] = []

  if (status === 'IN_PROGRESS') {
    items.push({
      id: 'complete',
      label: t('schedule.actions.mark_completed', 'Mark as completed'),
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      disabled: loading,
      onSelect: () => onStatusChange?.('COMPLETED'),
    })
  }

  if (onAddMusician) {
    items.push({
      id: 'add-musician',
      label: t('schedule.add_musician_btn'),
      icon: <UserPlus className="w-3.5 h-3.5" />,
      disabled: loading,
      onSelect: onAddMusician,
    })
  }

  if (hasPendingRegistrations && onApproveAll) {
    items.push({
      id: 'approve-all',
      label: t('schedule.approve_all', 'Approve all'),
      icon: <CheckCheck className="w-3.5 h-3.5" />,
      disabled: loading,
      onSelect: onApproveAll,
    })
  }

  if (onEditMusic) {
    items.push({
      id: 'edit-music',
      label: t('schedule.edit_music', 'Editar Música'),
      icon: <Pencil className="w-3.5 h-3.5" />,
      disabled: loading,
      onSelect: onEditMusic,
    })
  }

  items.push({
    id: 'delete',
    label: t('common.delete'),
    icon: <Trash2 className="w-3.5 h-3.5" />,
    disabled: loading,
    destructive: true,
    onSelect: () => onDelete?.(),
  })

  return <OverflowMenu items={items} label={t('common.actions')} />
}
