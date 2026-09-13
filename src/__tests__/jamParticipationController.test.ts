import {describe, expect, it} from 'vitest'
import {
  createJamParticipationController,
  type JamParticipationContext,
} from '../lib/jam-participation/jamParticipationController'
import type {Performance} from '../lib/schedule/hostScheduleController'

function performance(id: string, status: Performance['status'] = 'SCHEDULED'): Performance {
  return {
    id, jamId: 'jam-1', musicId: `music-${id}`, order: 1, status, createdAt: '2026-01-01',
    music: {id: `music-${id}`, title: id, artist: 'Artist', createdAt: '2026-01-01'},
    registrations: [],
  }
}

function context(overrides: Partial<JamParticipationContext> = {}): JamParticipationContext {
  return {
    jamId: 'jam-1',
    participationOpen: true,
    isAuthenticated: true,
    musicianId: 'musician-1',
    performances: [performance('eligible')],
    ...overrides,
  }
}

describe('Jam participation controller eligibility and overlays', () => {
  it('excludes Suggestions, non-enrollable Performances, and existing registrations', () => {
    const registered = performance('registered')
    registered.registrations = [{
      id: 'registration-1', musicianId: 'musician-1', jamId: 'jam-1',
      instrument: 'vocals', createdAt: '2026-01-01',
    }]
    const controller = createJamParticipationController(context({performances: [
      performance('eligible'),
      performance('suggestion', 'SUGGESTED'),
      performance('completed', 'COMPLETED'),
      performance('cancelled', 'CANCELED'),
      performance('playing', 'IN_PROGRESS'),
      registered,
    ]}))

    expect(controller.getSnapshot().eligiblePerformances.map(({id}) => id)).toEqual(['eligible'])
  })

  it('uses the same eligibility projection for the single shortcut and multi picker', () => {
    const single = createJamParticipationController(context({performances: [
      performance('eligible'), performance('suggestion', 'SUGGESTED'),
    ]}))
    expect(single.commands.beginRegistration()).toEqual({code: 'ready', intent: 'registration', performanceId: 'eligible'})
    expect(single.getSnapshot()).toMatchObject({activeOverlay: 'enrollment', selectedPerformanceId: 'eligible'})

    const multi = createJamParticipationController(context({performances: [performance('first'), performance('second')]}))
    expect(multi.commands.beginRegistration()).toEqual({code: 'choose_performance', eligibleIds: ['first', 'second']})
    expect(multi.getSnapshot().activeOverlay).toBe('performance_picker')
    multi.commands.choosePerformance('second')
    expect(multi.getSnapshot()).toMatchObject({activeOverlay: 'enrollment', selectedPerformanceId: 'second'})
  })

  it('exposes authentication-required intent without opening a protected overlay', () => {
    const controller = createJamParticipationController(context({isAuthenticated: false, musicianId: null}))

    expect(controller.commands.beginSuggestion()).toEqual({
      code: 'auth_required', intent: 'suggestion', redirect: '/jams/jam-1',
    })
    expect(controller.getSnapshot()).toMatchObject({activeOverlay: 'none', authRequired: {intent: 'suggestion', redirect: '/jams/jam-1'}})
  })

  it('owns deterministic overlay transitions and clears selection when enrollment closes', () => {
    const controller = createJamParticipationController(context())

    controller.commands.beginRegistration('eligible')
    controller.commands.closeOverlay()
    expect(controller.getSnapshot()).toMatchObject({activeOverlay: 'none', selectedPerformanceId: null})

    controller.commands.beginSuggestion()
    controller.commands.beginNewMusic()
    expect(controller.getSnapshot().activeOverlay).toBe('new_music')
    controller.commands.beginShare()
    expect(controller.getSnapshot().activeOverlay).toBe('share')
  })

  it('closes participation when the Jam is not accepting registrations', () => {
    const controller = createJamParticipationController(context({participationOpen: false}))

    expect(controller.getSnapshot().eligiblePerformances).toEqual([])
    expect(controller.commands.beginRegistration()).toEqual({code: 'unavailable', intent: 'registration'})
  })
})
