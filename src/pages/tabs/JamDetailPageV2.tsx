/**
 * JamDetailPageV2
 * Waveform Pulse Timeline Design - Modern minimal with music-themed elements
 */

import {useNavigate, useParams} from 'react-router-dom'
import {SITE_URL} from '../../lib/api'
import {useAuth, useJamParticipationController} from '../../hooks'
import useSWR from 'swr'
import {useCallback, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {SEO} from '../../components/SEO'
import {getJamPath} from '../../utils/jamUrl'
import {
    Action,
    DropdownMenu,
    IconAction,
    ScheduleEnrollmentModal,
    Status,
} from '../../components'
import {ShareModal} from '../../components/ShareModal'
import {SpotifyLogo} from '../../components/SpotifyPreview'
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
import {formatJamDuration} from '../../lib/formatters'
import {MapPin, Calendar, Share2, ArrowLeft, Music, Users, Clock3} from 'lucide-react'

export type JamDetailViewState =
    | {status: 'loaded'; jam: JamResponseDto}
    | {status: 'loading'}
    | {status: 'error'; message: string}
    | {status: 'not-found'}

interface JamDetailPageV2Props {
    /** Deterministic route-state seam for direct composition evidence. */
    viewState?: JamDetailViewState
    onNavigate?: (path: string) => void
    onRetry?: () => void | Promise<void>
}

export function JamDetailPageV2({viewState, onNavigate, onRetry}: JamDetailPageV2Props = {}) {
    const {t, i18n} = useTranslation()
    const {jamId} = useParams<{ jamId: string }>()
    const navigate = useNavigate()
    const {isAuthenticated, user} = useAuth()

    const {data: routeJam, error: routeError, isLoading: routeLoading, mutate: mutateJam} = useSWR<JamResponseDto | null>(
        jamId && !viewState ? `/jams/${jamId}` : null
    )
    const jam = viewState?.status === 'loaded' ? viewState.jam : routeJam
    const jamError = viewState?.status === 'error' ? new Error(viewState.message) : routeError
    const isLoading = viewState?.status === 'loading' || (!viewState && routeLoading)
    const goTo = useCallback((path: string) => {
        if (onNavigate) {
            onNavigate(path)
            return
        }
        void navigate(path)
    }, [navigate, onNavigate])
    const reloadJam = useCallback(async () => {
        if (viewState?.status === 'loaded') return viewState.jam
        return mutateJam()
    }, [mutateJam, viewState])

    const {state: participation, commands: participationCommands} = useJamParticipationController(
        jam,
        isAuthenticated,
        user?.id ?? null,
        reloadJam,
    )

    // State for suggested songs section collapse
    const [isSuggestedExpanded, setIsSuggestedExpanded] = useState(true)

    // State for copy location feedback
    const [locationCopied, setLocationCopied] = useState(false)

    // State for description truncation
    const [descriptionExpanded, setDescriptionExpanded] = useState(false)

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

    const jamFacts = useMemo(() => {
        const musicians = new Set(
            nonSuggestedSchedules
                .flatMap(({registrations}) => registrations ?? [])
                .map(({musicianId, musician}) => musician?.id ?? musicianId)
                .filter(Boolean),
        ).size
        const duration = nonSuggestedSchedules.reduce(
            (total, schedule) => total + (schedule.music?.duration ?? 0),
            0,
        )
        return {musicians, duration, performances: nonSuggestedSchedules.length}
    }, [nonSuggestedSchedules])

    const eligibleSchedules = useMemo(() => {
        const eligibleIds = new Set(participation.eligiblePerformances.map(({id}) => id))
        return allSchedules.filter(({id}) => eligibleIds.has(id))
    }, [allSchedules, participation.eligiblePerformances])
    const selectedScheduleForEnroll = allSchedules.find(({id}) => id === participation.selectedPerformanceId) ?? null

    // Handle enrollment click
    const handleEnrollClick = useCallback((schedule: ScheduleResponseDto) => {
        const outcome = participationCommands.beginRegistration(schedule.id)
        if (outcome.code === 'auth_required') goTo(`/login?redirect=${outcome.redirect}`)
    }, [goTo, participationCommands])

    // Handle FAB register click
    const handleFABRegisterClick = useCallback(() => {
        const outcome = participationCommands.beginRegistration()
        if (outcome.code === 'auth_required') goTo(`/login?redirect=${outcome.redirect}`)
    }, [goTo, participationCommands])

    // Handle suggest click
    const handleSuggestClick = useCallback(() => {
        const outcome = participationCommands.beginSuggestion()
        if (outcome.code === 'auth_required') goTo(`/login?redirect=${outcome.redirect}`)
    }, [goTo, participationCommands])

    // Handle create new song click (from SuggestSongModal)
    const handleCreateNewSong = useCallback(() => {
        participationCommands.beginNewMusic()
    }, [participationCommands])

    // Loading state
    if (isLoading && !jam) {
        return <JamDetailLoadingSkeleton />
    }

    // Error state
    if (jamError) {
        return (
            <main className="min-h-screen bg-base-100 px-4 py-12 sm:py-20">
                <div className="container mx-auto max-w-xl">
                    <h1 className="ds-type-heading text-3xl font-extrabold text-base-content sm:text-4xl">
                        {t('jams.error_loading_jam')}
                    </h1>
                    <p className="mt-3 text-base-content/70" role="alert">{jamError.message}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Action onClick={() => {
                            if (onRetry) void onRetry()
                            else void mutateJam()
                        }}>
                            {t('common.try_again')}
                        </Action>
                        <Action variant="quiet" onClick={() => goTo('/jams')}>
                            {t('jams.back_to_jams')}
                        </Action>
                    </div>
                </div>
            </main>
        )
    }

    if (!jam) {
        return (
            <main className="min-h-screen bg-base-100 px-4 py-12 sm:py-20">
                <div className="container mx-auto max-w-xl">
                    <h1 className="ds-type-heading text-3xl font-extrabold text-base-content sm:text-4xl">
                        {t('jams.not_found')}
                    </h1>
                    <Action className="mt-8" onClick={() => goTo('/jams')}>
                        {t('jams.back_to_jams')}
                    </Action>
                </div>
            </main>
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
            {participation.feedback === 'registration_success' && (
                <div className="sticky top-0 z-50 animate-in fade-in duration-300 motion-reduce:animate-none">
                    <div className="container mx-auto max-w-4xl px-4 py-3">
                        <Status tone="info" role="alert" title={t('jams.enroll_success')} />
                    </div>
                </div>
            )}

            {(participation.feedback === 'suggestion_success' || participation.feedback === 'new_music_success') && (
                <div className="sticky top-0 z-50 animate-in fade-in duration-300 motion-reduce:animate-none">
                    <div className="container mx-auto max-w-4xl px-4 py-3">
                        <Status
                            tone="success"
                            role="alert"
                            title={participation.feedback === 'new_music_success' ? t('jams.song_created_success') : t('jams.suggest_success')}
                        />
                    </div>
                </div>
            )}

            {/* Header - compact: title + meta on one line, details muted below */}
            <div className="bg-base-200 border-b border-base-300">
                <div className="container mx-auto max-w-4xl px-2 sm:px-4 py-4 sm:py-5">
                    {/* Title and Jam-level actions share one aligned identity row. */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <IconAction
                                variant="quiet"
                                onClick={() => goTo('/jams')}
                                className="shrink-0"
                                label={t('common.back')}
                            >
                                <ArrowLeft className="size-4" />
                            </IconAction>
                            <h1 className="ds-type-heading ds-wrap-user-content font-extrabold leading-tight sm:text-3xl md:text-4xl">{jam.name}</h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                            {jam.spotifyPlaylistUrl && (
                                <a
                                    href={jam.spotifyPlaylistUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ds-action ds-control ds-focusable ds-action--quiet ds-action--idle"
                                >
                                    <SpotifyLogo />
                                    {t('jams.listen_on_spotify', 'Playlist no Spotify')}
                                </a>
                            )}
                            <Action
                                variant="secondary"
                                onClick={participationCommands.beginShare}
                            >
                                <Share2 className="size-4" aria-hidden="true" />
                                {t('share.share_button')}
                            </Action>
                        </div>
                    </div>

                    {/* Description is the first supporting information after identity. */}
                    {jam.description && (
                        <div className="mt-3">
                            <p className={`max-w-3xl whitespace-pre-line text-sm text-pretty text-base-content/70 ${!descriptionExpanded ? 'line-clamp-3' : ''}`}>
                                {jam.description}
                            </p>
                            {jam.description.length > 100 && (
                                <Action
                                    variant="quiet"
                                    onClick={() => setDescriptionExpanded(prev => !prev)}
                                    className="mt-1 justify-start px-0 text-primary"
                                >
                                    <span className="text-xs">
                                        {descriptionExpanded ? t('common.show_less') : t('common.show_more')}
                                    </span>
                                </Action>
                            )}
                        </div>
                    )}

                    {/* Jam facts stay together so date, place, size, and duration
                        read as one identity block. */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-base-300 py-2 text-sm text-base-content/70">
                        {jam.date && (
                            <span className="inline-flex min-h-11 items-center gap-1.5">
                                <Calendar className="size-4" aria-hidden="true" />
                                {new Intl.DateTimeFormat(i18n.language || 'pt-BR', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'UTC',
                                }).format(new Date(jam.date))}
                            </span>
                        )}
                        {jam.location && (
                            <DropdownMenu
                                label={t('jams.info.full_address')}
                                className="[&_.ds-dropdown__trigger]:border-0 [&_.ds-dropdown__trigger]:bg-transparent [&_.ds-dropdown__trigger]:px-0"
                                trigger={
                                    <span className="inline-flex items-center gap-1.5 text-base-content/70">
                                        <MapPin className="size-4" aria-hidden="true" />
                                        <span className="max-w-[16rem] truncate">{jam.location}</span>
                                    </span>
                                }
                            >
                                <div className="w-64 space-y-1 p-2">
                                    <p className="ds-wrap-user-content text-sm leading-relaxed text-base-content/80">{jam.location}</p>
                                    <Action variant="quiet" onClick={() => void handleCopyLocation()} className="min-h-11 justify-start px-0 text-sm text-primary underline underline-offset-4">
                                        {locationCopied ? t('common.copied') : t('common.copy_address')}
                                    </Action>
                                </div>
                            </DropdownMenu>
                        )}
                        <span className="inline-flex min-h-11 items-center gap-1.5">
                            <Music className="size-4" aria-hidden="true" />
                            {jamFacts.performances} {t('jams.info.performances').toLowerCase()}
                        </span>
                        {jamFacts.musicians > 0 && (
                            <span className="inline-flex min-h-11 items-center gap-1.5">
                                <Users className="size-4" aria-hidden="true" />
                                {jamFacts.musicians} {t('jams.info.musicians').toLowerCase()}
                            </span>
                        )}
                        {jamFacts.duration > 0 && (
                            <span className="inline-flex min-h-11 items-center gap-1.5">
                                <Clock3 className="size-4" aria-hidden="true" />
                                {formatJamDuration(jamFacts.duration)}
                            </span>
                        )}
                    </div>

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
                    isOpen={participation.activeOverlay === 'share'}
                    onClose={participationCommands.closeOverlay}
                    jamId={jam.id}
                    jamSlug={jam.slug}
                    jamName={jam.name}
                    nativeShareAvailable={participation.shareCapability.native}
                    onCopy={participationCommands.shareCopy}
                    onWhatsApp={participationCommands.shareWhatsApp}
                    onNativeShare={participationCommands.shareNative}
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
                                                <p className="ds-wrap-user-content font-semibold text-sm">
                                                    {schedule.music?.title}
                                                </p>
                                                <p className="ds-wrap-user-content text-xs text-base-content/60">
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
                isVisible={isAuthenticated && participation.eligiblePerformances.length > 0}
                registrationCount={userRegistrations.length}
                onRegisterClick={handleFABRegisterClick}
                onSuggestClick={handleSuggestClick}
                primaryAction="register"
            />

            {/* Modals */}
            {selectedScheduleForEnroll && (
                <ScheduleEnrollmentModal
                schedule={selectedScheduleForEnroll}
                isOpen={participation.activeOverlay === 'enrollment'}
                musicianId={user?.id}
                preferredInstrument={user?.instrument}
                onClose={participationCommands.closeOverlay}
                    onSubmit={participationCommands.register}
                />
            )}

            <SuggestSongModal
                isOpen={participation.activeOverlay === 'suggestion'}
                onClose={participationCommands.closeOverlay}
                onSuggest={participationCommands.suggestMusic}
                onCreateNewSong={handleCreateNewSong}
            />

            <SuggestNewSongModal
                isOpen={participation.activeOverlay === 'new_music'}
                onClose={participationCommands.closeOverlay}
                onSubmit={participationCommands.createAndSuggestMusic}
            />

            <PerformanceSelectionModal
                performances={eligibleSchedules}
                isOpen={participation.activeOverlay === 'performance_picker'}
                onClose={participationCommands.closeOverlay}
                onSelectPerformance={handleEnrollClick}
                userId={user?.id}
            />
        </div>
    )
}

export default JamDetailPageV2
