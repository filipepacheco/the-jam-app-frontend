/**
 * Jam Management Hub Page
 * Central control center for managing all aspects of a jam session
 * Route: /host/jams/:id/manage
 */

import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useAuth} from '../hooks'
import {jamService, registrationService, scheduleService} from '../services'
import type {JamMusicResponseDto, JamResponseDto, ScheduleResponseDto} from '../types/api.types'
import {ErrorAlert, ScheduleCardManagement, SuccessAlert} from '../components'
import {HostMusicianRegistrationModal, LiveJamControlPanel} from '../components/schedule'
import {useTranslation} from 'react-i18next'

type TabType = 'overview' | 'registrations' | 'schedule' | 'dashboard' | 'analytics' | 'live'

export function JamManagementPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const {id: jamId} = useParams<{ id: string }>()
    const {isAuthenticated, isLoading: authLoading} = useAuth()

    const [activeTab, setActiveTab] = useState<TabType>('overview')
    const [jam, setJam] = useState<JamResponseDto | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) {
            return
        }

        if (!isAuthenticated) {
            navigate('/login')
            return
        }

        if (jamId) {
            loadJamData(jamId)
        }
    }, [jamId, isAuthenticated, authLoading, navigate])

    const loadJamData = async (id: string) => {
        setLoading(true)
        setError(null)

        try {
            console.log('🔍 Loading jam data for management hub...')
            const result = await jamService.findOne(id)
            console.log('✅ Jam data loaded:', result.data)
            setJam(result.data)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('jam_management.error_loading')
            console.error('❌ Error loading jam:', err)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

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
                        <div className={`badge badge-sm sm:badge-md lg:badge-lg ${getStatusBadgeColor()}`}>{jam.status}</div>
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


        </div>
    )
}

/**
 * Overview Tab Component
 */
