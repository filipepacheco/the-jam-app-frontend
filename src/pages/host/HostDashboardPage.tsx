/**
 * Host Dashboard Page
 * Overview of all jams created by the current host
 * Route: /host/dashboard
 */

import {useCallback, useEffect, useMemo, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuth, usePageAlerts} from '../../hooks'
import * as jamService from '../../services/jamService.ts'
import type {JamResponseDto} from '../../types/api.types.ts'
import {Alert, JamCardSkeleton, PageAlerts, SpotifyImportModal} from '../../components'
import {useTranslation} from 'react-i18next'
import {safeT} from '../../lib/i18nUtils.ts'
import {getJamStatusBadgeClass, getJamStatusLabel} from '../../lib/statusUtils'
import {getJamPath} from '../../utils/jamUrl'
import {EllipsisVertical} from 'lucide-react'

interface JamCategory {
    planned: JamResponseDto[]
    inProgress: JamResponseDto[]
    past: JamResponseDto[]
}

export function HostDashboardPage() {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const {isAuthenticated, isLoading: authLoading} = useAuth()
    const [jams, setJams] = useState<JamResponseDto[]>([])
    const [loading, setLoading] = useState(false)
    const {error, setError, clearError, success, setSuccess, clearSuccess} = usePageAlerts()
    const [showImportModal, setShowImportModal] = useState(false)

    const loadJams = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            setJams(await jamService.findAll())
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('jam_management.host_dashboard.failed_to_load')
            console.error('❌ Error loading jams:', err)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [t])

    // Load jams once auth is ready
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            void loadJams()
        }
    }, [authLoading, isAuthenticated, loadJams])

    const categories = useMemo((): JamCategory => {
        const categorized: JamCategory = {
            planned: [], inProgress: [], past: [],
        }

        jams.forEach((jam) => {
            if (jam.status === 'FINISHED') {
                categorized.past.push(jam)
            } else if (jam.status === 'ACTIVE' || jam.status === 'LIVE') {
                categorized.inProgress.push(jam)
            } else {
                categorized.planned.push(jam)
            }
        })

        return categorized
    }, [jams])

    const stats = useMemo(() => {
        const totalJams = jams.length
        const totalRegistrations = jams.reduce((sum, jam) => {
            return sum + (jam._count?.registrations ?? 0)
        }, 0)
        const totalSongs = jams.reduce((sum, jam) => sum + (jam._count?.schedules ?? jam.schedules?.length ?? 0), 0)

        return {totalJams, totalRegistrations, totalSongs}
    }, [jams])

    const handleDeleteJam = async (jamId: string) => {
        if (!confirm(t('jam_management.host_dashboard.confirm_delete'))) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            await jamService.deleteFn(jamId)
            setSuccess(t('jam_management.host_dashboard.delete_success'))
            await loadJams()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('jam_management.host_dashboard.delete_failed'))
        } finally {
            setLoading(false)
        }
    }

    // Show skeleton while auth is initializing
    if (authLoading) {
        return (
            <div className="min-h-screen bg-base-100 px-2 sm:px-4 py-4 sm:py-8 animate-pulse">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex items-center justify-between mb-3 sm:mb-6">
                        <div className="skeleton h-7 sm:h-9 w-48 rounded" />
                        <div className="skeleton h-8 w-24 rounded hidden sm:block" />
                    </div>
                    <div className="stats stats-horizontal w-full bg-base-200 shadow-sm mb-3 sm:mb-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="stat place-items-center py-2 px-3">
                                <div className="skeleton h-3 w-16 rounded mb-1" />
                                <div className="skeleton h-6 w-8 rounded" />
                            </div>
                        ))}
                    </div>
                    <div className="skeleton h-6 w-32 rounded mb-3" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {[...Array(3)].map((_, i) => <JamCardSkeleton key={i} />)}
                    </div>
                </div>
            </div>
        )
    }

    // Redirect unauthenticated users
    if (!isAuthenticated) {
        navigate('/login')
        return null
    }

    return (<div className="min-h-screen bg-base-100 px-2 sm:px-4 py-4 sm:py-8">
        <div className="container mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-3 sm:mb-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <h1 className="text-lg sm:text-2xl font-bold">{t('jam_management.host_dashboard.title')}</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/host/feedback')}
                            className="btn btn-ghost btn-sm hidden sm:inline-flex"
                            disabled={loading}
                        >
                            {t('feedback_page.title')}
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="btn btn-outline btn-sm hidden sm:inline-flex"
                            disabled={loading}
                        >
                            {t('spotify.import_button')}
                        </button>
                        {/* Mobile overflow for secondary actions */}
                        <div className="dropdown dropdown-end sm:hidden">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square">
                                <EllipsisVertical className="size-4" />
                            </div>
                            <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box w-52 p-2 shadow-lg z-10">
                                <li><button onClick={() => navigate('/host/feedback')}>{t('feedback_page.title')}</button></li>
                                <li><button onClick={() => setShowImportModal(true)}>{t('spotify.import_button')}</button></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                <PageAlerts error={error} success={success} onDismissError={clearError} onDismissSuccess={clearSuccess} />
            </div>

            {/* Stats - Single horizontal bar */}
            <div className="stats stats-horizontal w-full bg-base-200 shadow-sm mb-3 sm:mb-6">
                <div className="stat place-items-center py-2 px-3">
                    <div className="stat-title text-xs">{t('jam_management.host_dashboard.stats.total_jams')}</div>
                    <div className="stat-value text-lg">{stats.totalJams}</div>
                </div>
                <div className="stat place-items-center py-2 px-3">
                    <div className="stat-title text-xs">{t('jam_management.host_dashboard.stats.registrations')}</div>
                    <div className="stat-value text-lg">{stats.totalRegistrations}</div>
                </div>
                <div className="stat place-items-center py-2 px-3">
                    <div className="stat-title text-xs">{t('jam_management.host_dashboard.stats.songs')}</div>
                    <div className="stat-value text-lg">{stats.totalSongs}</div>
                </div>
            </div>

            {loading && jams.length === 0 ? (
                <div className="animate-pulse">
                    <div className="skeleton h-6 w-40 rounded mb-3" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {[...Array(3)].map((_, i) => <JamCardSkeleton key={i} />)}
                    </div>
                </div>
            ) : jams.length === 0 ? (
                <Alert type="info" message={t('jam_management.host_dashboard.no_jams_desc')} className="mb-6 sm:mb-8" />
            ) : (<>
                {/* In Progress Jams */}
                {categories.inProgress.length > 0 && (<div className="mb-3 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t('jam_management.host_dashboard.categories.in_progress')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {categories.inProgress.map((jam) => (<JamCard
                            key={jam.id}
                            jam={jam}
                            onDelete={handleDeleteJam}
                            onNavigate={navigate}
                            loading={loading}
                        />))}
                    </div>
                </div>)}

                {/* Planned Jams */}
                {categories.planned.length > 0 && (<div className="mb-3 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t('jam_management.host_dashboard.categories.planned')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {categories.planned.map((jam) => (<JamCard
                            key={jam.id}
                            jam={jam}
                            onDelete={handleDeleteJam}
                            onNavigate={navigate}
                            loading={loading}
                        />))}
                    </div>
                </div>)}

                {/* Past Jams */}
                {categories.past.length > 0 && (<div className="mb-3 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t('jam_management.host_dashboard.categories.past')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {categories.past.map((jam) => (<JamCard
                            key={jam.id}
                            jam={jam}
                            onDelete={handleDeleteJam}
                            onNavigate={navigate}
                            loading={loading}
                        />))}
                    </div>
                </div>)}
            </>)}
        </div>

        <SpotifyImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onSuccess={(jamId) => {
                setShowImportModal(false)
                navigate(`/host/jams/${jamId}/manage`)
            }}
        />
    </div>)
}

