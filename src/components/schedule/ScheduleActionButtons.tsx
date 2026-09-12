/**
 * Schedule Action Buttons Component
 * Renders appropriate action buttons based on schedule status
 */

import {useTranslation} from 'react-i18next'
import {Action} from '../Action'

interface ScheduleActionButtonsProps {
    status: string | undefined
    loading?: boolean
    isSuggested?: boolean
    onStatusChange?: (status: string) => void
    onDelete?: () => void
}

function actionState(loading: boolean, loadingLabel: string) {
    return loading
        ? {state: 'loading' as const, loadingLabel}
        : {state: 'idle' as const}
}

export function ScheduleActionButtons({
                                          status, loading = false, isSuggested = false, onStatusChange, onDelete,
                                      }: ScheduleActionButtonsProps) {
    const {t} = useTranslation()
    return (<div className="flex flex-col gap-1">
        {/* Suggested action buttons */}
        {isSuggested && (<>
            <Action
                type="submit"
                onClick={() => onStatusChange?.('SCHEDULED')}
                variant="primary"
                {...actionState(loading, t('schedule.actions.approving'))}
            >
                <Action.Icon>✓</Action.Icon>
                <Action.Label>{t('schedule.actions.approve_performance')}</Action.Label>
            </Action>
            <Action
                type="submit"
                onClick={onDelete}
                variant="destructive"
                {...actionState(loading, t('schedule.actions.rejecting'))}
            >
                <Action.Icon>✕</Action.Icon>
                <Action.Label>{t('schedule.actions.reject_performance')}</Action.Label>
            </Action>
        </>)}

        {status === 'COMPLETED' && (<span className="text-xs text-success">{t('schedule.performance_completed')}</span>)}

        {!isSuggested && status !== 'COMPLETED' && (<>
            <Action
                type="submit"
                onClick={onDelete}
                variant="destructive"
                {...actionState(loading, t('schedule.actions.deleting'))}
            >
                <Action.Icon>🗑️</Action.Icon>
                <Action.Label>{t('schedule.actions.delete_performance')}</Action.Label>
            </Action>
        </>)}
    </div>)
}
