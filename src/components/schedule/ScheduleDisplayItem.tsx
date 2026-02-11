/**
 * Schedule Display Item Component
 * Displays a single schedule item for public viewing on jam detail page
 */

import {memo} from 'react'
import type {ScheduleResponseDto} from '../../types/api.types'
import {RegistrationList} from './RegistrationList'
import {InstrumentBadges} from './InstrumentBadges'
import {useTranslation} from 'react-i18next'
import {getStatusColor, getStatusLabel, getStatusIcon} from '../../lib/schedule/statusHelpers'
import {CheckCircle} from 'lucide-react'

interface ScheduleDisplayItemProps {
    schedule: ScheduleResponseDto
    isSuggested?: boolean
    userRegisteredForSchedule?: boolean
    onEnrollClick?: () => void
}

export const ScheduleDisplayItem = memo(function ScheduleDisplayItem({
                                        schedule, isSuggested = false, userRegisteredForSchedule = false, onEnrollClick,
                                    }: ScheduleDisplayItemProps) {
    const { t } = useTranslation()

    const {
        music
    } = schedule || {}

    const {
        neededDrums = 0, duration = 0, neededGuitars = 0, neededVocals = 0, neededBass = 0, neededKeys = 0
    } = music || {}


    return (<div
        className={`border-l-4 pl-4 py-2 rounded-lg ${
            schedule.status === 'IN_PROGRESS'
                ? 'bg-warning/10 border-warning ring-2 ring-warning ring-offset-2 ring-offset-base-100'
                : isSuggested
                    ? 'border-info bg-info/5'
                    : 'border-primary'
        }`}
    >
        {/* NOW PLAYING Banner for IN_PROGRESS */}
        {schedule.status === 'IN_PROGRESS' && (
            <div className="mb-3 flex items-center gap-2">
                <span className="text-xl">🔊</span>
                <span className="badge badge-warning font-bold uppercase">
                    {t('schedule.now_playing')}
                </span>
            </div>
        )}

        {/* Schedule Header */}
        <div className="flex items-start gap-3 mb-3">
            {/* Order Badge */}
            {/* only show order badge if isSuggested */}

            {!isSuggested && (
                <div
                className={`badge font-bold min-w-fit ${isSuggested ? 'badge-info' : 'badge-neutral'}`}
            >
                {schedule.order}
            </div>)}

            {/* Song Info */}
            <div className="flex-1 min-w-0 truncate">
                <p>
                    <span className="font-semibold text-xl">{schedule.music?.title || t('schedule.song_tba')}</span>
                    <span
                        className="text-sm text-base-content/70 ml-1">{t('common.by')} {schedule.music?.artist || t('schedule.artist_tba')}</span>
                </p>

                <InstrumentBadges
                    neededDrums={neededDrums}
                    neededGuitars={neededGuitars}
                    neededVocals={neededVocals}
                    neededBass={neededBass}
                    neededKeys={neededKeys}
                    duration={duration}
                />
            </div>


            {/* Status Badge and Enroll Button */}
            <div className="flex flex-col gap-2 items-end">
            <span
                className={`badge badge-md ${getStatusColor(schedule.status, isSuggested)}`}
            >
              {getStatusIcon(schedule.status, isSuggested) && `${getStatusIcon(schedule.status, isSuggested)} `}
                {getStatusLabel(schedule.status, isSuggested, t)}
            </span>
                {userRegisteredForSchedule ? (
                    <span className="badge badge-success gap-2 px-4 py-3">
                        <CheckCircle className="w-3 h-3" />
                        {t('schedule.already_enrolled')}
                    </span>
                ) : (
                    <button
                        onClick={onEnrollClick}
                        className="btn btn-sm btn-primary font-semibold gap-2"
                    >
                        🎵 {t('schedule.enroll_btn')}
                    </button>
                )}
            </div>
        </div>

        {/* Musicians Registered */}
        <RegistrationList
            registrations={schedule.registrations}
            showActions={false}
            neededDrums={schedule.music?.neededDrums}
            neededGuitars={schedule.music?.neededGuitars}
            neededBass={schedule.music?.neededBass}
            neededVocals={schedule.music?.neededVocals}
            neededKeys={schedule.music?.neededKeys}
        />
    </div>)
})

