import type {JamResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {useMemo, useState} from "react";
import {Pencil, ExternalLink, Play, Square, RotateCcw, Upload, Download, EllipsisVertical} from "lucide-react";
import {initiateSpotifyAuth} from "../../lib/spotify/pkce";
import {SpotifyImportModal} from "../../components";
import {getJamDashboardPath} from "../../utils/jamUrl";

/**
 * Overview Tab Component
 * Clear, non-minimalist design with visible text labels
 */
export function OverviewTab({
                                jam,
                                onStatusChange,
                                loading,
                            }: {
    jam: JamResponseDto
    onStatusChange: (status: 'ACTIVE' | 'INACTIVE' | 'LIVE' | 'FINISHED') => void
    loading: boolean
}) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const [showImportModal, setShowImportModal] = useState(false)

    const { musicianCount, performanceCount, registrationCount } = useMemo(() => {
        const allRegistrations = jam.schedules?.flatMap(s => s.registrations || []) || []
        const uniqueMusicians = new Set<string>()
        allRegistrations.forEach((reg) => uniqueMusicians.add(reg.musicianId))

        return {
            musicianCount: uniqueMusicians.size,
            performanceCount: jam._count?.schedules ?? jam.schedules?.length ?? 0,
            registrationCount: jam._count?.registrations ?? allRegistrations.length,
        }
    }, [jam.schedules, jam._count])

    // Get status control button config
    // New lifecycle: INACTIVE → ACTIVE → LIVE → FINISHED → INACTIVE
    const getStatusButton = () => {
        switch (jam.status) {
            case 'INACTIVE':
                return {
                    label: t('jam_management.overview.activate_jam'),
                    icon: <RotateCcw className="size-4" />,
                    variant: 'btn-info',
                    onClick: () => onStatusChange('ACTIVE')
                }
            case 'ACTIVE':
                return {
                    label: t('jam_management.overview.start_jam'),
                    icon: <Play className="size-4" />,
                    variant: 'btn-success',
                    onClick: () => onStatusChange('LIVE')
                }
            case 'LIVE':
                return {
                    label: t('jam_management.overview.end_jam'),
                    icon: <Square className="size-4" />,
                    variant: 'btn-error',
                    onClick: () => onStatusChange('FINISHED')
                }
            case 'FINISHED':
            default:
                return {
                    label: t('jam_management.overview.reactivate_jam'),
                    icon: <RotateCcw className="size-4" />,
                    variant: 'btn-warning',
                    onClick: () => onStatusChange('INACTIVE')
                }
        }
    }

    const statusButton = getStatusButton()
    const hasDescription = jam.description && jam.description.trim().length > 0
    const hasDate = jam.date

    return (
        <>
            <div className="space-y-3">

                {/* Lifecycle Action - Full width, dominant */}
                <button
                    onClick={statusButton.onClick}
                    className={`btn w-full ${statusButton.variant} gap-2`}
                    disabled={loading}
                >
                    {statusButton.icon}
                    {statusButton.label}
                </button>

                {/* Secondary Actions Row */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/host/jams/${jam.id}/edit`)}
                        className="btn btn-sm btn-ghost gap-2"
                    >
                        <Pencil className="size-4" />
                        {t('jam_management.overview.edit_jam')}
                    </button>
                    <a
                        href={getJamDashboardPath(jam)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-ghost gap-2"
                    >
                        <ExternalLink className="size-4" />
                        {t('jam_management.view_public_dashboard')}
                    </a>
                    <div className="dropdown dropdown-end ml-auto">
                        <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
                            <EllipsisVertical className="size-4" />
                        </div>
                        <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box shadow-lg z-10 w-52 p-2">
                            <li>
                                <button onClick={() => { void initiateSpotifyAuth(jam.id) }}>
                                    <Upload className="size-4" /> {t('spotify.export_button')}
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setShowImportModal(true)}>
                                    <Download className="size-4" /> {t('spotify.import_button')}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Stats - Single horizontal bar */}
                <div className="stats stats-horizontal w-full bg-base-200 shadow-sm">
                    <div className="stat place-items-center py-2 px-2">
                        <div className="stat-title text-xs">{t('jam_management.overview.stats.performances')}</div>
                        <div className="stat-value text-xl">{performanceCount}</div>
                    </div>
                    <div className="stat place-items-center py-2 px-2">
                        <div className="stat-title text-xs">{t('jam_management.overview.stats.registrations')}</div>
                        <div className="stat-value text-xl">{registrationCount}</div>
                    </div>
                    <div className="stat place-items-center py-2 px-2">
                        <div className="stat-title text-xs">{t('jam_management.overview.stats.musicians')}</div>
                        <div className="stat-value text-xl">{musicianCount}</div>
                    </div>
                </div>

                {/* Jam Info Card */}
                <div className="card bg-base-200 shadow-sm">
                    <div className="card-body p-3 sm:p-4">
                        <h2 className="font-bold text-lg mb-2">{t('common.details')}</h2>
                        <div className="space-y-2">
                            {hasDescription && (
                                <div>
                                    <p className="text-xs text-base-content/50">{t('common.description')}</p>
                                    <p className="text-sm whitespace-pre-line">{jam.description}</p>
                                </div>
                            )}
                            <div className="flex gap-4">
                                <div>
                                    <p className="text-xs text-base-content/50">{t('common.date')}</p>
                                    <p className="text-sm font-medium">
                                        {hasDate
                                            ? new Date(jam.date!).toLocaleDateString()
                                            : <span className="text-base-content/40">{t('jam_management.overview.date_not_set')}</span>
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-base-content/50">{t('common.host')}</p>
                                    <p className="text-sm font-medium">{jam.hostName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SpotifyImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={(jamId, isExistingJam) => {
                    setShowImportModal(false)
                    if (isExistingJam) {
                        window.location.reload()
                    } else {
                        navigate(`/host/jams/${jamId}/manage`)
                    }
                }}
                preselectedJamId={jam.id}
                preselectedJamName={jam.name}
            />
        </>
    )
}
