import type { RegistrationResponseDto, ScheduleResponseDto } from '../types/api.types'
import { scheduleFixtures } from './jamMusicFixtures'

const approved = scheduleFixtures[1].registrations?.[0]

export const pendingRegistration: RegistrationResponseDto = {
  ...approved!,
  id: 'registration-pending-guitar',
  instrument: 'guitars',
  status: 'PENDING',
  musician: {
    ...approved!.musician!,
    id: 'musician-pending-guitar',
    name: 'Alexandra de la Cruz with an intentionally long stage name',
    instrument: 'guitars',
  },
}

export const scheduleWorkbenchFixtures = {
  empty: { ...scheduleFixtures[0], registrations: [] },
  pending: {
    ...scheduleFixtures[0],
    registrations: [pendingRegistration],
  },
  approved: scheduleFixtures[1],
  completed: scheduleFixtures[2],
  suggested: scheduleFixtures[3],
} satisfies Record<string, ScheduleResponseDto>

export const scheduleWorkbenchCoverage = [
  { id: 'ui.0026', disposition: 'story', owner: '#33' },
  { id: 'ui.0100', disposition: 'story' },
  { id: 'ui.0101', disposition: 'exempt', reason: 'Internal search and multi-registration mutations need an injectable service seam.' },
  { id: 'ui.0102', disposition: 'story' },
  { id: 'ui.0103', disposition: 'story' },
  { id: 'ui.0104', disposition: 'story' },
  { id: 'ui.0105', disposition: 'story', owner: 'parent' },
  { id: 'ui.0106', disposition: 'story', owner: 'parent' },
  { id: 'ui.0107', disposition: 'story' },
  { id: 'ui.0108', disposition: 'story' },
  { id: 'ui.0109', disposition: 'story', owner: '#33' },
  { id: 'ui.0110', disposition: 'story' },
  { id: 'ui.0111', disposition: 'story' },
  { id: 'ui.0113', disposition: 'story' },
  { id: 'ui.0115', disposition: 'story' },
  { id: 'ui.0117', disposition: 'story' },
  { id: 'ui.0118', disposition: 'story' },
  { id: 'ui.0119', disposition: 'story' },
  { id: 'ui.0120', disposition: 'story' },
  { id: 'ui.0121', disposition: 'story' },
  { id: 'ui.0122', disposition: 'story' },
  { id: 'ui.0145', disposition: 'exempt', reason: 'Route composition is catalogued by #39.' },
  { id: 'ui.0146', disposition: 'exempt', reason: 'Route composition is catalogued by #39.' },
  { id: 'ui.0162', disposition: 'exempt', reason: 'Route composition is catalogued by #39.' },
  { id: 'ui.0163', disposition: 'exempt', reason: 'Route composition is catalogued by #39.' },
] as const
