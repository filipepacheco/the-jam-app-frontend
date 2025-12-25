/**
 * Registration List Component
 * Displays musicians registered for a performance
 */

import type {RegistrationResponseDto} from '../../types/api.types'
import {CheckCircle, Clock, Music, Users, XCircle} from 'lucide-react'
import {useTranslation} from 'react-i18next'

export const getInstrumentIcon = (instrument?: string): React.ReactNode => {
    if (!instrument) return <Music className="w-4 h-4" />
    const lower = instrument.toLowerCase()
    switch (lower) {
        case 'drums':
        case 'bateria':
            return '🥁'
        case 'guitar':
        case 'guitars':
        case 'guitarra':
            return '🎸'
        case 'bass':
        case 'baixo':
            return '🎸b'
        case 'vocals':
        case 'vocal':
        case 'vozes':
        case 'voz':
            return '🎤'
        case 'keys':
        case 'keyboard':
        case 'teclado':
            return '🎹'
        default:
            return <Music className="w-4 h-4" />
    }
}

const getInstrumentDisplayName = (instrument: string, t: (key: string) => string): string => {
    const lower = instrument.toLowerCase()
    switch (lower) {
        case 'drums':
        case 'bateria':
            return t('schedule.instruments.drums')
        case 'guitar':
        case 'guitars':
        case 'guitarra':
            return t('schedule.instruments.guitars')
        case 'bass':
        case 'baixo':
            return t('schedule.instruments.bass')
        case 'vocals':
        case 'vocal':
        case 'vozes':
        case 'voz':
            return t('schedule.instruments.vocals')
        case 'keys':
        case 'keyboard':
        case 'teclado':
            return t('schedule.instruments.keys')
        default:
            return instrument
    }
}

const normalizeInstrument = (instrument?: string): string => {
    if (!instrument) return ''
    const lower = instrument.toLowerCase()
    if (lower === 'drums' || lower === 'bateria') return 'drums'
    if (lower === 'guitar' || lower === 'guitars' || lower === 'guitarra') return 'guitars'
    if (lower === 'bass' || lower === 'baixo') return 'bass'
    if (lower === 'vocals' || lower === 'vocal' || lower === 'vozes' || lower === 'voz') return 'vocals'
    if (lower === 'keys' || lower === 'keyboard' || lower === 'teclado') return 'keys'
    return lower
}

const getNeededInstruments = (
    neededDrums?: number,
    neededGuitars?: number,
    neededBass?: number,
    neededVocals?: number,
    neededKeys?: number
): string[] => {
    const instruments: string[] = []
    if (neededDrums && neededDrums > 0) instruments.push('drums')
    if (neededGuitars && neededGuitars > 0) instruments.push('guitars')
    if (neededBass && neededBass > 0) instruments.push('bass')
    if (neededVocals && neededVocals > 0) instruments.push('vocals')
    if (neededKeys && neededKeys > 0) instruments.push('keys')
    return instruments
}

const groupRegistrationsByInstrument = (
    registrations: RegistrationResponseDto[] | undefined
): Map<string, RegistrationResponseDto[]> => {
    const grouped = new Map<string, RegistrationResponseDto[]>()
    if (!registrations) return grouped

    registrations.forEach((reg) => {
        const instrument = normalizeInstrument(reg.instrument || reg.musician?.instrument)
        if (instrument) {
            if (!grouped.has(instrument)) {
                grouped.set(instrument, [])
            }
            grouped.get(instrument)!.push(reg)
        }
    })

    return grouped
}

interface RegistrationListProps {
    registrations: RegistrationResponseDto[] | undefined
    loading?: boolean
    onApprove?: (registrationId: string) => void
    onReject?: (registrationId: string) => void
    showActions?: boolean
    onAddMusician?: () => void
    neededDrums?: number
    neededGuitars?: number
    neededBass?: number
    neededVocals?: number
    neededKeys?: number
}

