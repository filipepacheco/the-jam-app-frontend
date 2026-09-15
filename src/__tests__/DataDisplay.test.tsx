import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Badge,
  CompactMetadata,
  DataCard,
  ListRow,
  StatusIndicator,
} from '../components/data-display'
import { MusicCard } from '../components/MusicCard'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}))

describe('canonical data display primitives', () => {
  it('pairs badge tone with an explicit label and supports safe truncation', () => {
    render(
      <Badge tone="success" size="sm" truncate aria-label="Approved song">
        Approved song with a long title
      </Badge>,
    )

    const badge = screen.getByLabelText('Approved song')
    expect(badge).toHaveClass('ds-badge', 'ds-badge--success', 'ds-badge--sm', 'ds-truncate-single')
    expect(badge).toHaveAttribute('data-display-tone', 'success')
  })

  it('exposes status text alongside the semantic indicator', () => {
    render(<StatusIndicator status="live" label="Tocando agora" />)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Tocando agora')
    expect(status).toHaveAttribute('data-display-status', 'live')
    expect(status.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  it('supports dense and comfortable cards with selected state', () => {
    const { rerender } = render(
      <DataCard density="compact" selected aria-label="Psycho Killer">
        <h3>Psycho Killer</h3>
      </DataCard>,
    )

    const card = screen.getByLabelText('Psycho Killer')
    expect(card).toHaveClass('ds-data-card', 'ds-data-card--compact', 'ds-data-card--selected')
    expect(card).toHaveAttribute('data-selected', 'true')

    rerender(<DataCard density="comfortable"><h3>Friday Night Jam</h3></DataCard>)
    expect(screen.getByText('Friday Night Jam').parentElement).toHaveClass('ds-data-card--comfortable')
  })

  it('renders list rows with leading, primary, metadata, and trailing regions', () => {
    render(
      <ListRow
        density="compact"
        leading={<span aria-hidden="true">♫</span>}
        metadata={<span>Talking Heads</span>}
        trailing={<Badge tone="info">New Wave</Badge>}
      >
        Psycho Killer
      </ListRow>,
    )

    const row = screen.getByText('Psycho Killer').closest('[data-display-component="list-row"]')
    expect(row).toHaveClass('ds-list-row', 'ds-list-row--compact')
    expect(screen.getByText('Talking Heads')).toBeInTheDocument()
    expect(screen.getByText('New Wave')).toBeInTheDocument()
  })

  it('renders compact metadata as a labelled list and wraps user content', () => {
    render(
      <CompactMetadata
        items={[
          { label: 'Genre', value: 'Alternative / Experimental' },
          { label: 'Venue', value: 'Benjamin Social Club with a deliberately long name' },
        ]}
      />,
    )

    expect(screen.getByText('Genre').tagName).toBe('DT')
    expect(screen.getByText('Alternative / Experimental')).toHaveClass('ds-wrap-user-content')
    expect(screen.getByText(/Benjamin Social Club/)).toHaveClass('ds-wrap-user-content')
  })

  it('integrates the canonical card and status mapping into the music consumer', () => {
    const {rerender} = render(
      <MusicCard
        music={{
          id: 'music-display-test',
          title: 'Psycho Killer',
          artist: 'Talking Heads',
          status: 'APPROVED',
          createdAt: '2026-09-11T12:00:00.000Z',
        }}
        isHost={false}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByRole('article', { name: 'Psycho Killer' })).toHaveClass('ds-data-card', 'ds-data-card--compact')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    rerender(
      <MusicCard
        music={{
          id: 'suggested-music-display-test',
          title: 'Suggested Music',
          artist: 'Suggested Artist',
          status: 'SUGGESTED',
          createdAt: '2026-09-11T12:00:00.000Z',
        }}
        isHost
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(/suggested/i)
  })
})
