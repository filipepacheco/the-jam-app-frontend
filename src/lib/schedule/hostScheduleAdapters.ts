import {musicService} from '../../services'
import type {
  JamResponseDto,
  MusicResponseDto,
  MusicianResponseDto,
  RegistrationResponseDto,
  ScheduleResponseDto,
} from '../../types/api.types'
import type {
  HostScheduleSnapshot,
  Music,
  MusicCataloguePort,
  Musician,
  Performance,
  PerformanceRegistration,
} from './hostScheduleController'

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
