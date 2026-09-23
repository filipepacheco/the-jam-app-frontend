import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import type {JamResponseDto} from '../types/api.types'
import {ScheduleTab} from '../pages/tabs/ScheduleTab'
import {musicService, scheduleService} from '../services'
import {ToastProvider} from '../components/Toast'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../services', () => ({
    musicService: {
        findAll: vi.fn().mockResolvedValue({
            data: [{
                id: 'music-1',
                title: 'Psycho Killer',
                artist: 'Talking Heads',
                createdAt: '2026-09-24T18:00:00.000Z',
            }, {
                id: 'music-2',
                title: 'Creep',
                artist: 'Radiohead',
                createdAt: '2026-09-24T18:00:00.000Z',
            }],
            meta: {total: 2, skip: 0, take: 100, hasMore: false},
        }),
        linkToJam: vi.fn(),
        updateJamMusic: vi.fn(),
    },
    scheduleService: {create: vi.fn(), update: vi.fn(), remove: vi.fn()},
    registrationService: {update: vi.fn(), remove: vi.fn()},
}))

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

describe('ScheduleTab', () => {
    const makeSchedule = (index: number, status: JamResponseDto['schedules'][number]['status'] = 'SCHEDULED'): JamResponseDto['schedules'][number] => ({
        id: `schedule-${index}`,
        jamId: 'jam-1',
        musicId: `music-${index}`,
        order: index + 1,
        status,
        createdAt: '2026-09-24T18:00:00.000Z',
        music: {
            id: `music-${index}`,
            title: `Song ${index + 1}`,
            artist: `Artist ${index + 1}`,
            createdAt: '2026-09-24T18:00:00.000Z',
        },
        registrations: [],
    })

    it('keeps add-new-song action available for up to three schedules and opens add-entry modal', async () => {
        const user = userEvent.setup()

        for (const scheduleCount of [1, 2, 3] as const) {
            const jamWithSchedules: JamResponseDto = {
                ...jam,
                schedules: Array.from({length: scheduleCount}, (_, index) => makeSchedule(index)),
            }

            const {unmount} = render(
                <MemoryRouter>
                    <ToastProvider>
                        <ScheduleTab jam={jamWithSchedules} onReload={vi.fn()}/>
                    </ToastProvider>
                </MemoryRouter>,
            )

            const addSongButtons = screen.getAllByRole('button', {name: 'jam_management.schedule.add_new_song'})
            expect(addSongButtons).toHaveLength(1)
            await user.click(addSongButtons[0])

            expect(await screen.findByText('jam_management.schedule.add_entry_modal')).toBeInTheDocument()
            unmount()
        }
    })

    it('keeps a visible Add Music label and floats the current Performance actions', async () => {
        const user = userEvent.setup()
        const jamWithSchedules: JamResponseDto = {
            ...jam,
            schedules: [
                makeSchedule(0, 'IN_PROGRESS'),
                makeSchedule(1),
                makeSchedule(2),
                makeSchedule(3),
            ],
        }

        render(
            <MemoryRouter>
                <ToastProvider>
                    <ScheduleTab jam={jamWithSchedules} onReload={vi.fn()}/>
                </ToastProvider>
            </MemoryRouter>,
        )

        expect(screen.getByRole('button', {name: 'jam_management.schedule.add_new_song'})).toBeVisible()
        const searchInput = screen.getByRole('searchbox', {name: 'schedule.search_placeholder'})
        expect(searchInput.closest('.schedule-toolbar__search')).not.toBeNull()
        expect(document.querySelector('.lucide-search')).not.toBeInTheDocument()
        const current = screen.getByRole('button', {name: 'Song 1 - Artist 1'}).closest('article')
        expect(current).not.toBeNull()
        expect(current).toHaveAttribute('data-performance-priority', 'current')
        expect(current).toHaveClass('overflow-visible')

        await user.click(screen.getAllByRole('button', {name: 'common.actions'})[0])
        expect(screen.getByRole('menu')).toBeVisible()
        expect(screen.getByRole('menuitem', {name: 'schedule.actions.mark_completed'})).toBeVisible()
    })

    it('does not count a paused song as now playing', () => {
        const jamWithPausedSong: JamResponseDto = {
            ...jam,
            playbackState: 'PAUSED',
            schedules: [{...makeSchedule(0, 'IN_PROGRESS'), pausedAt: '2026-09-24T18:01:00.000Z'}],
        }

        const {rerender} = render(
            <MemoryRouter>
                <ToastProvider>
                    <ScheduleTab jam={jamWithPausedSong} onReload={vi.fn()}/>
                </ToastProvider>
            </MemoryRouter>,
        )

        expect(screen.queryByRole('heading', {name: 'schedule.now_playing (1)'})).not.toBeInTheDocument()
        expect(screen.getByRole('heading', {name: 'schedule.statuses.paused (1)'})).toBeVisible()

        rerender(
            <MemoryRouter>
                <ToastProvider>
                    <ScheduleTab
                        jam={{...jamWithPausedSong, playbackState: 'PLAYING', schedules: [{...makeSchedule(0, 'IN_PROGRESS'), pausedAt: null}]}}
                        onReload={vi.fn()}
                    />
                </ToastProvider>
            </MemoryRouter>,
        )

        expect(screen.getByRole('heading', {name: 'schedule.now_playing (1)'})).toBeVisible()
        expect(screen.queryByRole('heading', {name: 'schedule.statuses.paused (1)'})).not.toBeInTheDocument()
    })

    it('reports successful schedule mutations through the success toast', async () => {
        const user = userEvent.setup()
        const jamWithSchedules: JamResponseDto = {
            ...jam,
            schedules: [makeSchedule(0, 'IN_PROGRESS')],
        }
        vi.mocked(scheduleService.update).mockResolvedValue({success: true, data: null})

        render(
            <MemoryRouter>
                <ToastProvider>
                    <ScheduleTab
                        jam={jamWithSchedules}
                        onReload={vi.fn().mockResolvedValue(jamWithSchedules)}
                    />
                </ToastProvider>
            </MemoryRouter>,
        )

        await user.click(screen.getByRole('button', {name: 'common.actions'}))
        await user.click(screen.getByRole('menuitem', {name: 'schedule.actions.mark_completed'}))

        const toast = await screen.findByRole('status')
        expect(toast).toHaveTextContent('jam_management.schedule.status_updated')
        expect(toast).toHaveAttribute('data-toast-tone', 'success')
    })

    it('uses the localized fallback instead of exposing an unknown mutation error', async () => {
        const user = userEvent.setup()
        const jamWithSchedules: JamResponseDto = {
            ...jam,
            schedules: [makeSchedule(0, 'IN_PROGRESS')],
        }
        vi.mocked(scheduleService.update).mockResolvedValue({
            success: false,
            data: null,
            error: 'Unknown mutation error',
        })

        render(
            <MemoryRouter>
                <ToastProvider>
                    <ScheduleTab
                        jam={jamWithSchedules}
                        onReload={vi.fn().mockResolvedValue(jamWithSchedules)}
                    />
                </ToastProvider>
            </MemoryRouter>,
        )

        await user.click(screen.getByRole('button', {name: 'common.actions'}))
        await user.click(screen.getByRole('menuitem', {name: 'schedule.actions.mark_completed'}))

        const toast = await screen.findByRole('alert')
        expect(toast).toHaveTextContent('errors.failed_to_execute_action')
        expect(toast).toHaveAttribute('data-toast-tone', 'error')
    })

    it('loads searchable music options when the add-entry modal opens', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <ToastProvider>
                    <ScheduleTab jam={jam} onReload={vi.fn()}/>
                </ToastProvider>
            </MemoryRouter>,
        )

        await user.click(screen.getByRole('button', {name: 'jam_management.schedule.add_new_song'}))

        await waitFor(() => expect(musicService.findAll).toHaveBeenCalledWith(0, 100, 'APPROVED'))
        await user.click(await screen.findByLabelText('jam_management.schedule.song_label'))

        const searchInput = screen.getByPlaceholderText('common.search')
        await user.type(searchInput, 'psycho')

        expect(screen.getByRole('listbox').closest('dialog')).toBeNull()
        expect(screen.getByText('Psycho Killer')).toBeInTheDocument()
        expect(screen.queryByText('Creep')).not.toBeInTheDocument()

        const createMusicButton = screen.getByText('music_library.create_new').closest('button')
        expect(createMusicButton).not.toBeNull()
        await user.click(createMusicButton!)
        expect(screen.getByText('music_library.modals.add_title')).toBeInTheDocument()
    })
})
