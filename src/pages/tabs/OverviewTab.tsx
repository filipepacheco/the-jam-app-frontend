import type {JamResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import {Pencil, Eye, ExternalLink, Play, Square, RotateCcw, Upload, Download} from "lucide-react";
import {initiateSpotifyAuth} from "../../lib/spotify/pkce";
import {SpotifyImportModal} from "../../components/SpotifyImportModal";
import {getJamPath, getJamDashboardPath} from "../../utils/jamUrl";

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

    // Calculate unique musicians - use array when available
    const uniqueMusicians = new Set<string>()
    jam.registrations?.forEach((reg) => uniqueMusicians.add(reg.musicianId))
    const musicianCount = uniqueMusicians.size

    // Use _count when available (list endpoint), fall back to array length (detail endpoint)
    const performanceCount = jam._count?.schedules ?? jam.schedules?.length ?? 0
    const registrationCount = jam._count?.registrations ?? jam.registrations?.length ?? 0

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
            <div className="space-y-4">

                {/* Primary Actions Card - Clear text labels */}
                <div className="card bg-base-200 shadow-sm">
                    <div className="card-body p-3 sm:p-4">
                        {/* Main Actions - Stacked on mobile, row on desktop */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            {/* Primary Actions Group */}
                            <div className="flex flex-wrap gap-2">
                                {/* Status Control */}
                                <button
                                    onClick={statusButton.onClick}
                                    className={`btn btn-sm ${statusButton.variant} gap-2`}
                                    disabled={loading}
                                >
                                    {statusButton.icon}
                                    {statusButton.label}
                                </button>

                                {/* Edit */}
                                <button
                                    onClick={() => navigate(`/host/jams/${jam.id}/edit`)}
                                    className="btn btn-sm btn-primary gap-2"
                                >
                                    <Pencil className="size-4" />
                                    {t('jam_management.overview.edit_jam')}
                                </button>

                                {/* View Public */}
                                <button
                                    onClick={() => navigate(getJamPath(jam))}
                                    className="btn btn-sm btn-secondary gap-2"
                                >
                                    <Eye className="size-4" />
                                    {t('jam_management.overview.view_public')}
                                </button>
                            </div>

                            {/* Spotify Actions - With text */}
                            <div className="flex flex-wrap gap-2 sm:ml-auto">
                                <button
                                    onClick={() => { void initiateSpotifyAuth(jam.id) }}
                                    className="btn btn-sm btn-accent gap-2"
                                >
                                    <Upload className="size-4" />
                                    {t('spotify.export_button')}
                                </button>
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="btn btn-sm btn-info gap-2"
                                >
                                    <Download className="size-4" />
                                    {t('spotify.import_button')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="stats shadow bg-base-200">
                        <div className="stat py-3">
                            <div className="stat-title text-sm">{t('jam_management.overview.stats.performances')}</div>
                            <div className="stat-value text-success text-2xl">{performanceCount}</div>
                        </div>
                    </div>
                    <div className="stats shadow bg-base-200">
                        <div className="stat py-3">
                            <div className="stat-title text-sm">{t('jam_management.overview.stats.registrations')}</div>
                            <div className="stat-value text-accent text-2xl">{registrationCount}</div>
                        </div>
                    </div>
                    <div className="stats shadow bg-base-200">
                        <div className="stat py-3">
                            <div className="stat-title text-sm">{t('jam_management.overview.stats.musicians')}</div>
                            <div className="stat-value text-secondary text-2xl">{musicianCount}</div>
                        </div>
                    </div>
                </div>

                {/* Jam Info Card */}
                <div className="card bg-base-200 shadow-sm">
                    <div className="card-body p-3 sm:p-4">
                        <h2 className="font-bold text-lg mb-3">{t('common.details')}</h2>
                        
                        <div className="space-y-3">
                            {/* Description - only if exists */}
                            {hasDescription && (
                                <div>
                                    <p className="text-sm text-base-content/60">{t('common.description')}</p>
                                    <p className="text-base">{jam.description}</p>
                                </div>
                            )}
                            
                            {/* Date & Host Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <p className="text-sm text-base-content/60">{t('common.date')}</p>
                                    <p className="text-base font-medium">
                                        {hasDate 
                                            ? new Date(jam.date!).toLocaleDateString() 
                                            : <span className="text-base-content/50">{t('jam_management.overview.date_not_set')}</span>
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/60">{t('common.host')}</p>
                                    <p className="text-base font-medium">{jam.hostName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Public Dashboard Link */}
                <a
                    href={getJamDashboardPath(jam)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline w-full gap-2"
                >
                    <ExternalLink className="size-4" />
                    {t('jam_management.view_public_dashboard')}
                </a>
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
