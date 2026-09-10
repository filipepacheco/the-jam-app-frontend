import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter, Route, Routes} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import type {JamResponseDto} from '../types/api.types'
import {JamManagementPage} from '../pages/host/JamManagementPage'

const {liveJam} = vi.hoisted(() => ({
    liveJam: {
        id: 'jam-1',
        name: 'Live jam',
        hostName: 'Host',
        status: 'LIVE',
        createdAt: '2026-05-08T18:00:00.000Z',
        updatedAt: '2026-05-08T18:00:00.000Z',
    } satisfies JamResponseDto,
}))

vi.mock('swr', () => ({
    default: () => ({
        data: liveJam,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
    }),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../hooks', () => ({
    useAuth: () => ({isAuthenticated: true, isLoading: false}),
    usePageAlerts: () => ({
        error: null,
        setError: vi.fn(),
        clearError: vi.fn(),
        success: null,
        setSuccess: vi.fn(),
        clearSuccess: vi.fn(),
    }),
}))

vi.mock('../components', () => ({
    Alert: () => null,
    PageAlerts: () => null,
    SpotifyExportModal: () => null,
}))

vi.mock('../components/schedule', () => ({
    LiveJamControlPanel: () => <div>live tab</div>,
}))

vi.mock('../pages/tabs/DJControlTab', () => ({
    DJControlTab: () => <div>legacy DJ tab</div>,
}))

vi.mock('../pages/tabs/DJControlTabV2', () => ({
    DJControlTabV2: () => <div>DJ control tab</div>,
}))

vi.mock('../pages/tabs/AnalyticsTab', () => ({AnalyticsTab: () => null}))
vi.mock('../pages/tabs/DashboardTab', () => ({DashboardTab: () => null}))
vi.mock('../pages/tabs/ScheduleTab', () => ({ScheduleTab: () => <div>schedule tab</div>}))
vi.mock('../pages/tabs/RegistrationsTab', () => ({RegistrationsTab: () => null}))
vi.mock('../pages/tabs/OverviewTab', () => ({
    OverviewTab: () => <div>overview tab</div>,
}))

describe('JamManagementPage', () => {
    it('lets the host open Overview while a jam is live', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter initialEntries={['/host/jams/jam-1/manage']}>
                <Routes>
                    <Route path="/host/jams/:id/manage" element={<JamManagementPage/>}/>
                </Routes>
            </MemoryRouter>,
        )

        expect(await screen.findByText('DJ control tab')).toBeInTheDocument()

        await user.click(screen.getByRole('tab', {name: /jam_management\.tabs\.overview/}))

        expect(screen.getByText('overview tab')).toBeInTheDocument()
        expect(screen.queryByText('DJ control tab')).not.toBeInTheDocument()
    })
})
