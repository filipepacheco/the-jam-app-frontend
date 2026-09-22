import {describe, expect, it} from 'vitest'
import type {ScheduleResponseDto} from '../types/api.types'
import {
  countActiveRegistrationsByInstrument,
  getInstrumentOptions,
} from '../utils/scheduleUtils'

const schedule: ScheduleResponseDto = {
  id: 'schedule-1',
  jamId: 'jam-1',
  musicId: 'music-1',
  order: 1,
  status: 'SCHEDULED',
  createdAt: '2026-09-22T00:00:00.000Z',
  music: {
    id: 'music-1',
    title: 'Song',
    artist: 'Artist',
    neededDrums: 1,
    createdAt: '2026-09-22T00:00:00.000Z',
  },
  registrations: [
    {id: 'withdrawn-guitar', musicianId: 'musician-1', jamId: 'jam-1', instrument: 'guitars', status: 'WITHDRAWN'},
    {id: 'withdrawn-vocals', musicianId: 'musician-2', jamId: 'jam-1', instrument: 'vocals', status: 'WITHDRAWN'},
    {id: 'withdrawn-keys', musicianId: 'musician-3', jamId: 'jam-1', instrument: 'keys', status: 'WITHDRAWN'},
  ],
}

describe('schedule registration capacity', () => {
  it('keeps three guitar and vocal places plus one keys/piano place available by default', () => {
    const options = getInstrumentOptions(schedule, (key) => key)

    expect(options).toEqual(expect.arrayContaining([
      expect.objectContaining({key: 'guitars', needed: 3, registered: 0}),
      expect.objectContaining({key: 'vocals', needed: 3, registered: 0}),
      expect.objectContaining({key: 'keys', needed: 1, registered: 0}),
    ]))
  })

  it('does not count withdrawn registrations toward schedule capacity', () => {
    expect(countActiveRegistrationsByInstrument(schedule.registrations)).toEqual({
      counts: {},
      activeCount: 0,
    })
  })

  it('counts piano registrations against the shared keys capacity', () => {
    const pianoSchedule: ScheduleResponseDto = {
      ...schedule,
      registrations: [
        {id: 'piano-player', musicianId: 'musician-4', jamId: 'jam-1', instrument: 'piano', status: 'APPROVED'},
      ],
    }

    expect(getInstrumentOptions(pianoSchedule, (key) => key)).toEqual(expect.arrayContaining([
      expect.objectContaining({key: 'keys', needed: 1, registered: 1}),
    ]))
  })
})
