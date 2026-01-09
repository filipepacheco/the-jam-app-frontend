import type {JamResponseDto} from "../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";

/**
 * Overview Tab Component
 */
export function OverviewTab({
                                jam,
                                onStatusChange,
                                loading,
                            }: {
    jam: JamResponseDto
    onStatusChange: (status: 'ACTIVE' | 'INACTIVE' | 'FINISHED') => void
    loading: boolean
}) {
    const {t} = useTranslation()
    const navigate = useNavigate()

    const uniqueMusicians = new Set<string>()
    jam.registrations?.forEach((reg) => uniqueMusicians.add(reg.musicianId))

    return (
        <div className="space-y-4 sm:space-y-6">

            {/* Quick Actions & Status Controls - Merged */}
            <div className="card bg-base-200 shadow-lg">
                <div className="card-body p-3 sm:p-6">
                    <h2 className="card-title text-base sm:text-lg">{t('jam_management.overview.actions_controls')}</h2>

                    {/* Quick Actions Section */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <button
                            onClick={() => navigate(`/host/jams/${jam.id}/edit`)}
                            className="btn btn-primary btn-xs sm:btn-sm"
                        >
                            ✏️ {t('jam_management.overview.edit_jam')}
                        </button>
                        <button onClick={() => navigate(`/jams/${jam.id}`)}
                                className="btn btn-secondary btn-xs sm:btn-sm">
                            👁️ {t('jam_management.overview.view_public')}
                        </button>
                        {jam.status === 'INACTIVE' && (
                            <button
                                onClick={() => onStatusChange('ACTIVE')}
                                className="btn btn-success btn-xs sm:btn-sm"
                                disabled={loading}
                            >
                                ▶️ {t('jam_management.overview.start_jam')}
                            </button>
                        )}
                        {jam.status === 'ACTIVE' && (
                            <button
                                onClick={() => onStatusChange('FINISHED')}
                                className="btn btn-error btn-xs sm:btn-sm"
                                disabled={loading}
                            >
                                ⏹️ {t('jam_management.overview.end_jam')}
                            </button>
                        )}
                        {jam.status === 'FINISHED' && (
                            <button
                                onClick={() => onStatusChange('INACTIVE')}
                                className="btn btn-warning btn-xs sm:btn-sm"
                                disabled={loading}
                            >
                                🔄 {t('jam_management.overview.reactivate_jam')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="stats shadow bg-base-200 p-3 sm:p-6">
                    <div className="stat">
                        <div
                            className="stat-title text-xs sm:text-sm">{t('jam_management.overview.stats.performances')}</div>
                        <div
                            className="stat-value text-success text-xl sm:text-2xl lg:text-3xl">{jam.schedules?.length || 0}</div>
                    </div>
                </div>
                <div className="stats shadow bg-base-200 p-3 sm:p-6">
                    <div className="stat">
                        <div
                            className="stat-title text-xs sm:text-sm">{t('jam_management.overview.stats.registrations')}</div>
                        <div
                            className="stat-value text-accent text-xl sm:text-2xl lg:text-3xl">{jam.registrations?.length || 0}</div>
                    </div>
                </div>
                <div className="stats shadow bg-base-200 p-3 sm:p-6">
                    <div className="stat">
                        <div
                            className="stat-title text-xs sm:text-sm">{t('jam_management.overview.stats.musicians')}</div>
                        <div
                            className="stat-value text-secondary text-xl sm:text-2xl lg:text-3xl">{uniqueMusicians.size}</div>
                    </div>
                </div>
            </div>

            {/* Jam Info Card */}
            <div className="card bg-base-200 shadow-lg">
                <div className="card-body p-3 sm:p-6">
                    <h2 className="card-title text-base sm:text-lg">{t('common.details')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="sm:col-span-2">
                            <p className="text-xs sm:text-sm text-base-content/70">{t('common.description')}</p>
                            <p className="font-semibold text-sm sm:text-base">{jam.description || t('jam_management.overview.no_description')}</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-base-content/70">{t('common.date')}</p>
                            <p className="font-semibold text-sm sm:text-base">
                                {jam.date ? new Date(jam.date).toLocaleString() : t('jam_management.overview.date_not_set')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-base-content/70">{t('common.host')}</p>
                            <p className="font-semibold text-sm sm:text-base">{jam.hostName}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}