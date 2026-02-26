import type {JamResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useMemo} from "react";

/**
 * Registrations Tab Component
 */
export function RegistrationsTab({jam}: { jam: JamResponseDto }) {
    const {t} = useTranslation()
    const allRegistrations = useMemo(
        () => jam.schedules?.flatMap(s => s.registrations || []) || [],
        [jam.schedules]
    )

    return (
        <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">👥 {t('jam_management.registrations.title')}</h2>

            {allRegistrations.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                    {allRegistrations.map((registration) => (
                        <div key={registration.id} className="card bg-base-200 shadow">
                            <div className="card-body p-3 sm:p-4">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-sm sm:text-base">{registration.musician?.name}</h3>
                                        <p className="text-xs sm:text-sm text-base-content/70">
                                            {registration.musician?.instrument}
                                        </p>
                                    </div>
                                    <div
                                        className="badge badge-outline badge-xs sm:badge-sm">{registration.status}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="alert">
                    <p className="text-sm">{t('jam_management.registrations.no_registrations')}</p>
                </div>
            )}
        </div>
    )
}
