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
    JamCardSkeleton,
    OverflowMenu,
    type NavigationMenuItem,
} from '../../components'
import {useTranslation} from 'react-i18next'
import {safeT} from '../../lib/i18nUtils.ts'
import {getJamStatusBadgeClass, getJamStatusLabel} from '../../lib/statusUtils'
import {getJamPath} from '../../utils/jamUrl'
import {AlertCircle, CalendarClock, CheckCircle2, ExternalLink, MapPin, Music2, Trash2, Users} from 'lucide-react'

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
                    <h1 className="text-2xl sm:text-3xl font-bold text-balance">{t('jam_management.host_dashboard.title')}</h1>
                    <div className="flex items-center">
                        <Action
                            onClick={() => navigate('/host/create-jam')}
                            className="shrink-0"
                            state={loading ? 'disabled' : 'idle'}
                        >
                            {t('jam_management.host_dashboard.create_jam_btn')}
                        </Action>
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

    </div>)
}

/**
 * Compact Jam summary for the host dashboard.
 */
interface HostJamSummaryCardProps {
    jam: JamResponseDto
    category: keyof JamCategory
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
        <h2 id={`host-jams-${category}`} className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">{title}</h2>
        {successForCategory && <p
            className="mb-3 flex items-center gap-2 text-sm text-success"
            role="status"
        >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            <span>{mutationFeedback.message}: <strong>{mutationFeedback.jam.name}</strong></span>
        </p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {jams.map((jam) => (<HostJamSummaryCard
                key={jam.id}
                jam={jam}
                category={category}
                onDelete={onDelete}
                onNavigate={onNavigate}
                deleting={deletingJamId === jam.id}
                mutationFeedback={mutationFeedback?.jam.id === jam.id ? mutationFeedback : null}
            />))}
        </div>
    </section>)
}

function HostJamSummaryCard({jam, category, onDelete, onNavigate, deleting, mutationFeedback}: HostJamSummaryCardProps) {
    const {t, i18n} = useTranslation()

    const registrationCount = jam._count?.registrations ?? 0
    const songCount = jam._count?.schedules ?? jam.schedules?.length ?? 0
    const formattedDate = jam.date && !Number.isNaN(new Date(jam.date).getTime())
        ? new Intl.DateTimeFormat(i18n.language, {dateStyle: 'medium', timeStyle: 'short'}).format(new Date(jam.date))
        : null
    const menuItems: NavigationMenuItem[] = [
        {
            id: 'public-page',
            label: t('jam_management.host_dashboard.view_public'),
            icon: <ExternalLink className="size-4" />,
            disabled: deleting,
            onSelect: () => onNavigate(getJamPath(jam)),
        },
        {
            id: 'delete',
            label: t('jam_management.host_dashboard.delete_btn'),
            icon: <Trash2 className="size-4" />,
            destructive: true,
            disabled: deleting,
            onSelect: () => onDelete(jam.id),
        },
    ]

    return (<article className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="card-body p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-pretty">{jam.name}</h3>
                    <div className="mt-2 grid gap-1 text-xs text-base-content/65">
                        <span className="inline-flex min-w-0 items-center gap-1.5 tabular-nums">
                            <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
                            <span>{formattedDate ?? t('jams.date_tba')}</span>
                        </span>
                        {jam.location && <span className="inline-flex min-w-0 items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate" title={jam.location}>{jam.location}</span>
                        </span>}
                        <span className="flex flex-wrap gap-x-3 gap-y-1">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <Music2 className="size-3.5 shrink-0" aria-hidden="true" />
                                {songCount} {safeT(t, 'jam_management.host_dashboard.stats.songs').toLowerCase()}
                            </span>
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <Users className="size-3.5 shrink-0" aria-hidden="true" />
                                {registrationCount} {safeT(t, 'jam_management.host_dashboard.stats.registrations').toLowerCase()}
                            </span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {category !== 'planned' && <div className={`badge badge-xs ${getJamStatusBadgeClass(jam.status)}`}>{getJamStatusLabel(jam.status, t)}</div>}
                    <OverflowMenu
                        label={t('jam_management.host_dashboard.more_actions')}
                        items={menuItems}
                    />
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
            {mutationFeedback?.tone === 'error' && <p className="mt-2 flex items-start gap-2 text-sm text-error" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{mutationFeedback.message}</span>
            </p>}
        </div>
    </article>)
}

export default HostDashboardPage
