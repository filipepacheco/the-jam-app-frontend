/**
 * Schedule Action Buttons Component
 * Renders appropriate action buttons based on schedule status
 */

import {useTranslation} from 'react-i18next'

interface ScheduleActionButtonsProps {
    status: string | undefined
    loading?: boolean
    isSuggested?: boolean
    onStatusChange?: (status: string) => void
    onDelete?: () => void
}

export function ScheduleActionButtons({
                                          status, loading = false, isSuggested = false, onStatusChange, onDelete,
                                      }: ScheduleActionButtonsProps) {
    const {t} = useTranslation()
    return (<div className="flex flex-col gap-1">
        {/* Suggested action buttons */}
        {isSuggested && (<>
            <button
                onClick={() => onStatusChange?.('SCHEDULED')}
                className="btn btn-sm btn-success"
                disabled={loading}
            >
                ✓ {t('common.approve')}
            </button>
            <button
                onClick={onDelete}
                className="btn btn-sm btn-error"
                disabled={loading}
            >
                ✕ {t('common.reject')}
            </button>
        </>)}

        {status === 'COMPLETED' && (<span className="text-xs text-success">{t('schedule.performance_completed')}</span>)}

        {!isSuggested && status !== 'COMPLETED' && (<>
            <button
                onClick={onDelete}
                className="btn btn-sm btn-error btn-outline"
                disabled={loading}
            >
                🗑️ {t('common.delete')}
            </button>
        </>)}
    </div>)
}

