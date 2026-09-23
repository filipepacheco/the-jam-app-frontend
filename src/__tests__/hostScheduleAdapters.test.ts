import {describe, expect, it, vi} from 'vitest'
import type {JamResponseDto} from '../types/api.types'

const services = vi.hoisted(() => ({
  updateJamMusic: vi.fn(),
  updatePerformance: vi.fn(),
  createPerformance: vi.fn(),
  removePerformance: vi.fn(),
  updateRegistration: vi.fn(),
  removeRegistration: vi.fn(),
}))

vi.mock('../services', () => ({
  musicService: {updateJamMusic: services.updateJamMusic},
  scheduleService: {
    update: services.updatePerformance,
    create: services.createPerformance,
    remove: services.removePerformance,
  },
  registrationService: {
    update: services.updateRegistration,
    remove: services.removeRegistration,
  },
}))

import {createHostScheduleOperationsAdapter, mapJamToHostScheduleSnapshot} from '../lib/schedule/hostScheduleAdapters'
import {mapJamToParticipationContext} from '../lib/jam-participation/jamParticipationAdapters'

const jam: JamResponseDto = {
  id: 'jam-1',
  name: 'Test jam',
  hostName: 'Host',
  status: 'ACTIVE',
  createdAt: '2026-09-24T18:00:00.000Z',
  updatedAt: '2026-09-24T18:00:00.000Z',
  schedules: [],
  jamMusics: [],
}

describe('Host Schedule production operations adapter', () => {
  it('maps a resolved API failure to a controller failure', async () => {
    services.updateJamMusic.mockResolvedValue({success: false, data: null, error: 'Not allowed'})
    const operations = createHostScheduleOperationsAdapter(vi.fn().mockResolvedValue(jam))

    await expect(operations.updateNotes({
      jamId: 'jam-1',
      jamMusicId: 'jam-music-1',
      notes: 'Lower key',
    })).resolves.toEqual({ok: false, error: {message: 'Not allowed'}})
  })

  it('maps refreshed backend data into an authoritative controller snapshot', async () => {
    const operations = createHostScheduleOperationsAdapter(vi.fn().mockResolvedValue(jam))

    await expect(operations.refresh('jam-1')).resolves.toEqual({
      ok: true,
      snapshot: {jamId: 'jam-1', performances: []},
    })
  })

  it('omits withdrawn registrations from the schedule snapshot', () => {
    const snapshot = mapJamToHostScheduleSnapshot({
      ...jam,
      schedules: [{
        id: 'schedule-1', jamId: 'jam-1', musicId: 'music-1', order: 1, status: 'SCHEDULED',
        createdAt: '2026-09-24T18:00:00.000Z',
        music: {id: 'music-1', title: 'Song', artist: 'Artist', createdAt: '2026-09-24T18:00:00.000Z'},
        registrations: [
          {id: 'active', musicianId: 'musician-1', jamId: 'jam-1', instrument: 'guitars', status: 'APPROVED'},
          {id: 'withdrawn', musicianId: 'musician-2', jamId: 'jam-1', instrument: 'vocals', status: 'WITHDRAWN'},
        ],
      }],
    })

    expect(snapshot.performances[0].registrations.map(({id}) => id)).toEqual(['active'])
  })

  it('retains withdrawn registrations for musician participation', () => {
    const participation = mapJamToParticipationContext({
      jam: {
        ...jam,
        schedules: [{
          id: 'schedule-1', jamId: 'jam-1', musicId: 'music-1', order: 1, status: 'SCHEDULED',
          createdAt: '2026-09-24T18:00:00.000Z',
          music: {id: 'music-1', title: 'Song', artist: 'Artist', createdAt: '2026-09-24T18:00:00.000Z'},
          registrations: [{id: 'withdrawn', musicianId: 'musician-1', jamId: 'jam-1', instrument: 'guitars', status: 'WITHDRAWN'}],
        }],
      },
      isAuthenticated: true,
      musicianId: 'musician-1',
    })

    expect(participation.performances[0].registrations).toMatchObject([{id: 'withdrawn', status: 'WITHDRAWN'}])
  })
})
