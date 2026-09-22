import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Avatar } from '../../components/Avatar'
import { FeedbackButton } from '../../components/FeedbackButton'
import { ProfileHeader } from '../../components/ProfileHeader'
import { SpotifyPlayButton, SpotifyPreview } from '../../components/SpotifyPreview'

const meta = { title: 'Product/Remaining reusable UI', parameters: { a11y: { test: 'todo' } } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const AvatarMatrix: Story = {
  render: () => <div className="flex items-end gap-6"><Avatar name="Ana Host" size="sm" /><Avatar name="Yuri Musician" size="md" /><Avatar name="Alexandra de la Cruz" size="lg" imageUrl="https://example.test/avatar.png" /></div>,
}

export const HostProfileLongContent: Story = {
  render: () => <ProfileHeader user={{ id: 'host-profile', name: 'Ana María del Benjamin Social Club', email: 'ana@example.test', role: 'host', isHost: true, instrument: 'guitars', level: 'PROFESSIONAL', supabaseUserId: 'fixture' }} />,
  globals: { locale: 'es', theme: 'jam-dark', viewport: { value: 'phone', isRotated: false } },
}

export const SpotifyActions: Story = {
  render: () => <div className="flex gap-4"><SpotifyPreview link="https://open.spotify.com/track/7dSCxR4LqkmxoBrq9MzVSD" title="Psycho Killer" size="md" /><SpotifyPlayButton link="spotify:track:7dSCxR4LqkmxoBrq9MzVSD" title="Psycho Killer" /></div>,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('link')).toHaveLength(2)
  },
}

export const FeedbackEntryPoint: Story = {
  render: () => <FeedbackButton />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /feedback/i })).toBeVisible()
  },
}
