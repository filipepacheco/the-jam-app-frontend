/**
 * Jam Management Hub Page
 * Central control center for managing all aspects of a jam session
 * Route: /host/jams/:id/manage
 */

import {useCallback, useEffect, useState} from 'react'
import {useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom'
import useSWR from 'swr'
import {SWR_DEFAULTS} from '../../config/swrDefaults'
import {useAuth, usePageAlerts} from '../../hooks'
import * as jamService from '../../services/jamService.ts'
import type {JamResponseDto} from '../../types/api.types.ts'
import {Alert, PageAlerts} from '../../components'
import {SpotifyExportModal} from '../../components'
import {LiveJamControlPanel} from '../../components/schedule'
import {useTranslation} from 'react-i18next'
import {getJamStatusBadgeClass, getJamStatusLabel} from '../../lib/statusUtils'
import {DJControlTab} from "../tabs/DJControlTab.tsx";
import {DJControlTabV2} from "../tabs/DJControlTabV2.tsx";
import {AnalyticsTab} from "../tabs/AnalyticsTab.tsx";
import {DashboardTab} from "../tabs/DashboardTab.tsx";
import {ScheduleTab} from "../tabs/ScheduleTab.tsx";
import {RegistrationsTab} from "../tabs/RegistrationsTab.tsx";
import {OverviewTab} from "../tabs/OverviewTab.tsx";

type TabType = 'overview' | 'registrations' | 'schedule' | 'dashboard' | 'analytics' | 'live' | 'dj-control'

// SWR fetcher for jam data
const jamFetcher = async (id: string): Promise<JamResponseDto> => {
    const result = await jamService.findOne(id)
    return result.data
}

export function JamManagementPage() {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const {id: jamId} = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const {isAuthenticated, isLoading: authLoading} = useAuth()

    // Check for legacy DJ control flag in URL: ?useLegacyDJ=true
    const useLegacyDJ = searchParams.get('useLegacyDJ') === 'true'

    const [activeTab, setActiveTab] = useState<TabType>('overview')
    const {error, setError, clearError, success, setSuccess, clearSuccess} = usePageAlerts()
    const [spotifyAccessToken, setSpotifyAccessToken] = useState<string | null>(null)
    const [showExportModal, setShowExportModal] = useState(false)

    // Use SWR for jam data fetching
    // Note: revalidateOnFocus is false - only schedule tab needs fresh data on focus
    // Performance tabs (dj-control, live) use useJamControl with live state polling
    const {
        data: jam, error: swrError, isLoading: jamLoading, mutate: refreshJam,
    } = useSWR<JamResponseDto>(jamId ? `jam-${jamId}` : null, () => jamFetcher(jamId!), {
        ...SWR_DEFAULTS,
        revalidateOnFocus: false,
    })

    // Surface SWR errors to page alerts
    const swrErrorMessage = swrError
        ? (swrError instanceof Error ? swrError.message : t('jam_management.error_loading'))
        : null
    const displayError = swrErrorMessage || error

    // Auto-switch to DJ Control when jam goes LIVE
    useEffect(() => {
        if (jam?.status === 'LIVE' && activeTab === 'overview') {
            setActiveTab('dj-control')
        }
    }, [jam?.status, activeTab])

    // Detect Spotify access token from redirect state
    useEffect(() => {
        const state = location.state as { spotifyAccessToken?: string } | null
        if (state?.spotifyAccessToken) {
            setSpotifyAccessToken(state.spotifyAccessToken)
            setShowExportModal(true)
            // Clear the state to prevent re-opening on navigation
            navigate(location.pathname, {replace: true, state: {}})
        }
    }, [location.state, location.pathname, navigate])

    // Trigger refresh only for schedule tab which uses getJam data
    // DJ Control and Live tabs use useJamControl with live state (independent polling)
    const handleTabChange = useCallback((tabId: TabType) => {
        setActiveTab(tabId)

        // Only schedule tab needs getJam refresh - it displays schedules from jam data
        // dj-control and live tabs use useJamControl hook with getLiveState endpoint
        if (tabId === 'schedule' && jamId) {
            void refreshJam()
        }
    }, [refreshJam, jamId])

    useEffect(() => {
        if (authLoading) {
            return
        }

        if (!isAuthenticated) {
            navigate('/login')
            return
        }
    }, [jamId, isAuthenticated, authLoading, navigate])

    const handleStatusChange = async (newStatus: 'ACTIVE' | 'INACTIVE' | 'LIVE' | 'FINISHED') => {
        if (!jamId || !jam) return

        const confirmMessage = newStatus === 'LIVE' ? t('jam_management.overview.confirm_start') : newStatus === 'FINISHED' ? t('jam_management.overview.confirm_end') : t('jam_management.overview.confirm_status_change')

        if (!confirm(confirmMessage)) {
            return
        }

        setError(null)

        try {
            await jamService.update(jamId, {status: newStatus})
            setSuccess(t('jam_management.overview.status_updated', {status: newStatus}))
            await refreshJam()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errors.failed_to_execute_action')
            console.error('❌ Error updating jam status:', err)
            setError(errorMessage)
        }
    }

    // Show skeleton while auth or jam data is loading
    if (authLoading || (jamLoading && !jam)) {
        return (
            <div className="min-h-screen bg-base-100 animate-pulse">
                {/* Header skeleton */}
                <div className="bg-base-200 border-b border-base-300">
                    <div className="container mx-auto max-w-6xl px-2 sm:px-4 py-3 sm:py-4">
                        {/* Breadcrumb skeleton */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="skeleton h-3 w-20" />
                            <div className="skeleton h-3 w-3" />
                            <div className="skeleton h-3 w-32" />
                            <div className="skeleton h-3 w-3" />
                            <div className="skeleton h-3 w-16" />
                        </div>
                        {/* Title and status skeleton */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="skeleton h-8 w-64" />
                            <div className="skeleton h-6 w-20 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Tab bar skeleton */}
                <div className="border-b border-base-300 bg-base-200">
                    <div className="container mx-auto max-w-6xl px-2 sm:px-4">
                        <div className="flex gap-2 py-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="skeleton h-8 w-24 rounded" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content area skeleton */}
                <div className="container mx-auto max-w-6xl px-2 sm:px-4 py-4 sm:py-8">
                    <div className="card bg-base-200">
                        <div className="card-body space-y-4">
                            <div className="skeleton h-6 w-48" />
                            <div className="skeleton h-4 w-full" />
                            <div className="skeleton h-4 w-3/4" />
                            <div className="skeleton h-32 w-full rounded" />
                            <div className="flex gap-3">
                                <div className="skeleton h-10 w-28 rounded" />
                                <div className="skeleton h-10 w-28 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (displayError && !jam) {
        return (<div className="min-h-screen bg-base-100 px-2 sm:px-4 py-4 sm:py-8">
                <div className="container mx-auto max-w-6xl">
                    <Alert type="error" message={displayError} title={t('jam_management.error_loading')}/>
                    <button onClick={() => navigate('/host/dashboard')} className="btn btn-primary mt-4">
                        {t('jam_management.back_to_dashboard')}
                    </button>
                </div>
            </div>)
    }

    if (!jam) {
        return null
    }

    const tabs: { id: TabType; label: string; icon: string }[] = [{
        id: 'overview',
        label: t('jam_management.tabs.overview'),
        icon: '📊'
    }, {id: 'schedule', label: t('jam_management.tabs.schedule'), icon: '📋'}, {
        id: 'dj-control' as const,
        label: t('dj_control.title'),
        icon: '🎛️'
    }, {
        id: 'live' as const,
        label: t('jam_management.tabs.live_control_short', 'Ordem'),
        icon: '🎙️'
    }]

    return (<div className="min-h-screen bg-base-100">
            {/* Header */}
            <div className="bg-base-200 border-b border-base-300">
                <div className="container mx-auto max-w-6xl px-2 sm:px-4 py-3 sm:py-4">
                    {/* Breadcrumb */}
                    <div className="text-xs sm:text-sm breadcrumbs mb-2">
                        <ul>
                            <li>
                                <button onClick={() => navigate('/host/dashboard')} className="link link-hover">
                                    {t('nav.dashboard')}
                                </button>
                            </li>
                            <li className="truncate">{jam.name}</li>
                            <li>{t('jam_management.manage_title')}</li>
                        </ul>
                    </div>

                    {/* Title and Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">🎭 {jam.name}</h1>
                        <div
                            className={`badge badge-sm sm:badge-md lg:badge-lg ${getJamStatusBadgeClass(jam.status)}`}>{getJamStatusLabel(jam.status, t)}</div>
                    </div>
                </div>
            </div>


            {/* Tab Navigation */}
            <div className="border-b border-base-300 bg-base-200">
                <div className="container mx-auto max-w-6xl px-2 sm:px-4">
                    <div className="flex gap-1 sm:gap-2 py-2 overflow-x-auto" role="tablist" aria-label={t('jam_management.manage_title')}>
                        {tabs.map((tab) => (<button
                                key={tab.id}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                aria-controls={`tabpanel-${tab.id}`}
                                id={`tab-${tab.id}`}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    btn btn-sm whitespace-nowrap shrink-0 gap-2
                                    ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}
                                `}
                            >
                                <span aria-hidden="true">{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>))}
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <PageAlerts error={displayError} success={success} onDismissError={clearError} onDismissSuccess={clearSuccess} className="container sticky top-0 z-50 mx-auto max-w-6xl px-2 sm:px-4 mt-3 sm:mt-4" />

            {/* Tab Content */}
            <div className="container mx-auto max-w-6xl px-2 sm:px-4 py-4 sm:py-8" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                {activeTab === 'overview' && (
                    <OverviewTab jam={jam} onStatusChange={handleStatusChange} loading={jamLoading}/>)}
                {activeTab === 'registrations' && (<RegistrationsTab jam={jam}/>)}
                {activeTab === 'schedule' && (<ScheduleTab jam={jam} onReload={() => refreshJam()}/>)}
                {activeTab === 'dj-control' && (useLegacyDJ ? (
                        <DJControlTab jam={jam} onReload={() => refreshJam()}/>) : (
                        <DJControlTabV2 jamId={jamId!} onReload={() => refreshJam()}/>))}
                {activeTab === 'live' && (<LiveJamControlPanel
                        jamId={jamId!}
                        onActionSuccess={(msg) => setSuccess(msg)}
                        onActionError={(err) => setError(err)}
                    />)}
                {activeTab === 'dashboard' && <DashboardTab jam={jam}/>}
                {activeTab === 'analytics' && <AnalyticsTab jam={jam}/>}
            </div>

            {spotifyAccessToken && (<SpotifyExportModal
                    isOpen={showExportModal}
                    onClose={() => {
                        setShowExportModal(false)
                        setSpotifyAccessToken(null)
                    }}
                    jamId={jamId!}
                    jamName={jam.name}
                    spotifyAccessToken={spotifyAccessToken}
                />)}
        </div>)
}


export default JamManagementPage
