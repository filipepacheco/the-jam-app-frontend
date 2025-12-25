/**
 * Schedule Card Component
 * Displays a single schedule entry with all controls and nested registrations
 */

import type {ScheduleResponseDto} from '../../types/api.types'
import {ScheduleStatusBadge} from './ScheduleStatusBadge'
import {SongInfo} from './SongInfo'
import {ScheduleActionButtons} from './ScheduleActionButtons'
import {RegistrationList} from './RegistrationList'
import {useTranslation} from 'react-i18next'

interface ScheduleCardProps {
  schedule: ScheduleResponseDto
  index?: number
  loading?: boolean
  isSuggested?: boolean
  onStatusChange?: (scheduleId: string, status: string) => void
  onDelete?: (scheduleId: string) => void
  onMoveUp?: (index: number) => void
  onMoveDown?: (index: number) => void
  maxIndex?: number
  onApproveRegistration?: (registrationId: string) => void
  onRejectRegistration?: (registrationId: string) => void
  onAddMusician?: () => void
}

export function ScheduleCardManagement({
  schedule,
  index = 0,
  loading = false,
  isSuggested = false,
  onStatusChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  maxIndex = 0,
  onApproveRegistration,
  onRejectRegistration,
  onAddMusician,
}: ScheduleCardProps) {
    const { t } = useTranslation()
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
            <div className="card-body p-2 sm:p-4">
                {/* Schedule Header */}
                <div className="flex items-start gap-1 sm:gap-3 flex-wrap sm:flex-nowrap">
                    {/* Reorder Buttons (not shown for suggested) */}
                    {!isSuggested && (
                        <>
                            <div className="flex flex-col gap-0.5 sm:gap-1 mt-auto mb-auto">
                                <button
                                    onClick={() => onMoveUp?.(index)}
                                    disabled={index === 0 || loading}
                                    className="btn btn-xs btn-ghost text-xs"
                                    title={t('schedule.actions.move_up')}
                                >
                                    ▲
                                </button>
                                <button
                                    onClick={() => onMoveDown?.(index)}
                                    disabled={index === maxIndex || loading}
                                    className="btn btn-xs btn-ghost text-xs"
                                    title={t('schedule.actions.move_down')}
                                >
                                    ▼
                                </button>
                            </div>
                            {/* Order Badge */}
                            <div
                                className={`badge badge-sm sm:badge-md font-bold text-sm sm:text-lg px-2 sm:px-4 py-1 sm:py-5 mt-auto mb-auto ${
                                    isSuggested ? 'badge-info' : 'badge-info'
                                }`}
                            >
                                {schedule.order}
                            </div>

                        </>

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
                        {isSuggested && (
                            <ScheduleActionButtons
                                status={schedule.status}
                                loading={loading}
                                isSuggested={true}
                                onStatusChange={(status) => onStatusChange?.(schedule.id, status)}
                                onDelete={() => onDelete?.(schedule.id)}
                            />
                        )}
                        {!isSuggested && (
                            <ScheduleActionButtons
                                status={schedule.status}
                                loading={loading}
                                onStatusChange={(status) => onStatusChange?.(schedule.id, status)}
                                onDelete={() => onDelete?.(schedule.id)}
                            />
                        )}
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
                            showActions={true}
                            onAddMusician={onAddMusician}
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

