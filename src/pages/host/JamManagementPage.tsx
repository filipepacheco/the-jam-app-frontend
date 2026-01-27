/**
 * Jam Management Hub Page
 * Central control center for managing all aspects of a jam session
 * Route: /host/jams/:id/manage
 */

import {useEffect, useState, useCallback} from 'react'
import {useNavigate, useParams, useSearchParams, useLocation} from 'react-router-dom'
import {useAuth} from '../../hooks'
import * as jamService from '../../services/jamService.ts'
import type {JamResponseDto} from '../../types/api.types.ts'
import {ErrorAlert, SuccessAlert} from '../../components'
import {SpotifyExportModal} from '../../components/SpotifyExportModal'
import {LiveJamControlPanel} from '../../components/schedule'
import {useTranslation} from 'react-i18next'
import {ExternalLink} from 'lucide-react'
import {DJControlTab} from "../tabs/DJControlTab.tsx";
import {DJControlTabV2} from "../tabs/DJControlTabV2.tsx";
import {AnalyticsTab} from "../tabs/AnalyticsTab.tsx";
import {DashboardTab} from "../tabs/DashboardTab.tsx";
import {ScheduleTab} from "../tabs/ScheduleTab.tsx";
import {RegistrationsTab} from "../tabs/RegistrationsTab.tsx";
import {OverviewTab} from "../tabs/OverviewTab.tsx";

type TabType = 'overview' | 'registrations' | 'schedule' | 'dashboard' | 'analytics' | 'live' | 'dj-control'