/**
 * Jam Card Component for Dashboard
 */
interface JamCardProps {
    jam: JamResponseDto
    onDelete: (jamId: string) => void
    onNavigate: (path: string) => void
    loading: boolean
}

function JamCard({jam, onDelete, onNavigate}: JamCardProps) {
    const {t} = useTranslation()

    const registrationCount = jam._count?.registrations ?? 0
    const songCount = jam._count?.schedules ?? jam.schedules?.length ?? 0

    return (<div
        className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onNavigate(`/host/jams/${jam.id}/manage`)}
    >
        <div className="card-body p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="font-bold text-base truncate">{jam.name}</h3>
                    <div className="text-xs text-base-content/60 mt-0.5">
                        {jam.date && <span>{new Date(jam.date).toLocaleDateString('pt-BR')} · </span>}
                        <span>{songCount} {safeT(t, 'jam_management.host_dashboard.stats.songs').toLowerCase()} · {registrationCount} {safeT(t, 'jam_management.host_dashboard.stats.registrations').toLowerCase()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <div className={`badge badge-xs ${getJamStatusBadgeClass(jam.status)}`}>{getJamStatusLabel(jam.status, t)}</div>
                    <div className="dropdown dropdown-end" onClick={(e) => e.stopPropagation()}>
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square">
                            <EllipsisVertical className="size-4" />
                        </div>
                        <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box w-44 p-2 shadow-lg z-10">
                            <li><button onClick={() => onNavigate(getJamPath(jam))}>{t('jam_management.host_dashboard.view_public')}</button></li>
                            <li><button onClick={() => onDelete(jam.id)} className="text-error">{t('jam_management.host_dashboard.delete_btn')}</button></li>
                        </ul>
                    </div>
                </div>
            </div>
            {jam.description && <p className="text-xs text-base-content/50 truncate mt-1">{jam.description}</p>}
        </div>
    </div>)
}

export default HostDashboardPage
