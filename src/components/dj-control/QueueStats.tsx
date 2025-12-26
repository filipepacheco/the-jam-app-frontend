/**
 * Queue Stats Component
 * Displays statistics about the song queue
 */

import type {ScheduleResponseDto} from '../../types/api.types'

interface QueueStatsProps {
    schedules: ScheduleResponseDto[]
}

export function QueueStats({schedules}: QueueStatsProps) {
    const totalSongs = schedules.length
    const completedCount = schedules.filter(s => s.status === 'COMPLETED').length
    const scheduledCount = schedules.filter(s => s.status === 'SCHEDULED').length
    const suggestedCount = schedules.filter(s => s.status === 'SUGGESTED').length
    const currentCount = schedules.filter(s => s.status === 'IN_PROGRESS').length

    // Calculate total duration
    const totalDuration = schedules.reduce((acc, schedule) => {
        return acc + (schedule.music?.duration || 0)
    }, 0)

    const remainingDuration = schedules
        .filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS')
        .reduce((acc, schedule) => {
            return acc + (schedule.music?.duration || 0)
        }, 0)

    return (
        <div className="space-y-4">
            {/* Main Stats Card */}
            <div className="card bg-linear-to-br from-primary/10 to-secondary/10 shadow">
                <div className="card-body p-4">
                    <h3 className="font-bold text-lg mb-4">📊 Queue Stats</h3>

                    <div className="space-y-3">
                        {/* Total Songs */}
                        <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                            <span className="text-sm font-medium">Total Songs</span>
                            <span className="badge badge-lg badge-primary">{totalSongs}</span>
                        </div>

                        {/* Completed */}
                        <div className="flex justify-between items-center p-2">
                            <span className="text-xs">✓ Completed</span>
                            <span className="text-xs font-bold">{completedCount}</span>
                        </div>

                        {/* Current */}
                        {currentCount > 0 && (
                            <div className="flex justify-between items-center p-2">
                                <span className="text-xs">▶ Now Playing</span>
                                <span className="text-xs font-bold">{currentCount}</span>
                            </div>
                        )}

                        {/* Remaining */}
                        <div className="flex justify-between items-center p-2">
                            <span className="text-xs">• Upcoming</span>
                            <span className="text-xs font-bold">{scheduledCount}</span>
                        </div>

                        {/* Suggested */}
                        {suggestedCount > 0 && (
                            <div className="flex justify-between items-center p-2">
                                <span className="text-xs">⚠ Suggested</span>
                                <span className="text-xs font-bold">{suggestedCount}</span>
                            </div>
                        )}
                    </div>
                    <hr className="my-4 border-base-300"/>
                    <div className="flex justify-between text-sm">
                        <h3 className="font-bold text-sm">⏱️ Duration</h3>
                        <span className="font-bold">{formatTime(totalDuration)}</span>
                    </div>
                    <progress
                        className="progress progress-primary"
                        value={totalDuration ? (totalDuration - remainingDuration) / totalDuration * 100 : 0}
                        max="100"
                    ></progress>
                    <div className="flex justify-between text-xs text-base-content/70">
                        <span>Remaining</span>
                        <span>{formatTime(remainingDuration)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function formatTime(seconds: number): string {
    if (seconds === 0) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

