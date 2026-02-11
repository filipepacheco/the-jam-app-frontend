import type {JamResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useState} from "react";
import {scheduleService} from "../../services";
import {Alert} from '../../components';
import {DJControlActions, QueueStats, SongQueueTimeline} from "../../components/dj-control";
import {useJamControl} from "../../hooks";
import {formatError} from "../../lib/api/errorHandler";

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
    const { liveState, isLoading, error, start, stop, resume, pause, next, previous, refresh } =
        useJamControl(jam.id, {
            autoRefreshEnabled: true,
            autoRefreshInterval: 5000, // 5 seconds
        })

    const handleRefresh = async () => {
        await refresh()
        onReload()
    }

    const handleRemoveSong = async (scheduleId: string) => {
        if (!confirm(t('dj_control.confirm_remove'))) return
        setActionLoading(true)
        setActionError(null)
        try {
            await scheduleService.remove(scheduleId)
            setSuccess(t('dj_control.song_removed'))
            await handleRefresh()
        } catch (err) {
            setActionError(formatError(err))
        } finally {
            setActionLoading(false)
        }
    }

    const handleApproveSong = async (scheduleId: string) => {
        setActionLoading(true)
        setActionError(null)
        try {
            await scheduleService.update(scheduleId, {status: 'SCHEDULED'})
            setSuccess(t('dj_control.song_approved'))
            await handleRefresh()
        } catch (err) {
            setActionError(formatError(err))
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t('dj_control.title_with_emoji')}</h2>
            </div>

            {error && <Alert type="error" message={error} onDismiss={() => {/* Error is auto-cleared on next state update */}}/>}
            {actionError && <Alert type="error" message={actionError} onDismiss={() => setActionError(null)}/>}
            {success && <Alert type="success" message={success} onDismiss={() => setSuccess(null)}/>}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Timeline */}
                <div className="lg:col-span-3 min-w-0">
                    {isLoading && !liveState ? (
                        <div className="card bg-base-200 shadow">
                            <div className="card-body text-center">
                                <p className="text-sm text-base-content/70">{t('common.loading')}</p>
                                <progress className="progress progress-primary w-full mt-2"></progress>
                            </div>
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

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Queue Stats */}
                    <QueueStats liveState={liveState}/>

                    {/* Controls */}
                    <DJControlActions
                        jamId={jam.id}
                        liveState={liveState}
                        isLoading={isLoading}
                        error={error}
                        onStart={start}
                        onStop={stop}
                        onResume={resume}
                        onPause={pause}
                        onNext={next}
                        onPrevious={previous}
                        onRefresh={handleRefresh}
                        onError={() => {/* Error is handled by hook */}}
                    />
                </div>
            </div>
        </div>
    )
}