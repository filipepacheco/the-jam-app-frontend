import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import type {JamResponseDto} from '../types/api.types'
import {ScheduleTab} from '../pages/tabs/ScheduleTab'
import {musicService} from '../services'

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
    it('keeps add-new-song action available for up to three schedules and opens add-entry modal', async () => {
        const user = userEvent.setup()
        const makeSchedule = (index: number): JamResponseDto['schedules'][number] => ({
            id: `schedule-${index}`,
            jamId: 'jam-1',
            musicId: `music-${index}`,
            order: index + 1,
            status: 'SCHEDULED',
            createdAt: '2026-09-24T18:00:00.000Z',
            music: {
                id: `music-${index}`,
                title: `Song ${index + 1}`,
                artist: `Artist ${index + 1}`,
                createdAt: '2026-09-24T18:00:00.000Z',
            },
            registrations: [],
        })

        for (const scheduleCount of [1, 2, 3] as const) {
            const jamWithSchedules: JamResponseDto = {
                ...jam,
                schedules: Array.from({length: scheduleCount}, (_, index) => makeSchedule(index)),
            }

            const {unmount} = render(
                <MemoryRouter>
                    <ScheduleTab jam={jamWithSchedules} onReload={vi.fn()}/>
                </MemoryRouter>,
            )

            const addSongButtons = screen.getAllByRole('button', {name: 'jam_management.schedule.add_new_song'})
            expect(addSongButtons).toHaveLength(1)
            await user.click(addSongButtons[0])

            expect(await screen.findByText('jam_management.schedule.add_entry_modal')).toBeInTheDocument()
            unmount()
        }
    })

    it('loads searchable music options when the add-entry modal opens', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <ScheduleTab jam={jam} onReload={vi.fn()}/>
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
