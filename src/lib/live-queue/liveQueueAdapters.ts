import {jamControlService} from '../../services'
import type {
  LiveStateResponseDto,
  LiveStateSongDto,
  ReorderQueueResponse,
  ScheduleOrderUpdate,
} from '../../types/jamControl.types'
import type {
  LiveQueueOperationsPort,
  LiveQueuePerformance,
  LiveQueueSnapshot,
} from './liveQueueController'

export interface LiveQueueTransport {
  getLiveState(jamId: string): Promise<{data: LiveStateResponseDto; status: number}>
  reorderQueue(jamId: string, updates: ScheduleOrderUpdate[]): Promise<ReorderQueueResponse>
}

function mapPerformance(song: LiveStateSongDto): LiveQueuePerformance {
  return {
    id: song.id,
    order: song.order,
    status: song.status,
    startedAt: song.startedAt,
    completedAt: song.completedAt,
    music: {...song.music},
    musicians: song.musicians.map((musician) => ({...musician})),
  }
}

export function mapLiveStateToLiveQueueSnapshot(
  jamId: string,
  liveState: LiveStateResponseDto,
): LiveQueueSnapshot {
  return {
    jamId,
    currentPerformance: liveState.currentSong ? mapPerformance(liveState.currentSong) : null,
    upcomingPerformances: liveState.nextSongs.map(mapPerformance),
    previousPerformances: liveState.previousSongs.map(mapPerformance),
    suggestedPerformances: liveState.suggestedSongs.map(mapPerformance),
    jamStatus: liveState.jamStatus,
    playbackState: liveState.playbackState,
  }
}

function message(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback
}

export function createLiveQueueOperationsAdapter(
  transport: LiveQueueTransport = jamControlService,
): LiveQueueOperationsPort {
  return {
    async reorder({jamId, performances}) {
      try {
        const response = await transport.reorderQueue(
          jamId,
          performances.map(({id, order}) => ({scheduleId: id, order})),
        )
        return response.success
          ? {ok: true}
          : {ok: false, error: {message: response.error?.message ?? 'Failed to reorder Live Queue'}}
      } catch (cause) {
        return {ok: false, error: {message: message(cause, 'Failed to reorder Live Queue')}}
      }
    },
    async refresh(jamId) {
      try {
        const response = await transport.getLiveState(jamId)
        return {ok: true, snapshot: mapLiveStateToLiveQueueSnapshot(jamId, response.data)}
      } catch (cause) {
        return {ok: false, error: {message: message(cause, 'Failed to refresh Live Queue')}}
      }
    },
  }
}
