import type {JamResponseDto} from '../../types/api.types'
import {mapJamToHostScheduleSnapshot} from '../schedule/hostScheduleAdapters'
import type {JamParticipationContext} from './jamParticipationController'

export function mapJamToParticipationContext({
  jam,
  isAuthenticated,
  musicianId,
}: {
  jam: JamResponseDto
  isAuthenticated: boolean
  musicianId: string | null
}): JamParticipationContext {
  return {
    jamId: jam.id,
    participationOpen: jam.status !== 'FINISHED' && jam.status !== 'INACTIVE',
    isAuthenticated,
    musicianId,
    performances: mapJamToHostScheduleSnapshot(jam).performances,
  }
}
