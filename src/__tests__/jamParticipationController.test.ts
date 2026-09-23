import {describe, expect, it, vi} from 'vitest'
import {
  createJamParticipationController,
  type JamParticipationContext,
  type JamParticipationOperationsPort,
  type ParticipationClockPort,
  type ParticipationSharePort,
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

function operations(): JamParticipationOperationsPort {
  return {
    register: vi.fn().mockResolvedValue({ok: true}),
    withdrawRegistration: vi.fn().mockResolvedValue({ok: true}),
    suggest: vi.fn().mockResolvedValue({ok: true}),
    createMusic: vi.fn().mockResolvedValue({ok: true, musicId: 'new-music'}),
    refresh: vi.fn().mockResolvedValue({ok: true, context: context()}),
  }
}

function manualClock() {
  let callback: (() => void) | undefined
  let delay: number | undefined
  const clock: ParticipationClockPort = {
    schedule(nextDelay, nextCallback) { delay = nextDelay; callback = nextCallback; return () => { callback = undefined } },
  }
  return {clock, get delay() { return delay }, flush() { const next = callback; callback = undefined; next?.() }}
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((next) => { resolve = next })
  return {promise, resolve}
}

describe('Jam participation controller eligibility and overlays', () => {
  it('excludes non-enrollable Performances but permits another instrument registration', () => {
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

    expect(controller.getSnapshot().eligiblePerformances.map(({id}) => id)).toEqual(['eligible', 'registered'])
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

  it('does not refresh or show success after a resolved registration failure', async () => {
    const adapter = operations()
    vi.mocked(adapter.register).mockResolvedValue({ok: false, error: {message: 'full'}})
    const controller = createJamParticipationController(context(), {operations: adapter})
    controller.commands.beginRegistration('eligible')

    await expect(controller.commands.register('vocals')).resolves.toMatchObject({code: 'failure', failure: 'resolved', error: {message: 'full'}})
    expect(adapter.refresh).not.toHaveBeenCalled()
    expect(controller.getSnapshot().feedback).toBeNull()
  })

  it('attaches the selected instrument and current Musician to the registration', async () => {
    const adapter = operations()
    const controller = createJamParticipationController(context(), {operations: adapter})
    controller.commands.beginRegistration('eligible')

    await expect(controller.commands.register('bass')).resolves.toMatchObject({
      code: 'success', operation: 'registration', entityId: 'eligible',
    })
    expect(adapter.register).toHaveBeenCalledWith({
      musicianId: 'musician-1', performanceId: 'eligible', instrument: 'bass',
    })
  })

  it('allows re-enrollment after withdrawal through the create contract', async () => {
    const adapter = operations()
    const withdrawn = performance('eligible')
    withdrawn.registrations = [{id: 'old-registration', musicianId: 'musician-1', jamId: 'jam-1', instrument: 'Guitar', status: 'WITHDRAWN'}]
    const controller = createJamParticipationController(context({performances: [withdrawn]}), {operations: adapter})
    controller.commands.beginRegistration('eligible')

    await expect(controller.commands.register('guitars')).resolves.toMatchObject({code: 'success', operation: 'registration'})
    expect(adapter.register).toHaveBeenCalledWith({musicianId: 'musician-1', performanceId: 'eligible', instrument: 'guitars'})
  })

  it('surfaces a failed restoration without reporting success', async () => {
    const adapter = operations()
    vi.mocked(adapter.register).mockResolvedValue({ok: false, error: {message: 'Could not restore'}})
    const withdrawn = performance('eligible')
    withdrawn.registrations = [{id: 'old-registration', musicianId: 'musician-1', jamId: 'jam-1', instrument: 'bass', status: 'WITHDRAWN'}]
    const controller = createJamParticipationController(context({performances: [withdrawn]}), {operations: adapter})
    controller.commands.beginRegistration('eligible')

    await expect(controller.commands.register('bass')).resolves.toMatchObject({code: 'failure', error: {message: 'Could not restore'}})
    expect(adapter.register).toHaveBeenCalledOnce()
    expect(controller.getSnapshot().feedback).toBeNull()
  })

  it('allows a musician to withdraw only their own active registration', async () => {
    const adapter = operations()
    const enrolled = performance('eligible')
    enrolled.registrations = [
      {id: 'mine', musicianId: 'musician-1', jamId: 'jam-1', instrument: 'bass', status: 'PENDING'},
      {id: 'other', musicianId: 'musician-2', jamId: 'jam-1', instrument: 'vocals', status: 'PENDING'},
    ]
    const controller = createJamParticipationController(context({performances: [enrolled]}), {operations: adapter})
    await expect(controller.commands.withdrawRegistration('other')).resolves.toMatchObject({code: 'unavailable'})
    expect(adapter.withdrawRegistration).not.toHaveBeenCalled()
    await expect(controller.commands.withdrawRegistration('mine')).resolves.toMatchObject({code: 'success', operation: 'withdrawal'})
    expect(adapter.withdrawRegistration).toHaveBeenCalledWith('mine')
  })

  it('does not refresh or show success after a resolved suggestion failure', async () => {
    const adapter = operations()
    vi.mocked(adapter.suggest).mockResolvedValue({ok: false, error: {message: 'duplicate'}})
    const controller = createJamParticipationController(context(), {operations: adapter})

    await expect(controller.commands.suggestMusic('music-1')).resolves.toMatchObject({code: 'failure', failure: 'resolved'})
    expect(adapter.refresh).not.toHaveBeenCalled()
    expect(controller.getSnapshot().feedback).toBeNull()
  })

  it('preserves created Music after link failure and retries only the link', async () => {
    const adapter = operations()
    vi.mocked(adapter.suggest)
      .mockResolvedValueOnce({ok: false, error: {message: 'link failed'}})
      .mockResolvedValueOnce({ok: true})
    const controller = createJamParticipationController(context(), {operations: adapter})
    const data = {title: 'New', artist: 'Artist', status: 'SUGGESTED' as const}

    await expect(controller.commands.createAndSuggestMusic(data)).resolves.toMatchObject({
      code: 'partial_success', musicId: 'new-music', error: {message: 'link failed'},
    })
    expect(controller.getSnapshot().retryMusicId).toBe('new-music')

    await expect(controller.commands.createAndSuggestMusic(data)).resolves.toMatchObject({code: 'success', entityId: 'new-music'})
    expect(adapter.createMusic).toHaveBeenCalledOnce()
    expect(adapter.suggest).toHaveBeenCalledTimes(2)
  })

  it('retries only reconciliation when creation and linking succeeded', async () => {
    const adapter = operations()
    vi.mocked(adapter.refresh)
      .mockResolvedValueOnce({ok: false, error: {message: 'refresh failed'}})
      .mockResolvedValueOnce({ok: true, context: context()})
    const controller = createJamParticipationController(context(), {operations: adapter})
    const data = {title: 'New', artist: 'Artist', status: 'SUGGESTED' as const}

    await expect(controller.commands.createAndSuggestMusic(data)).resolves.toMatchObject({code: 'refresh_failure'})
    await expect(controller.commands.createAndSuggestMusic(data)).resolves.toMatchObject({code: 'success'})

    expect(adapter.createMusic).toHaveBeenCalledOnce()
    expect(adapter.suggest).toHaveBeenCalledOnce()
    expect(adapter.refresh).toHaveBeenCalledTimes(2)
  })

  it('starts feedback expiry only after authoritative refresh completes', async () => {
    const refreshed = deferred<{ok: true; context: JamParticipationContext}>()
    const adapter = operations()
    vi.mocked(adapter.refresh).mockReturnValue(refreshed.promise)
    const scheduled = manualClock()
    const controller = createJamParticipationController(context(), {operations: adapter, clock: scheduled.clock})
    controller.commands.beginRegistration('eligible')

    const registering = controller.commands.register('vocals')
    await Promise.resolve()
    expect(scheduled.delay).toBeUndefined()
    refreshed.resolve({ok: true, context: context()})
    await registering

    expect(scheduled.delay).toBe(3000)
    expect(controller.getSnapshot().feedback).toBe('registration_success')
    scheduled.flush()
    expect(controller.getSnapshot().feedback).toBeNull()
  })

  it('exposes sharing capability and semantic share outcomes', async () => {
    const share: ParticipationSharePort = {
      canNativeShare: () => true,
      copy: vi.fn().mockResolvedValue(false),
      whatsapp: vi.fn(),
      native: vi.fn().mockResolvedValue(true),
    }
    const controller = createJamParticipationController(context(), {share})

    expect(controller.getSnapshot().shareCapability.native).toBe(true)
    await expect(controller.commands.shareCopy('invite')).resolves.toEqual({code: 'share_failure', method: 'copy'})
    expect(controller.commands.shareWhatsApp({url: 'url', message: 'join'})).toEqual({code: 'share_success', method: 'whatsapp'})
    await expect(controller.commands.shareNative({title: 'Jam', url: 'url'})).resolves.toEqual({code: 'share_success', method: 'native'})
  })
})
