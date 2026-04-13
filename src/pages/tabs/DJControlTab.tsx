import type {JamResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useState} from "react";
import {scheduleService} from "../../services";
import {Alert} from '../../components';
import {QueueStats, SongQueueTimeline} from "../../components";
import {useJamControl} from "../../hooks";
import {formatError} from "../../lib/api";

/**
 * DJ Control Tab Component
 * Updated to use new useJamControl hook and LiveStateResponseDto
 */
export function DJControlTab({jam, onReload}: { jam: JamResponseDto; onReload: () => void }) {
    const {t} = useTranslation()
    const [actionLoading, setActionLoading] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)

    // Use the new jam control hook with auto-refresh
    const { liveState, isLoading, error, start, stop, next, previous, refresh } =
        useJamControl(jam.id, {
            autoRefreshEnabled: true,
            autoRefreshInterval: 5000, // 5 seconds
        })

    const handleRefresh = async () => {
        await refresh()
        onReload()
    }

    const executeAction = async (action: () => Promise<unknown>, successMsg: string) => {
        setActionLoading(true)
        setActionError(null)
        try {
            await action()
            setSuccess(successMsg)
            await handleRefresh()
        } catch (err) {
            setActionError(formatError(err))
        } finally {
            setActionLoading(false)
        }
    }

    const handleRemoveSong = async (scheduleId: string) => {
        if (!confirm(t('dj_control.confirm_remove'))) return
        await executeAction(() => scheduleService.remove(scheduleId), t('dj_control.song_removed'))
    }

    const handleApproveSong = async (scheduleId: string) => {
        await executeAction(() => scheduleService.update(scheduleId, {status: 'SCHEDULED'}), t('dj_control.song_approved'))
    }

    return (
        <div className="space-y-4">
            {error && <Alert type="error" message={error} onDismiss={() => {/* Error is auto-cleared on next state update */}}/>}
            {actionError && <Alert type="error" message={actionError} onDismiss={() => setActionError(null)}/>}
            {success && <Alert type="success" message={success} onDismiss={() => setSuccess(null)}/>}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Timeline */}
                <div className="lg:col-span-3 min-w-0">
                    {isLoading && !liveState ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-base-200 rounded-lg p-3 space-y-2">
                                    <div className="skeleton h-5 w-2/3 rounded" />
                                    <div className="skeleton h-4 w-1/3 rounded" />
                                    <div className="flex gap-2">
                                        <div className="skeleton h-5 w-16 rounded-full" />
                                        <div className="skeleton h-5 w-12 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : liveState ? (
                        <SongQueueTimeline
                            liveState={liveState}
                            suggestedSongs={liveState.suggestedSongs}
                            onRemoveSong={handleRemoveSong}
                            onApproveSong={handleApproveSong}
                            loading={isLoading || actionLoading}
                        />
                    ) : (
                        <Alert
                            type="error"
                            message={t('dj_control.errors.failed_to_load')}
                            onDismiss={() => {}}
                        />
                    )}
                </div>

                {/* Sidebar: Stats + Controls */}
                <div className="lg:col-span-1">
                    {isLoading && !liveState ? (
                        <div className="bg-base-200 rounded-lg p-4 space-y-3 animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="skeleton h-4 w-20 rounded" />
                                    <div className="skeleton h-4 w-10 rounded" />
                                </div>
                            ))}
                            <div className="skeleton h-10 w-full rounded mt-2" />
                        </div>
                    ) : (
                        <QueueStats
                            liveState={liveState}
                            jamId={jam.id}
                            isLoading={isLoading}
                            onStart={start}
                            onStop={stop}
                            onNext={next}
                            onPrevious={previous}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