export function JamManagementPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const {id: jamId} = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const {isAuthenticated, isLoading: authLoading} = useAuth()

    // Check for legacy DJ control flag in URL: ?useLegacyDJ=true
    const useLegacyDJ = searchParams.get('useLegacyDJ') === 'true'

    const [activeTab, setActiveTab] = useState<TabType>('overview')
    const [jam, setJam] = useState<JamResponseDto | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [spotifyAccessToken, setSpotifyAccessToken] = useState<string | null>(null)
    const [showExportModal, setShowExportModal] = useState(false)

    // Detect Spotify access token from redirect state
    useEffect(() => {
        const state = location.state as { spotifyAccessToken?: string } | null
        if (state?.spotifyAccessToken) {
            setSpotifyAccessToken(state.spotifyAccessToken)
            setShowExportModal(true)
            // Clear the state to prevent re-opening on navigation
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location.state, location.pathname, navigate])

    const loadJamData = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)

        try {
            const result = await jamService.findOne(id)
            setJam(result.data)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('jam_management.error_loading')
            console.error('❌ Error loading jam:', err)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [t])

    useEffect(() => {
        if (authLoading) {
            return
        }

        if (!isAuthenticated) {
            navigate('/login')
            return
        }

        if (jamId) {
            void loadJamData(jamId)
        }
    }, [jamId, isAuthenticated, authLoading, navigate, loadJamData])

    const handleStatusChange = async (newStatus: 'ACTIVE' | 'INACTIVE' | 'FINISHED') => {
        if (!jamId || !jam) return

        const confirmMessage =
            newStatus === 'ACTIVE'
                ? t('jam_management.overview.confirm_start')
                : newStatus === 'FINISHED'
                    ? t('jam_management.overview.confirm_end')
                    : t('jam_management.overview.confirm_status_change')

        if (!confirm(confirmMessage)) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            await jamService.update(jamId, {status: newStatus})
            setSuccess(t('jam_management.overview.status_updated', { status: newStatus }))
            await loadJamData(jamId)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errors.failed_to_execute_action')
            console.error('❌ Error updating jam status:', err)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Show loading spinner while auth is initializing
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg"></span>
                    <span className="text-sm sm:text-base font-semibold text-base-content/70">{t('common.loading')}</span>
                </div>
            </div>
        )
    }

    if (loading && !jam) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg"></span>
                    <span className="text-sm sm:text-base font-semibold text-base-content/70">{t('jam_management.loading_jam')}</span>
                </div>
            </div>
        )
    }

    if (error && !jam) {
        return (
            <div className="min-h-screen bg-base-100 px-2 sm:px-4 py-4 sm:py-8">
                <div className="container mx-auto max-w-6xl">
                    <ErrorAlert message={error} title={t('jam_management.error_loading')}/>
                    <button onClick={() => navigate('/host/dashboard')} className="btn btn-primary mt-4">
                        {t('jam_management.back_to_dashboard')}
                    </button>
                </div>
            </div>
        )
    }

    if (!jam) {
        return null
    }

    const getStatusBadgeColor = () => {
        switch (jam.status) {
            case 'ACTIVE':
                return 'badge-success'
            case 'INACTIVE':
                return 'badge-warning'
            case 'FINISHED':
                return 'badge-error'
            default:
                return 'badge-outline'
        }
    }

    const tabs: { id: TabType; label: string; icon: string }[] = [
        {id: 'overview', label: t('jam_management.tabs.overview'), icon: '📊'},
        {id: 'schedule', label: t('jam_management.tabs.schedule'), icon: '📋'},
        {id: 'dj-control' as const, label: t('dj_control.title'), icon: '🎛️'},
        ...(jam?.status === 'ACTIVE' ? [{id: 'live' as const, label: t('jam_management.tabs.live_control'), icon: '🎙️'}] : []),
        // {id: 'dashboard', label: t('jam_management.tabs.dashboard'), icon: '📺'},
        // {id: 'analytics', label: t('jam_management.tabs.analytics'), icon: '📈'},
        // {id: 'registrations', label: t('jam_management.tabs.registrations'), icon: '👥'},
    ]


    return (
        <div className="min-h-screen bg-base-100">
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
                        <div className="flex items-center gap-2">
                            <a
                                href={`/jams/${jamId}/dashboard`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline gap-1"
                            >
                                <ExternalLink className="size-4" aria-hidden="true" />
                                {t('jam_management.view_public_dashboard')}
                            </a>
                            <div className={`badge badge-sm sm:badge-md lg:badge-lg ${getStatusBadgeColor()}`}>{jam.status}</div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Tab Navigation */}
            <div className="border-b border-base-300 bg-base-200">
                <div className="container mx-auto max-w-6xl px-2 sm:px-4">
                    <div className="tabs tabs-boxed bg-transparent gap-1 sm:gap-2 py-2 text-xs sm:text-sm overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab whitespace-nowrap ${activeTab === tab.id ? 'tab-active' : ''}`}
                            >
                                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <div className="container sticky top-0 z-50 mx-auto max-w-6xl px-2 sm:px-4 mt-3 sm:mt-4">
                {error && <ErrorAlert message={error} onDismiss={() => setError(null)}/>}
                {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)}/>}
            </div>

            {/* Tab Content */}
            <div className="container mx-auto max-w-6xl px-2 sm:px-4 py-4 sm:py-8">
                {activeTab === 'overview' && (
                    <OverviewTab jam={jam} onStatusChange={handleStatusChange} loading={loading}/>
                )}
                {activeTab === 'registrations' && (
                    <RegistrationsTab jam={jam}/>
                )}
                {activeTab === 'schedule' && (
                    <ScheduleTab jam={jam} onReload={() => loadJamData(jamId!)}/>
                )}
                {activeTab === 'dj-control' && (
                    useLegacyDJ ? (
                        <DJControlTab jam={jam} onReload={() => loadJamData(jamId!)}/>
                    ) : (
                        <DJControlTabV2 jamId={jamId!} onReload={() => loadJamData(jamId!)}/>
                    )
                )}
                {activeTab === 'live' && (
                    <LiveJamControlPanel
                        jam={jam}
                        onActionSuccess={(msg) => setSuccess(msg)}
                        onActionError={(err) => setError(err)}
                    />
                )}
                {activeTab === 'dashboard' && <DashboardTab jam={jam}/>}
                {activeTab === 'analytics' && <AnalyticsTab jam={jam}/>}
            </div>

            {spotifyAccessToken && (
                <SpotifyExportModal
                    isOpen={showExportModal}
                    onClose={() => {
                        setShowExportModal(false)
                        setSpotifyAccessToken(null)
                    }}
                    jamId={jamId!}
                    jamName={jam.name}
                    spotifyAccessToken={spotifyAccessToken}
                />
            )}
        </div>
    )
}


export default JamManagementPage
