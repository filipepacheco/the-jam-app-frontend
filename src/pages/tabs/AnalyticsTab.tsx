import type {JamResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {Alert} from "../../components";

/**
 * Analytics Tab Component
 */
export function AnalyticsTab({jam}: { jam: JamResponseDto }) {
    const {t} = useTranslation()

    // Derive registrations from schedules (single source of truth)
    const allRegistrations = jam.schedules?.flatMap(s => s.registrations || []) || []
    const uniqueMusicians = new Set<string>()
    allRegistrations.forEach((reg) => uniqueMusicians.add(reg.musicianId))
    const musicianCount = uniqueMusicians.size > 0 ? uniqueMusicians.size : (jam._count?.registrations ?? 0)

    const songCount = jam._count?.schedules ?? jam.schedules?.length ?? 0
    const performanceCount = songCount

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">📈 {t('jam_management.analytics.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">{t('jam_management.analytics.total_songs')}</h3>
                        <p className="text-3xl font-bold">{songCount}</p>
                    </div>
                </div>
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">{t('jam_management.analytics.unique_musicians')}</h3>
                        <p className="text-3xl font-bold">{musicianCount}</p>
                    </div>
                </div>
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">{t('jam_management.analytics.performances')}</h3>
                        <p className="text-3xl font-bold">{performanceCount}</p>
                    </div>
                </div>
            </div>

            {jam.status === 'FINISHED' && (
                <Alert type="success" message={t('jam_management.analytics.finished_message')} />
            )}
        </div>
    )
}