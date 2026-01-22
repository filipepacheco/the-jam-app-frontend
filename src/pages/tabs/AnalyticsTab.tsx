import type {JamResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";

/**
 * Analytics Tab Component
 */
export function AnalyticsTab({jam}: { jam: JamResponseDto }) {
    const {t} = useTranslation()
    const uniqueMusicians = new Set<string>()
    jam.registrations?.forEach((reg) => uniqueMusicians.add(reg.musicianId))

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">📈 {t('jam_management.analytics.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">{t('jam_management.analytics.total_songs')}</h3>
                        <p className="text-3xl font-bold">{jam.jamMusics?.length || 0}</p>
                    </div>
                </div>
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">{t('jam_management.analytics.unique_musicians')}</h3>
                        <p className="text-3xl font-bold">{uniqueMusicians.size}</p>
                    </div>
                </div>
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">{t('jam_management.analytics.performances')}</h3>
                        <p className="text-3xl font-bold">{jam.schedules?.length || 0}</p>
                    </div>
                </div>
            </div>

            {jam.status === 'FINISHED' && (
                <div className="alert alert-success">
                    <p>✅ {t('jam_management.analytics.finished_message')}</p>
                </div>
            )}
        </div>
    )
}