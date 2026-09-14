import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import {MusicPage} from '../pages/MusicPage'
import type {MusicLibraryQueryPort} from '../lib/music/musicLibraryController'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'music_library.pagination.first': 'First',
                'music_library.pagination.previous': 'Previous',
                'music_library.pagination.next': 'Next',
                'music_library.pagination.last': 'Last',
                'music_library.pagination.page_number': 'Page number',
                'music_library.pagination.page_size': 'Show',
                'music_library.errors.failed_to_load': 'Failed to load music',
                'music_library.page_title': 'Music Library',
                'music_library.add_song': 'Add song',
                'music_library.suggest_song': 'Suggest a song',
                'common.try_again': 'Try Again',
                'music_library.no_songs_found': 'No songs found',
                'music_library.no_songs_no_results': 'No songs found',
                'music_library.no_songs_filter_help': 'Try removing filters',
            }

            return labels[key] ?? key
        },
    }),
}))

vi.mock('../hooks/useAuth', () => ({
    useAuth: () => ({
        user: {isHost: false},
        isAuthenticated: false,
    }),
}))

function approvedFailureQueryPort(errorMessage: string): MusicLibraryQueryPort {
    return {
        list: vi.fn().mockRejectedValue(new Error(errorMessage)),
    }
}

function paginatedQueryPort(total: number): MusicLibraryQueryPort {
    return {
        list: vi.fn(async ({skip, take, status}) => ({
            items: new Array(Math.min(2, total - skip)).fill(null).map((_, index) => ({
                id: `${status.toLowerCase()}-${skip + index}`,
                title: `Track ${skip + index + 1}`,
                artist: 'Artist',
                createdAt: '2026-09-13T00:00:00.000Z',
            })),
            meta: {
                total,
                skip,
                take,
                hasMore: skip + take < total,
            },
        })),
    }
}

describe('MusicPage', () => {
    it('renders approved-list failure error text and retries approved query on Try Again', async () => {
        const queryPort = approvedFailureQueryPort('Approved list failed')

        render(
            <MemoryRouter>
                <MusicPage queryPort={queryPort} />
            </MemoryRouter>,
        )

        expect(await screen.findByText('Approved list failed')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Try Again'})).toBeInTheDocument()

        await userEvent.setup().click(screen.getByRole('button', {name: 'Try Again'}))
        await waitFor(() => expect(queryPort.list).toHaveBeenCalledTimes(2))
        expect(queryPort.list).toHaveBeenNthCalledWith(1, {skip: 0, take: 50, status: 'APPROVED'})
        expect(queryPort.list).toHaveBeenNthCalledWith(2, {skip: 0, take: 50, status: 'APPROVED'})
    })

    it('renders paginated controls with localized accessible names when more than one page exists', async () => {
        const queryPort = paginatedQueryPort(125)

        render(
            <MemoryRouter>
                <MusicPage queryPort={queryPort} />
            </MemoryRouter>,
        )

        expect(await screen.findByText('Track 1')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'First'})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Previous'})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Next'})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Last'})).toBeInTheDocument()
        expect(screen.getByRole('spinbutton', {name: 'Page number'})).toBeInTheDocument()
    })
})
