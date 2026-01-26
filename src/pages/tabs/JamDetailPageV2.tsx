/**
 * JamDetailPageV2
 * Waveform Pulse Timeline Design - Modern minimal with music-themed elements
 */

import {useNavigate, useParams} from 'react-router-dom'
import {useAuth} from '../../hooks'
import useSWR from 'swr'
import {useCallback, useMemo, useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'

// Constants
const SUCCESS_TOAST_DURATION = 3000
import {
    ErrorAlert,
    ScheduleEnrollmentModal,
} from '../../components'
import {
    CollapsibleSection,
    CollapsibleSidebar,
    FloatingRegisterButton,
    FloatingSuggestButton,
    JamDetailLoadingSkeleton,
    PerformanceSelectionModal,
    SuggestSongModal,
    TimelineShowcaseV2Waveform,
} from '../../components/jam-detail-v2/'
import type {JamResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {getInstrumentIcon} from "../../components/schedule/RegistrationList.tsx";

export function JamDetailPageV2() {
    const {t} = useTranslation()
    const {jamId} = useParams<{ jamId: string }>()
    const navigate = useNavigate()
    const {isAuthenticated, user} = useAuth()

    const {data: jam, error: jamError, isLoading, mutate: mutateJam} = useSWR<JamResponseDto | null>(
        jamId ? `/jams/${jamId}` : null
    )

    // State for enrollment modal
    const [showEnrollModal, setShowEnrollModal] = useState(false)
    const [selectedScheduleForEnroll, setSelectedScheduleForEnroll] = useState<ScheduleResponseDto | null>(null)
    const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null)

    // State for suggest song modal
    const [showSuggestModal, setShowSuggestModal] = useState(false)
    const [suggestSuccess, setSuggestSuccess] = useState<string | null>(null)

    // State for performance selection modal (from FAB)
    const [showPerformanceSelectModal, setShowPerformanceSelectModal] = useState(false)

    // Memoize all schedules for registration (including suggested ones)
    const allSchedules = useMemo(() =>
            jam?.schedules || [],
        [jam?.schedules]
    )

    // Non-suggested schedules for timeline display
    const nonSuggestedSchedules = useMemo(() =>
            jam?.schedules?.filter((s: ScheduleResponseDto) => s.status !== 'SUGGESTED') || [],
        [jam?.schedules]
    )

    // Get user's registered performances (filter from schedules, not registrations)
    // Registrations don't have music data, but schedules do
    const userRegistrations = useMemo(() => {
        if (!jam?.schedules || !user?.id) return []
        return jam.schedules.filter((schedule: ScheduleResponseDto) =>
            schedule.registrations?.some((reg) => reg.musician?.id === user.id)
        )
    }, [jam?.schedules, user?.id])

    // Memoize unique musicians count to avoid creating Set on every render
    const uniqueMusiciansCount = useMemo(() => {
        if (!jam?.registrations) return 0
        return new Set(jam.registrations.map((reg) => reg.musician?.id || reg.musician?.contact)).size
    }, [jam?.registrations])

    // Handle enrollment click
    const handleEnrollClick = useCallback((schedule: ScheduleResponseDto) => {
        if (!isAuthenticated) {
            navigate(`/login?redirect=/jams/${jamId}`)
        } else {
            setSelectedScheduleForEnroll(schedule)
            setShowEnrollModal(true)
        }
    }, [isAuthenticated, navigate, jamId])

    // Handle enrollment success
    const handleEnrollmentSuccess = useCallback(async () => {
        setShowEnrollModal(false)
        setSelectedScheduleForEnroll(null)
        setEnrollSuccess(t('jams.enroll_success'))
        await mutateJam()
        setTimeout(() => setEnrollSuccess(null), SUCCESS_TOAST_DURATION)
    }, [t, mutateJam])

    // Handle suggest click
    const handleSuggestClick = useCallback(() => {
        if (!isAuthenticated) {
            navigate(`/login?redirect=/jams/${jamId}`)
        } else {
            setShowSuggestModal(true)
        }
    }, [isAuthenticated, navigate, jamId])

    // Handle suggest success
    const handleSuggestSuccess = useCallback(async () => {
        setShowSuggestModal(false)
        setSuggestSuccess(t('jams.suggest_success'))
        await mutateJam()
        setTimeout(() => setSuggestSuccess(null), SUCCESS_TOAST_DURATION)
    }, [t, mutateJam])

    // State for My Registrations section - default to expanded only if user has registrations
    const [isRegistrationsExpanded, setIsRegistrationsExpanded] = useState(false)

    // Auto-expand registrations when user first has registrations
    useEffect(() => {
        if (userRegistrations.length > 0) {
            setIsRegistrationsExpanded(true)
        }
    }, [userRegistrations.length])
    // Loading state
    if (isLoading && !jam) {
        return <JamDetailLoadingSkeleton />
    }

    // Error state
    if (jamError || !jam) {
        return (
            <div className="min-h-screen bg-base-100 p-4">
                <div className="container mx-auto max-w-4xl">
                    <ErrorAlert message={jamError?.message || t('jams.not_found')} title={t('jams.error_loading_jam')}/>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200">
            {/* Success Alerts */}
            {enrollSuccess && (
                <div
                    className="bg-info text-info-content sticky top-0 z-50 animate-in fade-in duration-300 motion-reduce:animate-none"
                    role="alert" aria-live="polite">
                    <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-center gap-4">
                        <span className="text-lg" aria-hidden="true">✓</span>
                        <p className="font-semibold">{enrollSuccess}</p>
                    </div>
                </div>
            )}

            {suggestSuccess && (
                <div
                    className="bg-success text-success-content sticky top-0 z-50 animate-in fade-in duration-300 motion-reduce:animate-none"
                    role="alert" aria-live="polite">
                    <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-center gap-4">
                        <span className="text-lg" aria-hidden="true">✓</span>
                        <p className="font-semibold">{suggestSuccess}</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-linear-to-r from-base-200 to-base-300 border-b border-base-300">
                <div className="container mx-auto max-w-4xl px-2 sm:px-4 py-6 sm:py-8">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 text-balance">{jam.name}</h1>
                    <p className="text-base-content/70 mb-6 text-pretty max-w-3xl">{jam.description}</p>

                    {/* Jam Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                        {[
                            {icon: '📍', label: t('jams.info.location'), value: jam.location || t('jams.info.tba')},
                            {
                                icon: '📅',
                                label: t('jams.info.date'),
                                value: jam.date
                                    ? new Intl.DateTimeFormat(navigator.language || 'pt-BR', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    }).format(new Date(jam.date))
                                    : t('jams.info.tba'),
                            },
                            {
                                icon: '🎭',
                                label: t('jams.info.status'),
                                value: jam.status,
                            },
                            {
                                icon: '🎵',
                                label: t('jams.info.performances'),
                                value: jam.schedules?.filter((s) => s.status !== 'SUGGESTED').length || 0,
                            },
                            {
                                icon: '⏱️',
                                label: t('jams.info.duration'),
                                value: (() => {
                                    const totalSeconds = (jam.schedules?.filter((s) => s.status !== 'SUGGESTED').reduce((acc, s) => acc + (s.music?.duration || 0), 0) || 0)
                                    const minutes = Math.floor(totalSeconds / 60)
                                    const seconds = totalSeconds % 60
                                    return minutes > 0 ? `${minutes}m` : `${seconds}s`
                                })(),
                            },
                            {
                                icon: '👥',
                                label: t('jams.info.musicians'),
                                value: uniqueMusiciansCount,
                            },
                        ].map((stat, idx) => (
                            <div key={idx}
                                 className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 lg:p-4 bg-base-100/80 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <span className="text-base sm:text-lg lg:text-xl shrink-0"
                                      aria-hidden="true">{stat.icon}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-base-content/60 font-medium line-clamp-1">{stat.label}</p>
                                    <p className="font-bold text-xs sm:text-sm lg:text-base truncate tabular-nums">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Collapsible Sidebar (30% width) - First on mobile, second on desktop */}
                    <aside className="lg:col-span-1 order-1 lg:order-2">
                        <CollapsibleSidebar
                            jam={jam}
                            userRegistrations={userRegistrations}
                            onSuggestClick={handleSuggestClick}
                            isAuthenticated={isAuthenticated}
                        />
                    </aside>

                    {/* Timeline Column (70% width) - Second on mobile, first on desktop */}
                    <div className="lg:col-span-3 order-2 lg:order-1 space-y-6">
                        {/* My Registrations - Collapsible */}
                        <CollapsibleSection
                            title={t('jams.my_registrations')}
                            isExpanded={isRegistrationsExpanded}
                            onToggle={() => setIsRegistrationsExpanded(!isRegistrationsExpanded)}
                            badge={userRegistrations.length > 0 ? `${userRegistrations.length}` : undefined}
                        >
                            {userRegistrations.length > 0 ? (
                                <div className="space-y-2">
                                    {userRegistrations.map((schedule: ScheduleResponseDto, idx: number) => {
                                        // Find user's registration for this schedule to get their instrument and status
                                        const userReg = schedule.registrations?.find((reg) => reg.musician?.id === user?.id)
                                        // Show registration status if available, fallback to 'pending'
                                        const registrationStatus = userReg?.status?.toLowerCase() || 'pending'
                                        return (
                                            <div key={schedule.id || idx} className="text-xs p-2 bg-base-300/30 rounded">
                                                <div className="flex items-center gap-2 justify-between">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span aria-hidden="true">{getInstrumentIcon(userReg?.instrument || '')}</span>
                                                        <span className="font-semibold truncate">{schedule.music?.title}</span>
                                                    </div>
                                                    <span className="badge badge-xs badge-outline flex-shrink-0">
                                                        {t(`registration.statuses.${registrationStatus}`)}
                                                    </span>
                                                </div>
                                                <div className="text-base-content/60 truncate mt-1">
                                                    {schedule.music?.artist}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="text-3xl mb-3" aria-hidden="true">🎵</div>
                                    <p className="text-sm font-semibold mb-1">{t('common.no_registrations_yet')}</p>
                                    <p className="text-xs text-base-content/60">{t('jams.click_register_to_start')}</p>
                                </div>
                            )}
                        </CollapsibleSection>

                        {/* Performance Schedule - V2 Waveform Timeline with Expandable Cards */}
                        <TimelineShowcaseV2Waveform
                            schedules={nonSuggestedSchedules}
                            user={user}
                            onRegisterClick={handleEnrollClick}
                            jam={jam}
                        />
                    </div>

                </div>
            </div>

            {/* Floating Action Buttons - Show only when schedules exist */}
            <FloatingRegisterButton
                isVisible={nonSuggestedSchedules.length > 0}
                registrationCount={userRegistrations.length}
                onClick={() => {
                    if (!isAuthenticated) {
                        navigate(`/login?redirect=/jams/${jamId}`)
                    } else if (nonSuggestedSchedules.length === 1) {
                        // If only one performance, enroll directly
                        handleEnrollClick(nonSuggestedSchedules[0])
                    } else if (nonSuggestedSchedules.length > 1) {
                        // If multiple performances, show selection modal
                        setShowPerformanceSelectModal(true)
                    }
                }}
            />

            <FloatingSuggestButton
                isVisible={isAuthenticated}
                onClick={handleSuggestClick}
            />

            {/* Modals */}
            {selectedScheduleForEnroll && (
                <ScheduleEnrollmentModal
                    schedule={selectedScheduleForEnroll}
                    isOpen={showEnrollModal}
                    onClose={() => {
                        setShowEnrollModal(false)
                        setSelectedScheduleForEnroll(null)
                    }}
                    onSuccess={handleEnrollmentSuccess}
                />
            )}

            <SuggestSongModal
                jamId={jamId || ''}
                isOpen={showSuggestModal}
                onClose={() => setShowSuggestModal(false)}
                onSuccess={handleSuggestSuccess}
            />

            <PerformanceSelectionModal
                performances={allSchedules}
                isOpen={showPerformanceSelectModal}
                onClose={() => setShowPerformanceSelectModal(false)}
                onSelectPerformance={handleEnrollClick}
                userId={user?.id}
            />
        </div>
    )
}

export default JamDetailPageV2
