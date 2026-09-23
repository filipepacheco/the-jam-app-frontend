import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import ConfettiWrapper from '../../components/publicDashboard/ConfettiWrapper'
import { CurrentSongCard } from '../../components/publicDashboard/CurrentSongCard'
import Header from '../../components/publicDashboard/Header'
import { InstrumentGroup } from '../../components/publicDashboard/InstrumentGroup'
import { NextSongCard } from '../../components/publicDashboard/NextSongCard'
import OfflineBanner from '../../components/publicDashboard/OfflineBanner'
import { StartingSoonCard } from '../../components/publicDashboard/StartingSoonCard'
import { WaveformVisualizer } from '../../components/publicDashboard/WaveformVisualizer'
import { dashboardSongs } from '../publicDashboardFixtures'

const meta = {
  title: 'Domain/Public Dashboard/Cards and display',
  parameters: {
    a11y: {test: 'error'},
    designSystem: {interaction: {status: 'not-applicable', rationale: 'Passive venue content presents the stage and upcoming musicians without audience-operated controls; HeaderControls tests the host controls separately.'}},
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const CurrentAndNext: Story = {
  render: () => <div className="space-y-6"><CurrentSongCard song={dashboardSongs.current} /><NextSongCard song={dashboardSongs.next} /></div>,
  globals: { theme: 'jam-dark', locale: 'pt', viewport: { value: 'desktop', isRotated: false } },
}

export const StartingSoon: Story = {
  render: () => <StartingSoonCard song={dashboardSongs.next} />,
  globals: { locale: 'es', reducedMotion: true },
}

export const EmptyStartingSoon: Story = { render: () => <StartingSoonCard song={null} /> }

export const InstrumentAndWaveform: Story = {
  render: () => <div className="space-y-8"><InstrumentGroup instrument="guitars" musicians={dashboardSongs.current.musicians} size="lg" /><WaveformVisualizer barCount={20} /></div>,
  globals: { reducedMotion: true, theme: 'jam-dark' },
}

const toggleNav = fn()
const toggleFullscreen = fn()

export const HeaderControls: Story = {
  render: () => <div className="relative min-h-40"><Header title="Jam Benjamin Social Club with a long venue title" showControlsPanel={false} setShowControlsPanel={toggleNav} isFullscreen={false} onToggleFullscreen={toggleFullscreen} /></div>,
  play: async ({ canvas, userEvent }) => {
    // Query by accessible name, never by index. Canonical navigation
    // primitives can render `role="menuitem"` instead of `role="button"`,
    // so a positional `getAllByRole('button')[n]` lookup silently points at
    // the wrong control. The regexes cover the en, es and pt labels.
    const navToggle = canvas.getByRole('button', { name: /dashboard controls|controles del panel|controles do painel/i })
    const fullscreenToggle = canvas.getByRole('button', { name: /fullscreen|pantalla completa|tela cheia/i })
    await userEvent.click(navToggle)
    await userEvent.click(fullscreenToggle)
    await expect(toggleNav).toHaveBeenCalledWith(true)
    await expect(toggleFullscreen).toHaveBeenCalledOnce()
  },
}

export const OfflineVenueDisplay: Story = { render: () => <OfflineBanner visible message="Connection lost — showing the most recent set list while reconnecting." /> }

export const FinishedCelebration: Story = { render: () => <div className="relative min-h-96"><ConfettiWrapper show width={960} height={420} /></div> }
