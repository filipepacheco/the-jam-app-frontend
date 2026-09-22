import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import type {JamResponseDto} from '../types/api.types'
import {OverviewTab} from '../pages/tabs/OverviewTab'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../hooks', () => ({
    useAppLanguage: () => ({currentLang: 'en', changeLanguage: vi.fn()}),
}))

vi.mock('../components', () => ({
    SpotifyImportModal: () => null,
}))

const jam: JamResponseDto = {
    id: 'jam-1',
    name: 'Test jam',
    hostName: 'Host',
    status: 'ACTIVE',
    date: '2026-09-24T18:00:00.000Z',
    location: 'Jam House',
    autoApproveRegistrations: true,
    createdAt: '2026-09-24T18:00:00.000Z',
    updatedAt: '2026-09-24T18:00:00.000Z',
}

describe('OverviewTab', () => {
    it('uses a clear primary Jam lifecycle action', () => {
        render(
            <MemoryRouter>
                <OverviewTab jam={jam} onStatusChange={vi.fn()} onJamUpdate={vi.fn()} loading={false}/>
            </MemoryRouter>,
        )

        expect(screen.getByRole('button', {name: 'jam_management.overview.actions.start'}))
            .toHaveAttribute('data-action-variant', 'primary')
    })

    it('keeps Jam editing in the overview instead of linking to another page', () => {
        render(
            <MemoryRouter>
                <OverviewTab jam={jam} onStatusChange={vi.fn()} onJamUpdate={vi.fn()} loading={false}/>
            </MemoryRouter>,
        )

        expect(screen.getByRole('textbox', {name: 'create_jam.form.jam_name'})).toHaveValue('Test jam')
        expect(screen.getByRole('button', {name: 'create_jam.actions.update'})).toBeDisabled()
        expect(screen.getByRole('button', {name: 'spotify.import_button'}).closest('.dropdown')).toBeNull()
        expect(screen.queryByRole('button', {name: 'spotify.export_button'})).not.toBeInTheDocument()
    })

    it('lets the host disable automatic registration approval with the Jam settings', async () => {
        const onJamUpdate = vi.fn().mockResolvedValue(undefined)
        render(
            <MemoryRouter>
                <OverviewTab jam={jam} onStatusChange={vi.fn()} onJamUpdate={onJamUpdate} loading={false}/>
            </MemoryRouter>,
        )

        const user = userEvent.setup()
        const toggle = screen.getByRole('checkbox', {name: 'create_jam.form.auto_approve_registrations'})
        expect(toggle).toBeChecked()

        await user.click(toggle)
        await user.click(screen.getByRole('button', {name: 'create_jam.actions.update'}))

        await waitFor(() => expect(onJamUpdate).toHaveBeenCalledWith(expect.objectContaining({
            autoApproveRegistrations: false,
        })))
    })
})
