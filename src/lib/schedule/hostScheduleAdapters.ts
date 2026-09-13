import {musicService, registrationService, scheduleService} from '../../services'
import type {
  ApiResponse,
  JamResponseDto,
  MusicResponseDto,
  MusicianResponseDto,
  RegistrationResponseDto,
  ScheduleResponseDto,
} from '../../types/api.types'
import type {
  HostScheduleSnapshot,
  HostScheduleOperationsPort,
  Music,
  MusicCataloguePort,
  Musician,
  Performance,
  PerformanceRegistration,
} from './hostScheduleController'

function mapMutationResponse(response: ApiResponse<unknown>) {
  return response.success
    ? {ok: true as const}
    : {ok: false as const, error: {message: response.error ?? response.message ?? 'Operation failed'}}
}

function mapMusic(music: MusicResponseDto): Music {
  const {registrations: _registrations, schedules: _schedules, ...domainMusic} = music
  return domainMusic
}

function mapMusician(musician: MusicianResponseDto): Musician {
  return {...musician}
}

function mapRegistration(registration: RegistrationResponseDto): PerformanceRegistration {
  return {
    ...registration,
    ...(registration.musician ? {musician: mapMusician(registration.musician)} : {}),
  }
}

function mapPerformance(
  schedule: ScheduleResponseDto,
  jamMusicByMusicId: ReadonlyMap<string, {id: string; notes?: string | null}>,
): Performance {
  const jamMusic = jamMusicByMusicId.get(schedule.musicId)
  return {
    ...schedule,
    music: mapMusic(schedule.music),
    registrations: (schedule.registrations ?? []).map(mapRegistration),
    ...(schedule.registration ? {registration: mapRegistration(schedule.registration)} : {}),
    ...(jamMusic ? {jamMusic} : {}),
  }
}

export function mapJamToHostScheduleSnapshot(jam: JamResponseDto): HostScheduleSnapshot {
  const jamMusicByMusicId = new Map(
    (jam.jamMusics ?? []).map(({id, musicId, notes}) => [musicId, {id, notes}]),
  )

  return {
    jamId: jam.id,
    performances: (jam.schedules ?? []).map((schedule) => mapPerformance(schedule, jamMusicByMusicId)),
  }
}

export const approvedMusicCatalogueAdapter: MusicCataloguePort = {
  async listApproved({skip, take}) {
    const response = await musicService.findAll(skip, take, 'APPROVED')
    return {
      items: (response.data ?? []).map(mapMusic),
      hasMore: response.meta.hasMore,
    }
  },
}

export function createHostScheduleOperationsAdapter(
  reloadJam: () => Promise<JamResponseDto | undefined>,
): HostScheduleOperationsPort {
  return {
    async updateNotes({jamId, jamMusicId, notes}) {
      return mapMutationResponse(await musicService.updateJamMusic(jamMusicId, jamId, {notes}))
    },
    async updatePerformance({performanceId, status, order}) {
      return mapMutationResponse(await scheduleService.update(performanceId, {
        status,
        ...(order === undefined ? {} : {order}),
      }))
    },
    async createPerformance({jamId, musicId, order}) {
      return mapMutationResponse(await scheduleService.create({jamId, musicId, order, status: 'SCHEDULED'}))
    },
    async removePerformance(performanceId) {
      return mapMutationResponse(await scheduleService.remove(performanceId))
    },
    async updateRegistration({registrationId, status}) {
      return mapMutationResponse(await registrationService.update(registrationId, {status}))
    },
    async removeRegistration(registrationId) {
      return mapMutationResponse(await registrationService.remove(registrationId))
    },
    async refresh() {
      const jam = await reloadJam()
      return jam
        ? {ok: true, snapshot: mapJamToHostScheduleSnapshot(jam)}
        : {ok: false, error: {message: 'Jam refresh returned no data'}}
    },
  }
}
