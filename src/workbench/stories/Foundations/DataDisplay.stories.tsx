import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarDays, Guitar, Music2, Radio, Users } from 'lucide-react'
import { expect } from 'storybook/test'
import { Badge, CompactMetadata, DataCard, ListRow, StatusIndicator } from '../../../components/data-display'
import { MusicBadge, MusicCompactMetadata, MusicDataCard, MusicStatusIndicator } from '../../../components/music/MusicDataDisplay'
import { musicFixtures } from '../../jamMusicFixtures'

const meta = {
  title: 'Foundations/Data display',
  parameters: { a11y: { test: 'error' }, layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const CanonicalPrimitives: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-[var(--ds-space-region)] text-[var(--ds-content-primary)]">
      <div className="flex flex-wrap items-center gap-[var(--ds-space-compact)]">
        <Badge tone="neutral">Draft</Badge>
        <Badge tone="info">4 songs</Badge>
        <Badge tone="success">Approved</Badge>
        <Badge tone="warning">Needs musicians</Badge>
        <Badge tone="danger">Offline</Badge>
      </div>
      <div className="flex flex-wrap gap-[var(--ds-space-section)]">
        <StatusIndicator status="live" label="Tocando agora" />
        <StatusIndicator status="pending" label="Aguardando aprovação" />
        <StatusIndicator status="offline" label="Dashboard offline" />
      </div>
      <DataCard density="comfortable" selected>
        <div className="grid gap-[var(--ds-space-compact)]">
          <h2 className="text-[length:var(--ds-text-subheading)] font-[var(--ds-weight-heading)]">Friday Night Jam</h2>
          <p className="ds-type-body text-[var(--ds-content-secondary)]">A welcoming open stage at Benjamin Social Club.</p>
          <CompactMetadata items={[{ label: 'Host', value: 'Ana Host' }, { label: 'Songs', value: '12 ready' }]} />
        </div>
      </DataCard>
    </div>
  ),
  globals: { theme: 'jam-light', locale: 'en', viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas }) => {
    const statusBadges = ['4 songs', 'Approved', 'Needs musicians', 'Offline']
      .map((label) => canvas.getByText(label).closest('[data-display-component="badge"]'))

    for (const badge of statusBadges) {
      await expect(badge).toHaveAttribute('data-display-presentation', 'filled')
      await expect(badge?.querySelector('.ds-badge__marker')).toHaveAttribute('aria-hidden', 'true')
    }
  },
}

export const JamAndScheduleRows: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-[var(--ds-space-section)] text-[var(--ds-content-primary)]">
      <DataCard density="compact">
        <div className="grid gap-[var(--ds-space-compact)]">
          <div className="flex items-center justify-between gap-[var(--ds-space-cluster)]">
            <h2 className="min-w-0 ds-wrap-user-content text-[length:var(--ds-text-subheading)] font-[var(--ds-weight-heading)]">Friday Night Jam at Benjamin Social Club</h2>
            <Badge tone="success">Live</Badge>
          </div>
          <ListRow
            density="compact"
            leading={<CalendarDays className="size-5" aria-hidden="true" />}
            metadata="Friday, 18 September · 20:00"
            trailing={<Badge tone="info">12 songs</Badge>}
          >
            <span className="ds-truncate-single" title="Opening set — Psycho Killer">Opening set — Psycho Killer</span>
          </ListRow>
          <ListRow
            density="compact"
            leading={<Users className="size-5" aria-hidden="true" />}
            metadata="Yuri, Marina, Ana"
            trailing={<StatusIndicator status="pending" label="3 spots" />}
          >
            Não Quero Dinheiro (Só Quero Amar)
          </ListRow>
        </div>
      </DataCard>
    </div>
  ),
  globals: { theme: 'jam-dark', locale: 'pt', viewport: { value: 'desktop', isRotated: false } },
}

export const MusicHero: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-[var(--ds-space-section)] text-[var(--ds-content-primary)]">
      <MusicDataCard music={musicFixtures.approved} selected className="ds-shared-display">
        <div className="grid gap-[var(--ds-space-cluster)]">
          <div className="flex items-start justify-between gap-[var(--ds-space-cluster)]">
            <div className="min-w-0">
              <p className="text-[length:var(--ds-text-caption)] font-[var(--ds-weight-label)] text-[var(--ds-content-secondary)]">Now performing</p>
              <h2 className="ds-type-display ds-wrap-user-content">Psycho Killer</h2>
              <p className="ds-type-body text-[var(--ds-content-secondary)]">Talking Heads · New Wave</p>
            </div>
            <div className="grid justify-items-end gap-[var(--ds-space-compact)]">
              <MusicStatusIndicator status={musicFixtures.approved.status} />
              <MusicBadge status={musicFixtures.approved.status} />
            </div>
          </div>
          <MusicCompactMetadata music={musicFixtures.approved} />
        </div>
      </MusicDataCard>
      <DataCard density="compact">
        <ListRow leading={<Music2 className="size-5" aria-hidden="true" />} metadata="The Rolling Stones · Rock" trailing={<Badge tone="warning">Suggested</Badge>}>
          (I Can&apos;t Get No) Satisfaction
        </ListRow>
      </DataCard>
    </div>
  ),
  globals: { theme: 'jam-dark', locale: 'en', viewport: { value: 'venue', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: /approved/i })).toBeInTheDocument()
    await expect(canvas.getByText('Psycho Killer')).toBeVisible()
  },
}

export const PublicDashboard: Story = {
  render: () => (
    <div className="ds-shared-display grid max-w-5xl gap-[var(--ds-space-stage)] text-[var(--ds-content-primary)]">
      <DataCard density="comfortable" className="border-[var(--ds-status-success)]">
        <div className="grid gap-[var(--ds-space-cluster)] text-center">
          <StatusIndicator status="live" label="Live at Benjamin Social Club" />
          <h2 className="ds-type-display ds-wrap-user-content">Dancing in the Moonlight</h2>
          <p className="ds-type-body">Alexandra Montgomery &amp; The Thursday Night Friends</p>
          <div className="flex justify-center gap-[var(--ds-space-cluster)]"><Radio aria-hidden="true" /><Guitar aria-hidden="true" /></div>
        </div>
      </DataCard>
      <ListRow density="comfortable" leading={<Music2 className="size-6" aria-hidden="true" />} metadata="Up next · 20:42" trailing={<Badge size="lg" tone="info">Next</Badge>}>
        Não Quero Dinheiro (Só Quero Amar)
      </ListRow>
    </div>
  ),
  globals: { theme: 'jam-dark', locale: 'pt', viewport: { value: 'venue', isRotated: false }, reducedMotion: true },
}
