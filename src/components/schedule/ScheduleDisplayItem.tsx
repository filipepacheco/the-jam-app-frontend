/**
 * Schedule Display Item Component
 * Displays a single schedule item for public viewing (JamDetailPage)
 */

import type {ScheduleResponseDto} from '../../types/api.types'
import {RegistrationList} from './RegistrationList'
import {formatDuration} from '../../lib/formatters'

interface ScheduleDisplayItemProps {
    schedule: ScheduleResponseDto
    isSuggested?: boolean
    userRegisteredForSchedule?: boolean
    onEnrollClick?: () => void
}

const getStatusColor = (status: string | undefined, isSuggested: boolean): string => {
    if (isSuggested) return 'badge-info'
    switch (status) {
        case 'SCHEDULED':
            return 'badge-primary'
        case 'IN_PROGRESS':
            return 'badge-warning'
        case 'APPROVED':
        case 'COMPLETED':
            return 'badge-success'
        case 'CANCELED':
            return 'badge-error'
        default:
            return 'badge-outline'
    }
}

export const getStatusLabel = (status: string | undefined, isSuggested: boolean): string => {
    if (isSuggested) return 'Suggested'
    switch (status) {
        case 'APPROVED':
            return 'Approved'
        case 'SCHEDULED':
            return 'Scheduled'
        case 'IN_PROGRESS':
            return 'In Progress'
        case 'COMPLETED':
            return 'Completed'
        case 'CANCELED':
            return 'Canceled'
        default:
            return 'Pending'
    }
}

export const getStatusIcon = (status: string | undefined, isSuggested: boolean): string => {
    if (isSuggested) return '✨'
    switch (status) {
        case 'PENDING':
            return '⏳'
        case 'APPROVED':
        case 'SCHEDULED':
            return '📅'
        case 'IN_PROGRESS':
            return '🎵'
        case 'COMPLETED':
            return '✓'
        case 'CANCELED':
            return '✕'
        default:
            return ''
    }
}

export function ScheduleDisplayItem({
                                        schedule, isSuggested = false, userRegisteredForSchedule = false, onEnrollClick,
                                    }: ScheduleDisplayItemProps) {

    const {
        music
    } = schedule || {}

    const {
        neededDrums = 0, duration = 0, neededGuitars = 0, neededVocals = 0, neededBass = 0, neededKeys = 0
    } = music || {}


    return (<div
        className={`border-l-4 ${isSuggested ? 'border-info bg-info/5' : 'border-primary'} pl-4 py-2 rounded`}
    >
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
                    <span className="font-semibold text-xl">{schedule.music?.title || 'Song TBA'}</span>
                    <span
                        className="text-sm text-base-content/70 ml-1">by {schedule.music?.artist || 'Artist TBA'}</span>
                </p>

                <div className="flex flex-wrap gap-1 mt-1">
                    {duration && (<span
                        className="badge badge-sm"> ⏱️ {formatDuration(duration)} </span>)}
                    {neededDrums > 0 && (<span className="badge badge-sm">🥁 {neededDrums}</span>)}
                    {neededGuitars > 0 && (<span className="badge badge-sm">🎸 {neededGuitars}</span>)}
                    {neededVocals > 0 && (<span className="badge badge-sm">🎤 {neededVocals}</span>)}
                    {neededBass > 0 && (<span className="badge badge-sm">🎸 {neededBass}</span>)}
                    {neededKeys > 0 && (<span className="badge badge-sm">🎹 {neededKeys}</span>)}
                </div>
            </div>


            {/* Status Badge and Enroll Button */}
            <div className="flex flex-col gap-2 items-end">
            <span
                className={`badge badge-md ${getStatusColor(schedule.status, isSuggested)}`}
            >
              {getStatusIcon(schedule.status, isSuggested) && `${getStatusIcon(schedule.status, isSuggested)} `}
                {getStatusLabel(schedule.status, isSuggested)}
            </span>
                <button
                    onClick={onEnrollClick}
                    className={`btn btn-sm ${userRegisteredForSchedule ? 'btn-success btn-disabled' : 'btn-primary'}`}
                    disabled={userRegisteredForSchedule}
                >
                    {userRegisteredForSchedule ? '✓ Already Enrolled' : '🎵 Enroll'}
                </button>
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
}