function OverviewTab({
                         jam,
                         onStatusChange,
                         loading,
                     }: {
    jam: JamResponseDto
    onStatusChange: (status: 'ACTIVE' | 'INACTIVE' | 'FINISHED') => void
    loading: boolean
}) {
    const { t } = useTranslation()
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
                            <button onClick={() => navigate(`/jams/${jam.id}`)} className="btn btn-secondary btn-xs sm:btn-sm">
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
                        <div className="stat-title text-xs sm:text-sm">{t('jam_management.overview.stats.performances')}</div>
                        <div className="stat-value text-success text-xl sm:text-2xl lg:text-3xl">{jam.schedules?.length || 0}</div>
                    </div>
                </div>
                <div className="stats shadow bg-base-200 p-3 sm:p-6">
                    <div className="stat">
                        <div className="stat-title text-xs sm:text-sm">{t('jam_management.overview.stats.registrations')}</div>
                        <div className="stat-value text-accent text-xl sm:text-2xl lg:text-3xl">{jam.registrations?.length || 0}</div>
                    </div>
                </div>
                <div className="stats shadow bg-base-200 p-3 sm:p-6">
                    <div className="stat">
                        <div className="stat-title text-xs sm:text-sm">{t('jam_management.overview.stats.musicians')}</div>
                        <div className="stat-value text-secondary text-xl sm:text-2xl lg:text-3xl">{uniqueMusicians.size}</div>
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


/**
 * Registrations Tab Component
 */
function RegistrationsTab({jam}: { jam: JamResponseDto }) {
    const { t } = useTranslation()
    return (
        <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">👥 {t('jam_management.registrations.title')}</h2>

            {jam.registrations && jam.registrations.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                    {jam.registrations.map((registration) => (
                        <div key={registration.id} className="card bg-base-200 shadow">
                            <div className="card-body p-3 sm:p-4">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-sm sm:text-base">{registration.musician?.name}</h3>
                                        <p className="text-xs sm:text-sm text-base-content/70">
                                            {registration.musician?.instrument}
                                        </p>
                                    </div>
                                    <div className="badge badge-outline badge-xs sm:badge-sm">{registration.status}</div>
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

/**
 * Schedule Tab Component - Full management with nested registrations
 * Matches JamDetailPage view but with management controls
 */
function ScheduleTab({jam, onReload}: { jam: JamResponseDto; onReload: () => void }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedMusicId, setSelectedMusicId] = useState('')
    const [showHostRegistrationModal, setShowHostRegistrationModal] = useState(false)
    const [selectedScheduleForRegistration, setSelectedScheduleForRegistration] = useState<ScheduleResponseDto | null>(null)

    const sortedSchedules = [...(jam.schedules || [])].sort((a, b) => a.order - b.order)

    // Handle schedule status change
    const handleStatusChange = async (scheduleId: string, newStatus: string) => {
        const updatePayload: any = {status: newStatus}

        // If approving a suggested schedule, set order to last position
        if (newStatus === 'SCHEDULED') {
            const nonSuggestedSchedules = sortedSchedules.filter(s => s.status !== 'SUGGESTED')
            const maxOrder = nonSuggestedSchedules.length > 0
                ? Math.max(...nonSuggestedSchedules.map(s => s.order))
                : 0

            updatePayload.order = maxOrder + 1
        }

        setLoading(true)
        setError(null)
        try {
            await scheduleService.update(scheduleId, updatePayload as any)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
        } finally {
            setLoading(false)
        }
    }

    // Handle schedule deletion
    const handleDeleteSchedule = async (scheduleId: string) => {
        if (!confirm(t('jam_management.schedule.confirm_delete'))) return
        setLoading(true)
        setError(null)
        try {
            await scheduleService.remove(scheduleId)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_remove'))
        } finally {
            setLoading(false)
        }
    }

    // Handle move up
    const handleMoveUp = async (index: number) => {
        const nonSuggestedSchedules = sortedSchedules.filter(s => s.status !== 'SUGGESTED')
        if (index === 0) return
        const newOrder = nonSuggestedSchedules.map((s) => s.id)
        ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
        setLoading(true)
        try {
            await scheduleService.reorder(jam.id, newOrder)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
        } finally {
            setLoading(false)
        }
    }

    // Handle move down
    const handleMoveDown = async (index: number) => {
        const nonSuggestedSchedules = sortedSchedules.filter(s => s.status !== 'SUGGESTED')
        if (index === nonSuggestedSchedules.length - 1) return
        const newOrder = nonSuggestedSchedules.map((s) => s.id)
        ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
        setLoading(true)
        try {
            await scheduleService.reorder(jam.id, newOrder)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
        } finally {
            setLoading(false)
        }
    }

    // Handle add schedule
    const handleAddSchedule = async () => {
        if (!selectedMusicId) {
            setError(t('host_songs.select_song_error'))
            return
        }
        setLoading(true)
        setError(null)
        try {
            const nextOrder = sortedSchedules.length > 0
                ? Math.max(...sortedSchedules.map(s => s.order)) + 1
                : 1
            await scheduleService.create({
                jamId: jam.id,
                musicId: selectedMusicId,
                order: nextOrder,
                status: 'SCHEDULED',
            } as any )
            setShowAddModal(false)
            setSelectedMusicId('')
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
        } finally {
            setLoading(false)
        }
    }

    // Handle reject registration (delete)
    const handleRejectRegistration = async (registrationId: string) => {
        if (!confirm(t('jam_management.schedule.confirm_reject_reg'))) return
        setLoading(true)
        try {
            await registrationService.remove(registrationId)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
        } finally {
            setLoading(false)
        }
    }

    // Handle approve registration - update registration status to APPROVED
    const handleApproveRegistration = async (registrationId: string) => {
        if (!jam?.id) return

        setLoading(true)
        setError(null)

        try {
            console.log('✅ Approving registration:', registrationId)
            await registrationService.update(registrationId, { status: 'APPROVED' })
            onReload()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errors.failed_to_execute_action')
            console.error('❌ Error approving registration:', err)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleAddMusician = (schedule: ScheduleResponseDto) => {
        setSelectedScheduleForRegistration(schedule)
        setShowHostRegistrationModal(true)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <p className="text-3xl font-bold">📋 {t('jam_management.schedule.title')}</p>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {t('jam_management.schedule.add_new_song')}
                </button>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-error">
                    <p>{error}</p>
                    <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">✕</button>
                </div>
            )}

            {/* Schedule List */}
            {sortedSchedules.length > 0 ? (
                <div className="space-y-6">
                    {/* Non-Suggested Schedules */}
                    {(() => {
                        const nonSuggestedSchedules = sortedSchedules.filter(s => s.status !== 'SUGGESTED')
                        return nonSuggestedSchedules.length > 0 ? (
                            <div className="space-y-4">
                                {nonSuggestedSchedules.map((schedule, index) => (
                                    <ScheduleCardManagement
                                        key={schedule.id}
                                        schedule={schedule}
                                        index={index}
                                        loading={loading}
                                        isSuggested={false}
                                        onStatusChange={handleStatusChange}
                                        onDelete={handleDeleteSchedule}
                                        onMoveUp={handleMoveUp}
                                        onMoveDown={handleMoveDown}
                                        maxIndex={nonSuggestedSchedules.length - 1}
                                        onApproveRegistration={handleApproveRegistration}
                                        onRejectRegistration={handleRejectRegistration}
                                        onAddMusician={() => handleAddMusician(schedule)}
                                    />
                                ))}
                            </div>
                        ) : null
                    })()}

                    {/* Suggested Schedules */}
                    {(() => {
                        const suggestedSchedules = sortedSchedules.filter(s => s.status === 'SUGGESTED')
                        return suggestedSchedules.length > 0 ? (
                            <div className="space-y-4 mt-6 pt-6 border-t-2 border-info/30">
                                <h3 className="text-3xl font-semibold flex items-center gap-2">
                                    ✨ {t('jam_management.schedule.suggested_songs')}
                                </h3>
                                {suggestedSchedules.map((schedule) => (
                                    <ScheduleCardManagement
                                        key={schedule.id}
                                        schedule={schedule}
                                        loading={loading}
                                        isSuggested={true}
                                        onStatusChange={handleStatusChange}
                                        onDelete={handleDeleteSchedule}
                                        onApproveRegistration={handleApproveRegistration}
                                        onRejectRegistration={handleRejectRegistration}
                                        onAddMusician={() => handleAddMusician(schedule)}
                                    />
                                ))}
                            </div>
                        ) : null
                    })()}
                </div>
            ) : (
                <div className="card bg-base-200">
                    <div className="card-body text-center py-8">
                        <div className="text-4xl mb-3">📋</div>
                        <h3 className="font-semibold mb-2">{t('jam_management.schedule.no_schedule_yet')}</h3>
                        <p className="text-sm text-base-content/70">
                            {jam.jamMusics?.length
                                ? t('jam_management.schedule.add_entry_hint')
                                : t('jam_management.schedule.add_songs_first')}

                        </p>
                    </div>
                </div>
            )}

            {/* Host Musician Registration Modal */}
            {selectedScheduleForRegistration && (
                <HostMusicianRegistrationModal
                    schedule={selectedScheduleForRegistration}
                    isOpen={showHostRegistrationModal}
                    onClose={() => {
                        setShowHostRegistrationModal(false)
                        setSelectedScheduleForRegistration(null)
                    }}
                    onSuccess={() => {
                        setShowHostRegistrationModal(false)
                        setSelectedScheduleForRegistration(null)
                        onReload()
                    }}
                />
            )}

            {/* Add Schedule Modal */}
            {showAddModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">{t('jam_management.schedule.add_entry_modal')}</h3>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">{t('jam_management.schedule.song_label')}</span>
                            </label>
                            <select
                                value={selectedMusicId}
                                onChange={(e) => setSelectedMusicId(e.target.value)}
                                className="select select-bordered"
                            >
                                <option value="">{t('jam_management.schedule.select_song')}</option>
                                {jam.jamMusics?.map((jm: JamMusicResponseDto) => (
                                    <option key={jm.id} value={jm.music?.id || jm.musicId}>
                                        {jm.music?.title || t('common.unknown')} - {jm.music?.artist || t('common.unknown')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">{t('jam_management.schedule.order_label')}</span>
                            </label>
                            <input
                                type="text"
                                value={t('jam_management.schedule.order_auto', { count: sortedSchedules.length + 1 })}
                                className="input input-bordered"
                                disabled
                            />
                        </div>

                        {error && (
                            <div className="alert alert-error mb-4">
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="modal-action">
                            <button
                                onClick={() => {
                                    setShowAddModal(false)
                                    setError(null)
                                    setSelectedMusicId('')
                                }}
                                className="btn btn-ghost"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleAddSchedule}
                                className="btn btn-primary"
                                disabled={loading || !selectedMusicId}
                            >
                                {loading ?
                                    <span className="loading loading-spinner loading-sm"></span> : t('jam_management.schedule.add_to_schedule')}
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddModal(false)}></div>
                </div>
            )}
        </div>
    )
}

/**
 * Dashboard Tab Component
 */
function DashboardTab({jam}: { jam: JamResponseDto }) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">📺 {t('jam_management.dashboard.title')}</h2>
            <div className="alert alert-info">
                <p>{t('jam_management.dashboard.description')}</p>
            </div>
            <button
                onClick={() => navigate(`/jams/${jam.id}`)}
                className="btn btn-primary"
            >
                {t('jam_management.dashboard.open_btn')}
            </button>
        </div>
    )
}

/**
 * Analytics Tab Component
 */
function AnalyticsTab({jam}: { jam: JamResponseDto }) {
    const { t } = useTranslation()
    const uniqueMusicians = new Set<string>()
    jam.registrations?.forEach((reg) => uniqueMusicians.add(reg.musicianId))

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">📈 {t('jam_management.analytics.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">{t('jam_management.analytics.total_songs')}</h3>
                        <p className="text-3xl font-bold">{jam.jamMusics?.length || 0}</p>
                    </div>
                </div>
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">{t('jam_management.analytics.unique_musicians')}</h3>
                        <p className="text-3xl font-bold">{uniqueMusicians.size}</p>
                    </div>
                </div>
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">{t('jam_management.analytics.performances')}</h3>
                        <p className="text-3xl font-bold">{jam.schedules?.length || 0}</p>
                    </div>
                </div>
            </div>

            {jam.status === 'FINISHED' && (
                <div className="alert alert-success">
                    <p>✅ {t('jam_management.analytics.finished_message')}</p>
                </div>
            )}
        </div>
    )
}

export default JamManagementPage
