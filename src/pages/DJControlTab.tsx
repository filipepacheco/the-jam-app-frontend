import type {JamResponseDto, ScheduleResponseDto} from "../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import { scheduleService } from "../services/scheduleService";
import {ErrorAlert} from '../components/ErrorAlert';
import {QueueStats} from '../components/dj-control/QueueStats';
import {SongQueueTimeline} from '../components/dj-control/SongQueueTimeline';
import {SuccessAlert} from '../components/SuccessAlert';
import {DJControlActions} from "../components/dj-control/DJControlActions.tsx";

/**
 * DJ Control Tab Component
 */
export function DJControlTab({jam, onReload}: { jam: JamResponseDto; onReload: () => void }) {
    const {t} = useTranslation()
    const [schedules, setSchedules] = useState<ScheduleResponseDto[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(0)

    useEffect(() => {
        if (jam?.schedules) {
            const sorted = jam.schedules.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            setSchedules(sorted)
        }
    }, [jam?.schedules])

    // Auto-refresh setup
    useEffect(() => {
        if (autoRefreshInterval === 0) return

        const interval = setInterval(() => {
            onReload()
        }, autoRefreshInterval)

        return () => clearInterval(interval)
    }, [autoRefreshInterval, onReload])

    const handleRemoveSong = async (scheduleId: string) => {
        if (!confirm(t('dj_control.confirm_remove'))) return
        setLoading(true)
        setError(null)
        try {
            await scheduleService.remove(scheduleId)
            setSuccess(t('dj_control.song_removed'))
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('common.error'))
        } finally {
            setLoading(false)
        }
    }

    const handleApproveSong = async (scheduleId: string) => {
        setLoading(true)
        setError(null)
        try {
            await scheduleService.update(scheduleId, {status: 'SCHEDULED'})
            setSuccess(t('dj_control.song_approved'))
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('common.error'))
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t('dj_control.title_with_emoji')}</h2>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError(null)}/>}
            {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)}/>}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Timeline */}
                <div className="lg:col-span-3 min-w-0">
                    <SongQueueTimeline
                        schedules={schedules}
                        onRemoveSong={handleRemoveSong}
                        onApproveSong={handleApproveSong}
                        loading={loading}
                    />
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Queue Stats */}
                    <QueueStats schedules={schedules}/>

                    {/* Controls */}
                    <DJControlActions
                        jamId={jam.id}
                        loading={loading}
                        onReload={onReload}
                        schedules={schedules}
                        onAutoRefreshChange={setAutoRefreshInterval}
                        autoRefreshInterval={autoRefreshInterval}
                        onError={setError}
                    />

                </div>
            </div>
        </div>
    )
}