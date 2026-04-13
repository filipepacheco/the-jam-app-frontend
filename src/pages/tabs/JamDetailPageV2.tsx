/**
 * JamDetailPageV2
 * Waveform Pulse Timeline Design - Modern minimal with music-themed elements
 */

import {useNavigate, useParams} from 'react-router-dom'
import {SITE_URL} from '../../lib/api'
import {useAuth} from '../../hooks'
import useSWR from 'swr'
import {useCallback, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {SEO} from '../../components/SEO'
import {getJamPath} from '../../utils/jamUrl'
import {
    Alert,
    ScheduleEnrollmentModal,
} from '../../components'
import {ShareModal} from '../../components/ShareModal'
import {
    CollapsibleSection,
    DualActionFAB,
    JamDetailLoadingSkeleton,
    PerformanceSelectionModal,
    SuggestSongModal,
    SuggestNewSongModal,
    TimelineShowcaseV2Waveform,
} from '../../components/jam-detail-v2/'
import type {JamResponseDto, RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {getInstrumentIcon} from "../../lib/schedule/instrumentHelpers.tsx";
import {MapPin, Calendar, Share2, ArrowLeft} from 'lucide-react'

// Constants
const SUCCESS_TOAST_DURATION = 3000

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

    // State for suggest new song modal (create new music)
    const [showNewSongModal, setShowNewSongModal] = useState(false)

    // State for suggested songs section collapse
    const [isSuggestedExpanded, setIsSuggestedExpanded] = useState(true)

    // State for performance selection modal (from FAB)
    const [showPerformanceSelectModal, setShowPerformanceSelectModal] = useState(false)

    // State for copy location feedback
    const [locationCopied, setLocationCopied] = useState(false)

    // State for description truncation
    const [descriptionExpanded, setDescriptionExpanded] = useState(false)

    // State for share modal
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)

    // State for error feedback
    const [errorMessage] = useState<string | null>(null)

    // Handle copy location to clipboard
    const handleCopyLocation = useCallback(async () => {
        if (jam?.location) {
            try {
                await navigator.clipboard.writeText(jam.location)
                setLocationCopied(true)
                setTimeout(() => setLocationCopied(false), 2000)
            } catch (error) {
                console.error('Failed to copy location:', error)
            }
        }
    }, [jam?.location])

    // Derive all schedule data in a single pass
    const { allSchedules, nonSuggestedSchedules, suggestedSchedules } = useMemo(() => {
        const all = jam?.schedules || []
        const nonSuggested: ScheduleResponseDto[] = []
        const suggested: ScheduleResponseDto[] = []

        for (const s of all) {
            if (s.status !== 'SUGGESTED') {
                nonSuggested.push(s)
            } else {
                suggested.push(s)
            }
        }

        return { allSchedules: all, nonSuggestedSchedules: nonSuggested, suggestedSchedules: suggested }
    }, [jam?.schedules])

    // Get user's registrations with schedule data (supports multiple registrations per schedule)
    const userRegistrations = useMemo(() => {
        if (!jam?.schedules || !user?.id) return []
        const registrations: Array<{ schedule: ScheduleResponseDto; registration: RegistrationResponseDto }> = []
        for (const schedule of jam.schedules) {
            if (schedule.registrations) {
                for (const reg of schedule.registrations) {
                    if (reg.musician?.id === user.id) {
                        registrations.push({ schedule, registration: reg })
                    }
                }
            }
        }
        return registrations
    }, [jam?.schedules, user?.id])

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

    // Handle FAB register click
    const handleFABRegisterClick = useCallback(() => {
        if (nonSuggestedSchedules.length === 1) {
            handleEnrollClick(nonSuggestedSchedules[0])
        } else if (nonSuggestedSchedules.length > 1) {
            setShowPerformanceSelectModal(true)
        }
    }, [nonSuggestedSchedules, handleEnrollClick])

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

    // Handle create new song click (from SuggestSongModal)
    const handleCreateNewSong = useCallback(() => {
        setShowNewSongModal(true)
    }, [])

    // Handle new song creation success
    const handleNewSongSuccess = useCallback(async () => {
        setShowNewSongModal(false)
        setSuggestSuccess(t('jams.song_created_success'))
        await mutateJam()
        setTimeout(() => setSuggestSuccess(null), SUCCESS_TOAST_DURATION)
    }, [t, mutateJam])

    // Loading state
    if (isLoading && !jam) {
        return <JamDetailLoadingSkeleton />
    }

    // Error state
    if (jamError || !jam) {
        return (
            <div className="min-h-screen bg-base-100 p-4">
                <div className="container mx-auto max-w-4xl">
                    <Alert type="error" message={jamError?.message || t('jams.not_found')} title={t('jams.error_loading_jam')}/>
                </div>
            </div>
        )
    }

    const siteUrl = SITE_URL
    const canonicalUrl = `${siteUrl}${getJamPath(jam)}`

    const eventStatusMap: Record<string, string> = {
        ACTIVE: 'https://schema.org/EventScheduled',
        INACTIVE: 'https://schema.org/EventPostponed',
        LIVE: 'https://schema.org/EventScheduled',
        FINISHED: 'https://schema.org/EventPast',
    }

    const jamJsonLd: Record<string, unknown>[] = [
        {
            '@type': 'MusicEvent',
            name: jam.name,
            description: jam.description || t('seo.jam.fallback_description', { defaultValue: 'Jam session on Jam App. Join as a musician or watch live.' }),
            ...(jam.date && { startDate: jam.date }),
            location: jam.location
                ? { '@type': 'Place', name: jam.location }
                : { '@type': 'VirtualLocation', url: canonicalUrl },
            url: canonicalUrl,
            image: `${siteUrl}/og-image.jpg`,
            eventStatus: eventStatusMap[jam.status] || 'https://schema.org/EventScheduled',
            eventAttendanceMode: jam.location
                ? 'https://schema.org/OfflineEventAttendanceMode'
                : 'https://schema.org/OnlineEventAttendanceMode',
            organizer: {
                '@type': 'Organization',
                name: jam.hostName || 'Jam App',
                url: siteUrl,
            },
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'BRL',
                availability: 'https://schema.org/InStock',
                url: canonicalUrl,
            },
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Jam Sessions', item: `${siteUrl}/jams` },
                { '@type': 'ListItem', position: 2, name: jam.name, item: canonicalUrl },
            ],
        },
    ]

    return (
        <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200">
            <SEO
                title={jam.name}
                description={jam.description || undefined}
                canonical={canonicalUrl}
                ogType="website"
                jsonLd={jamJsonLd}
            />
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

            {/* Error Alert */}
            {errorMessage && (
                <div
                    className="bg-error text-error-content sticky top-0 z-50 animate-in fade-in duration-300 motion-reduce:animate-none"
                    role="alert" aria-live="assertive">
                    <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-center gap-4">
                        <p className="font-semibold text-sm">{errorMessage}</p>
                    </div>
                </div>
            )}

            {/* Header - compact: title + meta on one line, details muted below */}
            <div className="bg-base-200 border-b border-base-300">
                <div className="container mx-auto max-w-4xl px-2 sm:px-4 py-4 sm:py-5">
                    {/* Title row with back + share */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-2 min-w-0">
                            <button
                                type="button"
                                onClick={() => navigate('/jams')}
                                className="btn btn-ghost btn-sm btn-square shrink-0 mt-0.5"
                                aria-label={t('common.back')}
                            >
                                <ArrowLeft className="size-4" />
                            </button>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-balance leading-tight">{jam.name}</h1>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsShareModalOpen(true)}
                            className="btn btn-ghost btn-sm btn-square shrink-0"
                            aria-label={t('share.share_button')}
                        >
                            <Share2 className="size-4" />
                        </button>
                    </div>

                    {/* Single metadata line: date, location, status */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/60">
                        {jam.date && (
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="size-3" />
                                {new Intl.DateTimeFormat(navigator.language || 'pt-BR', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'UTC',
                                }).format(new Date(jam.date))}
                            </span>
                        )}
                        {jam.location && (
                            <div className="dropdown dropdown-bottom">
                                <span
                                    tabIndex={0}
                                    role="button"
                                    className="inline-flex items-center gap-1 hover:text-base-content transition-colors cursor-pointer"
                                >
                                    <MapPin className="size-3" />
                                    <span className="truncate max-w-[180px]">{jam.location}</span>
                                </span>
                                <div tabIndex={0} className="dropdown-content z-50 menu p-3 shadow-lg bg-base-100 rounded-box w-72 max-w-[90vw]">
                                    <p className="text-sm font-semibold mb-2">{t('jams.info.full_address')}</p>
                                    <p className="text-sm text-base-content/80 mb-3 break-words">{jam.location}</p>
                                    <button
                                        onClick={handleCopyLocation}
                                        className="btn btn-sm btn-outline w-full"
                                    >
                                        {locationCopied ? t('common.copied') : t('common.copy_address')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Spotify Playlist Link */}
                    {jam.spotifyPlaylistUrl && (
                        <a
                            href={jam.spotifyPlaylistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-success hover:text-success/80 transition-colors mt-2"
                        >
                            <span aria-hidden="true">🎧</span>
                            {t('jams.listen_on_spotify', 'Playlist no Spotify')}
                        </a>
                    )}

                    {/* Description - truncated, single line */}
                    {jam.description && (
                        <div className="mt-2">
                            <p className={`text-base-content/70 text-xs text-pretty max-w-3xl whitespace-pre-line ${!descriptionExpanded ? 'line-clamp-3' : ''}`}>
                                {jam.description}
                            </p>
                            {jam.description.length > 100 && (
                                <button
                                    onClick={() => setDescriptionExpanded(prev => !prev)}
                                    className="btn btn-ghost btn-xs mt-1 text-primary"
                                    type="button"
                                >
                                    {descriptionExpanded ? t('common.show_less') : t('common.show_more')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Finished/Inactive banner */}
            {(jam.status === 'FINISHED' || jam.status === 'INACTIVE') && (
                <div className="bg-base-300/50 border-b border-base-300">
                    <div className="container mx-auto max-w-4xl px-4 py-2 text-center">
                        <p className="text-xs text-base-content/50 font-medium">
                            {t(`jams.banner.${jam.status.toLowerCase()}`)}
                        </p>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {jam && (
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    jamId={jam.id}
                    jamSlug={jam.slug}
                    jamName={jam.name}
                />
            )}

            {/* Main Content */}
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Timeline Column - full width, schedule is the hero */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Performance Schedule - the centerpiece */}
                        <TimelineShowcaseV2Waveform
                            schedules={nonSuggestedSchedules}
                            user={user}
                            onRegisterClick={handleEnrollClick}
                            jam={jam}
                            jamStatus={jam.status}
                        />

                        {/* Suggested Songs Section */}
                        {suggestedSchedules.length > 0 && (
                            <CollapsibleSection
                                title={t('jams.suggested_songs_short', 'Sugeridas')}
                                isExpanded={isSuggestedExpanded}
                                onToggle={() => setIsSuggestedExpanded(!isSuggestedExpanded)}
                                badge={`${suggestedSchedules.length}`}
                            >
                                <p className="text-xs text-base-content/50 mb-2">{t('jams.suggested_songs_hint')}</p>
                                <div className="divide-y divide-base-300/40">
                                    {suggestedSchedules.map((schedule) => (
                                        <div
                                            key={schedule.id}
                                            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">
                                                    {schedule.music?.title}
                                                </p>
                                                <p className="text-xs text-base-content/60 truncate">
                                                    {schedule.music?.artist}
                                                </p>
                                                {schedule.registrations && schedule.registrations.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {schedule.registrations.map((reg) => (
                                                            <span
                                                                key={reg.id}
                                                                className="inline-flex items-center gap-1 text-[11px] text-base-content/60"
                                                            >
                                                                <span aria-hidden="true">{getInstrumentIcon(reg.instrument || '')}</span>
                                                                {reg.musician?.name || reg.musician?.contact}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleEnrollClick(schedule)}
                                                className="btn btn-outline btn-primary btn-xs shrink-0"
                                            >
                                                + {t('jams.register')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                    </div>

                </div>
            </div>

            {/* Floating Action Button - Combined register + suggest */}
            <DualActionFAB
                isVisible={isAuthenticated && nonSuggestedSchedules.length > 0 && jam.status !== 'FINISHED' && jam.status !== 'INACTIVE'}
                registrationCount={userRegistrations.length}
                onRegisterClick={handleFABRegisterClick}
                onSuggestClick={handleSuggestClick}
                primaryAction="register"
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
                jamId={jam?.id || ''}
                isOpen={showSuggestModal}
                onClose={() => setShowSuggestModal(false)}
                onSuccess={handleSuggestSuccess}
                onCreateNewSong={handleCreateNewSong}
            />

            <SuggestNewSongModal
                jamId={jam?.id || ''}
                isOpen={showNewSongModal}
                onClose={() => setShowNewSongModal(false)}
                onSuccess={handleNewSongSuccess}
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
