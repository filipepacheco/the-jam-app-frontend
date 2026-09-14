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
import {
    Action,
    EmptyState,
    ErrorState,
    IconAction,
    JamCardSkeleton,
    Status,
    SpotifyImportModal,
} from '../../components'
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

export interface HostDashboardPort {
    list(): Promise<readonly JamResponseDto[]>
    remove(jamId: string): Promise<void>
}

const hostDashboardPort: HostDashboardPort = {
    async list() {
        const result = await jamService.findAll()
        return result.data || []
    },
    async remove(jamId) {
        await jamService.deleteFn(jamId)
    },
}

interface HostDashboardPageProps {
    port?: HostDashboardPort
    confirmDelete?: (message: string) => boolean
}

interface JamMutationFeedback {
    jam: JamResponseDto
    message: string
    tone: 'success' | 'error'
}

function getJamCategory(jam: JamResponseDto): keyof JamCategory {
    if (jam.status === 'FINISHED') return 'past'
    if (jam.status === 'ACTIVE' || jam.status === 'LIVE') return 'inProgress'
    return 'planned'
}

export function HostDashboardPage({
    port = hostDashboardPort,
    confirmDelete = (message) => window.confirm(message),
}: HostDashboardPageProps = {}) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const {isAuthenticated, isLoading: authLoading} = useAuth()
    const [jams, setJams] = useState<JamResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingJamId, setDeletingJamId] = useState<string | null>(null)
    const [jamMutationFeedback, setJamMutationFeedback] = useState<JamMutationFeedback | null>(null)
    const {error, setError} = usePageAlerts()
    const [showImportModal, setShowImportModal] = useState(false)

    const loadJams = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            setJams([...await port.list()])
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('jam_management.host_dashboard.failed_to_load')
            console.error('❌ Error loading jams:', err)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [port, setError, t])

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

        jams.forEach((jam) => categorized[getJamCategory(jam)].push(jam))

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
        const jam = jams.find((candidate) => candidate.id === jamId)
        if (!jam || !confirmDelete(t('jam_management.host_dashboard.confirm_delete'))) {
            return
        }

        setDeletingJamId(jamId)
        setJamMutationFeedback(null)
        setError(null)

        try {
            await port.remove(jamId)
            setJams((current) => current.filter((candidate) => candidate.id !== jamId))
            setJamMutationFeedback({
                jam,
                message: t('jam_management.host_dashboard.delete_success'),
                tone: 'success',
            })

            try {
                setJams([...await port.list()])
            } catch (err) {
                setError(err instanceof Error ? err.message : t('jam_management.host_dashboard.failed_to_load'))
            }
        } catch (err) {
            setJamMutationFeedback({
                jam,
                message: err instanceof Error ? err.message : t('jam_management.host_dashboard.delete_failed'),
                tone: 'error',
            })
        } finally {
            setDeletingJamId(null)
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
                        <Action
                            onClick={() => navigate('/host/create-jam')}
                            className="shrink-0"
                            state={loading ? 'disabled' : 'idle'}
                        >
                            {t('jam_management.host_dashboard.create_jam_btn')}
                        </Action>
                        {/* Mobile overflow actions */}
                        <div className="dropdown dropdown-end sm:hidden">
                            <div
                                tabIndex={0}
                                role="button"
                                aria-label={t('jam_management.host_dashboard.more_actions')}
                                className="btn btn-ghost btn-sm btn-square"
                            >
                                <EllipsisVertical className="size-4" aria-hidden="true" />
                            </div>
                            <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box w-52 p-2 shadow-lg z-10">
                                <li><button onClick={() => navigate('/host/feedback')}>{t('feedback_page.title')}</button></li>
                                <li><button onClick={() => setShowImportModal(true)}>{t('spotify.import_button')}</button></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {error && jams.length > 0 && <ErrorState
                    title={t('jam_management.host_dashboard.failed_to_load')}
                    description={error === t('jam_management.host_dashboard.failed_to_load') ? undefined : error}
                    action={{label: t('common.try_again'), onClick: () => void loadJams()}}
                    className="mb-3"
                />}
            </div>

            {loading && jams.length === 0 ? (
                <div className="animate-pulse" role="status" aria-live="polite" aria-label={t('jam_management.host_dashboard.loading_jams')}>
                    <span className="sr-only">{t('jam_management.host_dashboard.loading_jams')}</span>
                    <div className="skeleton h-6 w-40 rounded mb-3" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {[...Array(3)].map((_, i) => <JamCardSkeleton key={i} />)}
                    </div>
                </div>
            ) : error && jams.length === 0 ? (
                <ErrorState
                    title={t('jam_management.host_dashboard.failed_to_load')}
                    description={error === t('jam_management.host_dashboard.failed_to_load') ? undefined : error}
                    action={{label: t('common.try_again'), onClick: () => void loadJams()}}
                />
            ) : jams.length === 0 && jamMutationFeedback?.tone !== 'success' ? (
                <EmptyState
                    kind="first-use"
                    title={t('jam_management.host_dashboard.no_jams_title')}
                    description={t('jam_management.host_dashboard.no_jams_desc')}
                    action={{
                        label: t('jam_management.host_dashboard.create_jam_btn'),
                        onClick: () => navigate('/host/create-jam'),
                    }}
                    className="mb-6 sm:mb-8"
                />
            ) : (<>
                <HostJamCategory
                    category="inProgress"
                    jams={categories.inProgress}
                    title={t('jam_management.host_dashboard.categories.in_progress')}
                    deletingJamId={deletingJamId}
                    mutationFeedback={jamMutationFeedback}
                    onDelete={handleDeleteJam}
                    onNavigate={navigate}
                />

                {/* Portfolio totals follow operational work instead of leading it. */}
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

                <HostJamCategory
                    category="planned"
                    jams={categories.planned}
                    title={t('jam_management.host_dashboard.categories.planned')}
                    deletingJamId={deletingJamId}
                    mutationFeedback={jamMutationFeedback}
                    onDelete={handleDeleteJam}
                    onNavigate={navigate}
                />

                <HostJamCategory
                    category="past"
                    jams={categories.past}
                    title={t('jam_management.host_dashboard.categories.past')}
                    deletingJamId={deletingJamId}
                    mutationFeedback={jamMutationFeedback}
                    onDelete={handleDeleteJam}
                    onNavigate={navigate}
                />
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
 * Compact Jam summary for the host dashboard.
 */
interface HostJamSummaryCardProps {
    jam: JamResponseDto
    onDelete: (jamId: string) => void
    onNavigate: (path: string) => void
    deleting: boolean
    mutationFeedback: JamMutationFeedback | null
}

interface HostJamCategoryProps {
    category: keyof JamCategory
    jams: JamResponseDto[]
    title: string
    deletingJamId: string | null
    mutationFeedback: JamMutationFeedback | null
    onDelete: (jamId: string) => void
    onNavigate: (path: string) => void
}

function HostJamCategory({
    category,
    jams,
    title,
    deletingJamId,
    mutationFeedback,
    onDelete,
    onNavigate,
}: HostJamCategoryProps) {
    const successForCategory = mutationFeedback?.tone === 'success' && getJamCategory(mutationFeedback.jam) === category

    if (jams.length === 0 && !successForCategory) return null

    return (<section className="mb-3 sm:mb-6" aria-labelledby={`host-jams-${category}`}>
        <h2 id={`host-jams-${category}`} className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {jams.map((jam) => (<HostJamSummaryCard
                key={jam.id}
                jam={jam}
                onDelete={onDelete}
                onNavigate={onNavigate}
                deleting={deletingJamId === jam.id}
                mutationFeedback={mutationFeedback?.jam.id === jam.id ? mutationFeedback : null}
            />))}
            {successForCategory && <div className="rounded-box bg-base-200 p-3 sm:p-4">
                <Status
                    tone="success"
                    title={mutationFeedback.message}
                    description={mutationFeedback.jam.name}
                />
            </div>}
        </div>
    </section>)
}

function HostJamSummaryCard({jam, onDelete, onNavigate, deleting, mutationFeedback}: HostJamSummaryCardProps) {
    const {t} = useTranslation()

    const registrationCount = jam._count?.registrations ?? 0
    const songCount = jam._count?.schedules ?? jam.schedules?.length ?? 0

    return (<article className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
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
                    <div className="dropdown dropdown-end">
                        <IconAction
                            label={t('jam_management.host_dashboard.more_actions')}
                            variant="quiet"
                            className="btn-sm"
                        >
                            <EllipsisVertical className="size-4" aria-hidden="true" />
                        </IconAction>
                        <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box w-44 p-2 shadow-lg z-10">
                            <li><button onClick={() => onNavigate(getJamPath(jam))}>{t('jam_management.host_dashboard.view_public')}</button></li>
                            <li>
                                {deleting ? <Action
                                    variant="destructive"
                                    state="loading"
                                    loadingLabel={t('jam_management.host_dashboard.delete_btn')}
                                    className="w-full justify-start"
                                >{t('jam_management.host_dashboard.delete_btn')}</Action> : <Action
                                    variant="destructive"
                                    onClick={() => onDelete(jam.id)}
                                    className="w-full justify-start"
                                >{t('jam_management.host_dashboard.delete_btn')}</Action>}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            {jam.description && <p className="text-xs text-base-content/50 truncate mt-1">{jam.description}</p>}
            <Action
                onClick={() => onNavigate(`/host/jams/${jam.id}/manage`)}
                state={deleting ? 'disabled' : 'idle'}
                className="mt-2 w-full"
            >
                {t('jam_management.host_dashboard.manage_btn')}
            </Action>
            {mutationFeedback?.tone === 'error' && <Status
                tone="error"
                role="alert"
                title={mutationFeedback.message}
                description={jam.name}
                className="mt-2"
            />}
        </div>
    </article>)
}

export default HostDashboardPage
