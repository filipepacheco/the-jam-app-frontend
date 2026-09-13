import type {JamResponseDto} from '../../types/api.types'
import {musicService, registrationService, scheduleService} from '../../services'
import {canUseNativeShare, copyToClipboard, nativeShare, shareViaWhatsApp} from '../../utils/shareUtils'
import {mapJamToHostScheduleSnapshot} from '../schedule/hostScheduleAdapters'
import type {
  JamParticipationContext,
  JamParticipationOperationsPort,
  ParticipationMutationResult,
  ParticipationSharePort,
} from './jamParticipationController'

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

function mutationResult(response: {success: boolean; error?: string}): ParticipationMutationResult {
  return response.success
    ? {ok: true}
    : {ok: false, error: response.error ? {message: response.error} : {message: '', reason: 'unknown'}}
}

export function createJamParticipationOperationsAdapter({
  reloadJam,
  getIdentity,
}: {
  reloadJam: () => Promise<JamResponseDto | null | undefined>
  getIdentity: () => {isAuthenticated: boolean; musicianId: string | null}
}): JamParticipationOperationsPort {
  return {
    async register({musicianId, performanceId, instrument}) {
      return mutationResult(await registrationService.create({musicianId, scheduleId: performanceId, instrument}))
    },
    async suggest({jamId, musicId}) {
      return mutationResult(await scheduleService.create({jamId, musicId, order: 0, status: 'SUGGESTED'}))
    },
    async createMusic(data) {
      const response = await musicService.create(data)
      if (!response.success || !response.data) {
        return {ok: false, error: response.error ? {message: response.error} : {message: '', reason: 'unknown'}}
      }
      return {ok: true, musicId: response.data.id}
    },
    async refresh() {
      const jam = await reloadJam()
      if (!jam) return {ok: false, error: {message: '', reason: 'unknown'}}
      const identity = getIdentity()
      return {ok: true, context: mapJamToParticipationContext({jam, ...identity})}
    },
  }
}

export const participationShareAdapter: ParticipationSharePort = {
  canNativeShare: canUseNativeShare,
  copy: copyToClipboard,
  whatsapp({url, message}) { shareViaWhatsApp(url, message) },
  native({title, url}) { return nativeShare(title, url) },
}
