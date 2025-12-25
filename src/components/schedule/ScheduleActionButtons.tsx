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
    const { t } = useTranslation()
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

            {/* Non-suggested action buttons */}
            {!isSuggested && (<>
                    {(status === 'SCHEDULED' || !status) && (<button
                            onClick={() => onStatusChange?.('IN_PROGRESS')}
                            className="btn btn-sm btn-warning"
                            disabled={loading}
                        >
                            {t('schedule.actions.start')}
                        </button>)}
                    {status === 'IN_PROGRESS' && (<>
                            <button
                                onClick={() => onStatusChange?.('COMPLETED')}
                                className="btn btn-sm btn-success"
                                disabled={loading}
                            >
                                ✓ {t('common.complete')}
                            </button>
                            <button
                                onClick={() => onStatusChange?.('CANCELED')}
                                className="btn btn-sm btn-error btn-outline"
                                disabled={loading}
                            >
                                ✕ {t('common.cancel')}
                            </button>
                        </>)}
                    {status === 'CANCELED' && (<button
                            onClick={() => onStatusChange?.('SCHEDULED')}
                            className="btn btn-sm btn-outline"
                            disabled={loading}
                        >
                            {t('schedule.actions.reschedule')}
                        </button>)}
                    {status === 'COMPLETED' && (<span className="text-xs text-success">{t('schedule.performance_completed')}</span>)}
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

