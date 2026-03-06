/**
 * Schedule Card Component
 * Displays a single schedule entry with all controls and nested registrations
 */

import type {ScheduleResponseDto} from '../../types/api.types'
import {ScheduleStatusBadge} from './ScheduleStatusBadge'
import {SongInfo} from './SongInfo'
import {ScheduleActionButtons} from './ScheduleActionButtons'
import {RegistrationList} from './RegistrationList'

interface ScheduleCardProps {
    schedule: ScheduleResponseDto
    index?: number
    loading?: boolean
    isSuggested?: boolean
    onStatusChange?: (scheduleId: string, status: string) => void
    onDelete?: (scheduleId: string) => void
    onApproveRegistration?: (registrationId: string) => void
    onRejectRegistration?: (registrationId: string) => void
    onDeleteRegistration?: (registrationId: string) => void
    onAddMusician?: () => void
    onMusicianClick?: (musicianId: string) => void
}

export function ScheduleCardManagement({
                                           schedule,
                                           loading = false,
                                           isSuggested = false,
                                           onStatusChange,
                                           onDelete,
                                           onApproveRegistration,
                                           onRejectRegistration,
                                           onDeleteRegistration,
                                           onAddMusician,
                                           onMusicianClick,
                                       }: ScheduleCardProps) {
    return (
        <div
            className={`card shadow ${
                schedule.status === 'IN_PROGRESS'
                    ? 'bg-warning/10 border-2 border-warning'
                    : isSuggested
                        ? 'bg-info/5 border-2 border-info'
                        : 'bg-base-200'
            }`}
        >
            <div className="card-body p-3 sm:p-5">
                {/* Schedule Header */}
                <div className="flex items-start gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                    {/* Order Badge */}
                    {!isSuggested && (
                        <div
                            className={`badge badge-md font-bold text-sm sm:text-base px-3 sm:px-4 py-2 mt-auto mb-auto badge-info`}
                        >
                            #{schedule.order}
                        </div>
                    )}

                    {/* Song Info */}
                    <div className="flex-1 min-w-0 mt-auto mb-auto">
                        <SongInfo
                            music={schedule.music}
                        />
                    </div>

                    {/* Status Badge and Actions - Right side */}
                    <div className="ml-auto flex flex-col gap-1 sm:gap-2 items-end">
                        <ScheduleStatusBadge status={schedule.status}/>
                        <ScheduleActionButtons
                            status={schedule.status}
                            loading={loading}
                            isSuggested={isSuggested}
                            onStatusChange={(status) => onStatusChange?.(schedule.id, status)}
                            onDelete={() => onDelete?.(schedule.id)}
                        />
                    </div>
                </div>


                {/* Registrations and Actions - Same Row */}
                <div className="flex">
                    {/* Registration List - Left side */}
                    <div className="flex-1">
                        <RegistrationList
                            registrations={schedule.registrations}
                            loading={loading}
                            onApprove={onApproveRegistration}
                            onReject={onRejectRegistration}
                            onDelete={onDeleteRegistration}
                            showActions={true}
                            onAddMusician={onAddMusician}
                            onMusicianClick={onMusicianClick}
                            neededDrums={schedule.music?.neededDrums}
                            neededGuitars={schedule.music?.neededGuitars}
                            neededBass={schedule.music?.neededBass}
                            neededVocals={schedule.music?.neededVocals}
                            neededKeys={schedule.music?.neededKeys}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