export function RegistrationList({
                                     registrations,
                                     loading = false,
                                     onApprove,
                                     onReject,
                                     showActions = false,
                                     onAddMusician,
                                     neededDrums,
                                     neededGuitars,
                                     neededBass,
                                     neededVocals,
                                     neededKeys,
                                 }: RegistrationListProps) {
    const { t } = useTranslation()
    const neededInstruments = getNeededInstruments(neededDrums, neededGuitars, neededBass, neededVocals, neededKeys)
    const groupedRegistrations = groupRegistrationsByInstrument(registrations)
    const hasRegistrations = registrations && registrations.length > 0

    return (
        <div className="mt-0 bg-base-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-base-content/70 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {t('schedule.musicians_registered')}
                </p>
                {showActions && onAddMusician && (
                    <button
                        onClick={onAddMusician}
                        className="btn btn-xs btn-outline"
                        title={t('schedule.add_musician_btn')}
                    >
                        {t('schedule.add_musician')}
                    </button>
                )}
            </div>

            {hasRegistrations && neededInstruments.length > 0 ? (
                <div className="overflow-x-auto -mx-3 px-3">
                    <div className="flex gap-3" style={{ minWidth: '100%', display: 'flex' }}>
                        {neededInstruments.map((instrument) => (
                            <div
                                key={instrument}
                                className="flex-1 min-w-[120px] bg-base-100 rounded-xl p-3 shadow-sm border border-base-300"
                            >
                                {/* Column Header */}
                                <div className="mb-3 pb-3 border-b-2 border-primary/20">
                                    <p className="text-xs font-bold text-primary flex items-center gap-2">
                                        {getInstrumentIcon(instrument)} {getInstrumentDisplayName(instrument, t)}
                                    </p>
                                </div>

                                {/* Musician Cards in Column */}
                                <div className="space-y-2">
                                    {(groupedRegistrations.get(instrument) || []).map((registration) => (
                                        <div
                                            key={registration.id}
                                            className="bg-white dark:bg-base-100 rounded-lg p-2.5 flex items-start gap-2 shadow-xs border border-base-200 dark:border-base-300 hover:shadow-sm hover:border-primary/30 transition-all"
                                        >
                                            {/* Left Content */}
                                            <div className="space-y-1 flex-1 min-w-0">
                                                {/* Musician Name */}
                                                <p className="text-xs font-bold truncate text-base-content">
                                                    {registration.musician?.name || t('schedule.unknown')}
                                                    {registration.musician?.instrument && (
                                                        // <span className="text-xs font-normal text-base-content/60 flex items-center gap-1 mt-0.5">
                                                            <>{' '}({getInstrumentIcon(registration.musician.instrument)})</>
                                                        // </span>
                                                    )}
                                                </p>

                                                {/* Status Badge */}
                                                <div className="flex items-center gap-1">
                                                    {registration.status === 'APPROVED' && (
                                                        <div className="flex items-center gap-1 badge badge-sm text-success-content" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgb(34, 197, 94)' }}>
                                                            <CheckCircle className="w-3 h-3" />
                                                            <span>{t('schedule.statuses.approved')}</span>
                                                        </div>
                                                    )}
                                                    {registration.status === 'REJECTED' && (
                                                        <div className="flex items-center gap-1 badge badge-sm badge-error text-error-content" >
                                                            <XCircle className="w-3 h-3" />
                                                            <span>{t('schedule.statuses.canceled')}</span>
                                                        </div>
                                                    )}
                                                    {!registration.status || (registration.status !== 'APPROVED' && registration.status !== 'REJECTED') && (
                                                        <div className="flex items-center gap-1 badge badge-sm text-warning-content" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgb(251, 191, 36)' }}>
                                                            <Clock className="w-3 h-3" />
                                                            <span>{t('schedule.statuses.pending')}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Contact Info (if showActions) */}
                                                {showActions && (
                                                    <div className="space-y-0.5 pt-1">
                                                        {registration.musician?.contact && (
                                                            <p className="text-xs text-base-content/60 truncate">
                                                                {registration.musician.contact}
                                                            </p>
                                                        )}
                                                        {registration.musician?.level && (
                                                            <p className="text-xs text-base-content/50 badge badge-xs badge-ghost">
                                                                {t(`schedule.levels.${registration.musician.level}`)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons - Right side */}
                                            {showActions && registration.status !== 'APPROVED' && registration.status !== 'REJECTED' && (
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => onApprove?.(registration.id)}
                                                        className="btn btn-xs btn-success btn-outline"
                                                        disabled={loading}
                                                        title={t('common.approve')}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => onReject?.(registration.id)}
                                                        className="btn btn-xs btn-error btn-outline"
                                                        disabled={loading}
                                                        title={t('common.reject')}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Empty Column Message */}
                                    {(!groupedRegistrations.get(instrument) || groupedRegistrations.get(instrument)!.length === 0) && (
                                        <p className="text-xs text-base-content/40 italic text-center py-4 bg-base-100/50 rounded">
                                            {t('schedule.no_musicians_yet')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-sm text-base-content/50 italic py-6 text-center bg-base-200/30 rounded-lg">
                    {t('schedule.no_musicians_registered')}
                </div>
            )}
        </div>
    )
}

