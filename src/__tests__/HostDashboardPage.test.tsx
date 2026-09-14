import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import type {ReactNode} from 'react'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import {HostDashboardPage} from '../pages/host/HostDashboardPage'
import {jamFixtures} from '../workbench/jamMusicFixtures'

vi.mock('react-i18next', () => {
    const t = (key: string) => key
    return {useTranslation: () => ({t})}
})

vi.mock('../hooks', async (importOriginal) => ({
    ...await importOriginal<typeof import('../hooks')>(),
    useAuth: () => ({isAuthenticated: true, isLoading: false}),
}))

vi.mock('../services/jamService.ts', () => ({
    findAll: vi.fn().mockResolvedValue({data: []}),
    deleteFn: vi.fn(),
}))

vi.mock('../components', () => ({
    Action: ({children, loadingLabel, onClick, state = 'idle'}: {
        children: ReactNode
        loadingLabel?: string
        onClick?: () => void
        state?: 'idle' | 'loading' | 'disabled'
    }) => (
        <button onClick={onClick} disabled={state !== 'idle'} aria-busy={state === 'loading' || undefined}>
            {state === 'loading' ? loadingLabel : children}
        </button>
    ),
    IconAction: ({children, label}: {children: ReactNode; label: string}) => <button aria-label={label}>{children}</button>,
    EmptyState: ({action}: {action?: {label: string; onClick: () => void}}) => (
        action ? <button onClick={action.onClick}>{action.label}</button> : null
    ),
    ErrorState: ({action, description, title}: {
        action?: {label: string; onClick: () => void}
        description?: string
        title: string
    }) => <div role="alert"><strong>{title}</strong>{description}<button onClick={action?.onClick}>{action?.label}</button></div>,
    JamCardSkeleton: () => null,
    Status: ({description, role = 'status', title}: {description?: string; role?: 'status' | 'alert'; title: string}) => (
        <div role={role}><strong>{title}</strong>{description}</div>
    ),
    SpotifyImportModal: () => null,
}))

describe('HostDashboardPage', () => {
    it('offers Create Jam in the header and first-use recovery without an overflow duplicate', async () => {
        render(
            <MemoryRouter>
                <HostDashboardPage/>
            </MemoryRouter>,
        )

        await waitFor(() => expect(screen.getAllByRole('button', {
            name: 'jam_management.host_dashboard.create_jam_btn',
        })).toHaveLength(2))
    })

    it('offers a retry after the initial Jam query fails', async () => {
        const list = vi.fn()
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValue([])

        render(
            <MemoryRouter>
                <HostDashboardPage port={{list, remove: vi.fn()}}/>
            </MemoryRouter>,
        )

        const alert = await screen.findByRole('alert')
        expect(alert).toHaveTextContent('jam_management.host_dashboard.failed_to_load')
        fireEvent.click(within(alert).getByRole('button', {name: 'common.try_again'}))

        await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
        expect(await screen.findAllByRole('button', {
            name: 'jam_management.host_dashboard.create_jam_btn',
        })).toHaveLength(2)
    })

    it('keeps deletion failure feedback attached to the affected Jam', async () => {
        const jam = {...jamFixtures.active, id: 'delete-failure', name: 'Friday Jam', status: 'ACTIVE' as const}
        const remove = vi.fn().mockRejectedValue(new Error('Delete failed'))

        render(
            <MemoryRouter>
                <HostDashboardPage
                    port={{list: vi.fn().mockResolvedValue([jam]), remove}}
                    confirmDelete={() => true}
                />
            </MemoryRouter>,
        )

        const heading = await screen.findByRole('heading', {level: 3, name: 'Friday Jam'})
        const card = heading.closest('article')
        expect(card).not.toBeNull()
        const cardQueries = within(card as HTMLElement)
        fireEvent.click(cardQueries.getByRole('button', {name: 'jam_management.host_dashboard.more_actions'}))
        fireEvent.click(cardQueries.getByRole('button', {name: 'jam_management.host_dashboard.delete_btn'}))

        expect(await cardQueries.findByRole('alert')).toHaveTextContent('Delete failed')
        expect(cardQueries.getByRole('button', {name: 'jam_management.host_dashboard.manage_btn'})).toBeEnabled()
    })

    it('disables only the affected Jam actions while deletion is pending', async () => {
        const jams = [
            {...jamFixtures.active, id: 'delete-pending', name: 'Friday Jam', status: 'ACTIVE' as const},
            {...jamFixtures.active, id: 'still-available', name: 'Saturday Jam', status: 'INACTIVE' as const},
        ]
        const remove = vi.fn(() => new Promise<void>(() => undefined))

        render(
            <MemoryRouter>
                <HostDashboardPage port={{list: vi.fn().mockResolvedValue(jams), remove}} confirmDelete={() => true}/>
            </MemoryRouter>,
        )

        const friday = within((await screen.findByRole('heading', {level: 3, name: 'Friday Jam'})).closest('article') as HTMLElement)
        const saturday = within(screen.getByRole('heading', {level: 3, name: 'Saturday Jam'}).closest('article') as HTMLElement)
        fireEvent.click(friday.getByRole('button', {name: 'jam_management.host_dashboard.more_actions'}))
        fireEvent.click(friday.getByRole('button', {name: 'jam_management.host_dashboard.delete_btn'}))

        await waitFor(() => expect(friday.getByRole('button', {name: 'jam_management.host_dashboard.delete_btn'})).toBeDisabled())
        expect(friday.getByRole('button', {name: 'jam_management.host_dashboard.manage_btn'})).toBeDisabled()
        expect(saturday.getByRole('button', {name: 'jam_management.host_dashboard.manage_btn'})).toBeEnabled()
    })

    it('keeps successful deletion feedback in the removed Jam category', async () => {
        const jam = {...jamFixtures.active, id: 'delete-success', name: 'Sunday Jam', status: 'ACTIVE' as const}
        const list = vi.fn().mockResolvedValueOnce([jam]).mockResolvedValue([])

        render(
            <MemoryRouter>
                <HostDashboardPage port={{list, remove: vi.fn().mockResolvedValue(undefined)}} confirmDelete={() => true}/>
            </MemoryRouter>,
        )

        const card = within((await screen.findByRole('heading', {level: 3, name: 'Sunday Jam'})).closest('article') as HTMLElement)
        fireEvent.click(card.getByRole('button', {name: 'jam_management.host_dashboard.more_actions'}))
        fireEvent.click(card.getByRole('button', {name: 'jam_management.host_dashboard.delete_btn'}))

        const outcome = await screen.findByRole('status')
        expect(outcome).toHaveTextContent('jam_management.host_dashboard.delete_success')
        expect(outcome).toHaveTextContent('Sunday Jam')
        expect(screen.getByRole('heading', {level: 2, name: 'jam_management.host_dashboard.categories.in_progress'})).toBeVisible()
    })
})
