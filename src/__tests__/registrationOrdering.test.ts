import {describe, expect, it} from 'vitest'
import type {ScheduleResponseDto, ScheduleStatus} from '../types/api.types'
import {createLiveQueueController, type LiveQueueSnapshot} from '../lib/live-queue/liveQueueController'
import {orderSchedulesByRegistrations} from '../utils/scheduleUtils'
import {shortMusicianName} from '../utils/musicianUtils'

function schedule(id: string, order: number, signups: number, status: ScheduleStatus = 'SCHEDULED'): ScheduleResponseDto {
  return {
    id,
    jamId: 'jam-1',
    musicId: `music-${id}`,
    order,
    status,
    createdAt: '2026-11-07T00:00:00.000Z',
    registrations: [
      ...Array.from({length: signups}, (_, index) => ({
        id: `${id}-reg-${index}`, musicianId: `m-${index}`, jamId: 'jam-1', instrument: 'vocals', status: 'APPROVED',
      })),
      {id: `${id}-withdrawn`, musicianId: 'm-x', jamId: 'jam-1', instrument: 'vocals', status: 'WITHDRAWN'},
    ],
  }
}

describe('shortMusicianName', () => {
  it.each([
    ['Thiago Pacheco', 'Thiago P.'],
    ['  tiago da silva ', 'tiago S.'],
    ['Tiago', 'Tiago'],
    ['', ''],
    [null, ''],
  ])('formats %j as %j', (name, expected) => {
    expect(shortMusicianName(name)).toBe(expected)
  })
})

describe('orderSchedulesByRegistrations', () => {
  it('puts songs with more active sign-ups first, host order breaking ties', () => {
    const ordered = orderSchedulesByRegistrations([
      schedule('c', 3, 2),
      schedule('a', 1, 1),
      schedule('b', 2, 2),
      schedule('d', 4, 0),
    ])
    expect(ordered.map(({id}) => id)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('keeps played and playing songs in their slots', () => {
    const ordered = orderSchedulesByRegistrations([
      schedule('done', 1, 0, 'COMPLETED'),
      schedule('live', 2, 0, 'IN_PROGRESS'),
      schedule('few', 3, 1),
      schedule('many', 4, 3),
    ])
    expect(ordered.map(({id}) => id)).toEqual(['done', 'live', 'many', 'few'])
  })
})

describe('Live Queue sortByRegistrations', () => {
  const musicians = (count: number) => Array.from({length: count}, (_, index) => ({id: `m-${index}`, name: null, instrument: 'vocals'}))
  const snapshot: LiveQueueSnapshot = {
    jamId: 'jam-1',
    currentPerformance: null,
    previousPerformances: [
      {id: 'done', order: 1, status: 'COMPLETED', music: {title: 'Done', artist: 'A'}, musicians: musicians(0)},
    ],
    upcomingPerformances: [
      {id: 'a', order: 2, status: 'SCHEDULED', music: {title: 'A', artist: 'A'}, musicians: musicians(1)},
      {id: 'b', order: 3, status: 'SCHEDULED', music: {title: 'B', artist: 'B'}, musicians: musicians(3)},
      {id: 'c', order: 4, status: 'SCHEDULED', music: {title: 'C', artist: 'C'}, musicians: musicians(2)},
    ],
    suggestedPerformances: [],
    jamStatus: 'ACTIVE',
    playbackState: 'STOPPED',
  }

  it('reorders the draft only inside a reorder session', () => {
    const controller = createLiveQueueController({initialSnapshot: snapshot})
    controller.commands.sortByRegistrations()
    expect(controller.getSnapshot().draftPerformances.map(({id}) => id)).toEqual(['done', 'a', 'b', 'c'])

    controller.commands.beginReorder()
    controller.commands.sortByRegistrations()
    expect(controller.getSnapshot().draftPerformances.map(({id, order}) => [id, order])).toEqual([
      ['done', 1], ['b', 2], ['c', 3], ['a', 4],
    ])
  })
})
