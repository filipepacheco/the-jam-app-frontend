import type {JamResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {Alert} from "../../components";

/**
 * Analytics Tab Component
 */
export function AnalyticsTab({jam}: { jam: JamResponseDto }) {
    const {t} = useTranslation()

    // Calculate unique musicians - use array when available
    const uniqueMusicians = new Set<string>()
    jam.registrations?.forEach((reg) => uniqueMusicians.add(reg.musicianId))
    const musicianCount = uniqueMusicians.size > 0 ? uniqueMusicians.size : (jam._count?.registrations ?? 0)

    // Use _count when available (list endpoint), fall back to array length (detail endpoint)
    const songCount = jam._count?.jamMusics ?? jam.jamMusics?.length ?? 0
    const performanceCount = jam._count?.schedules ?? jam.schedules?.length ?? 0

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