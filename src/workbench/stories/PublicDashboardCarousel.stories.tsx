import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor } from 'storybook/test'
import DashboardNavbar from '../../components/publicDashboard/Navbar'
import { LanguageSelector } from '../../components/publicDashboard/LanguageSelector'
import QRCodeCorner from '../../components/publicDashboard/QRCodeCorner'
import { CarouselDashboard } from '../../components/publicDashboard/carousel/CarouselDashboard'
import { FinishedPanel } from '../../components/publicDashboard/carousel/FinishedPanel'
import { NowPlayingPanel } from '../../components/publicDashboard/carousel/NowPlayingPanel'
import { QRCodePanel } from '../../components/publicDashboard/carousel/QRCodePanel'
import { StartingSoonPanel } from '../../components/publicDashboard/carousel/StartingSoonPanel'
import { UpNextPanel } from '../../components/publicDashboard/carousel/UpNextPanel'
import { dashboardSongs } from '../publicDashboardFixtures'

const meta = { title: 'Domain/Public Dashboard/Carousel and controls', parameters: { a11y: { test: 'todo' }, layout: 'fullscreen' } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const LiveCarousel: Story = {
  render: () => <CarouselDashboard jamStatus="LIVE" currentSong={dashboardSongs.current} nextSongs={[dashboardSongs.next]} jamId="jam-public" slug="friday-night-jam" intervalMs={60_000} />,
  globals: { theme: 'dark', locale: 'en', reducedMotion: true },
  play: async ({ canvas, userEvent }) => {
    const tabs = canvas.getAllByRole('tab')
    await expect(tabs).toHaveLength(3)
    await userEvent.click(tabs[1])
    await expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
  },
}

export const StartingCarousel: Story = { render: () => <CarouselDashboard jamStatus="ACTIVE" currentSong={null} nextSongs={[dashboardSongs.next]} jamId="jam-public" intervalMs={60_000} /> }
export const FinishedCarousel: Story = { render: () => <CarouselDashboard jamStatus="FINISHED" currentSong={null} nextSongs={[]} intervalMs={60_000} /> }

export const PanelMatrix: Story = {
  render: () => <div className="space-y-20"><NowPlayingPanel song={dashboardSongs.current} /><UpNextPanel song={dashboardSongs.next} /><StartingSoonPanel song={dashboardSongs.next} /><FinishedPanel /><QRCodePanel jamId="jam-public" slug="friday-night-jam" /></div>,
  globals: { locale: 'es', theme: 'synthwave', viewport: { value: 'desktop', isRotated: false } },
}

const languageChange = fn()
const close = fn()

export const LanguageControls: Story = {
  render: () => <LanguageSelector currentLang="pt" onChange={languageChange} onSelectClose={close} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /switch to english/i }))
    await expect(languageChange).toHaveBeenCalledWith('en')
    await expect(close).toHaveBeenCalledOnce()
  },
}

export const SettingsNavbar: Story = {
  render: () => <DashboardNavbar visible jamId="jam-public" jamSlug="friday-night-jam" onClose={close} currentLang="pt" onChangeLanguage={languageChange} pollingMs={5000} onPollingChange={fn()} layout="carousel" onLayoutChange={fn()} carouselIntervalMs={8000} onCarouselIntervalChange={fn()} />,
  globals: { reducedMotion: true },
  play: async ({ canvasElement, userEvent }) => {
    const backdrop = canvasElement.querySelector<HTMLElement>('div.fixed.inset-0')!
    await userEvent.click(backdrop)
    await expect(close).toHaveBeenCalled()
  },
}

export const ExpandableQr: Story = {
  render: () => <QRCodeCorner jamId="jam-public" shortCode="JAM26" position="bottom-right" />,
  globals: { viewport: { value: 'desktop', isRotated: false }, reducedMotion: true },
  play: async ({ canvasElement, userEvent }) => {
    const body = canvasElement.ownerDocument.body
    const trigger = body.querySelector<HTMLButtonElement>('button[aria-label*="QR" i]')!
    await userEvent.click(trigger)
    await expect(body.querySelector('[role="dialog"]')).not.toBeNull()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.querySelector('[role="dialog"]')).toBeNull())
  },
}
