import type { Meta, StoryObj } from '@storybook/react-vite'
import { FullPageSpinner } from '../../../components/FullPageSpinner'
import { JamCardSkeleton } from '../../../components/JamCardSkeleton'
import { JamDetailLoadingSkeleton } from '../../../components/jam-detail-v2/JamDetailLoadingSkeleton'
import { LoadingState, Skeleton } from '../../../components/FeedbackStates'

const meta = {
  title: 'States/Loading',
  parameters: { a11y: { test: 'todo' } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const FullPageUnlabelled: Story = {
  render: () => <FullPageSpinner />,
  parameters: { layout: 'fullscreen' },
}

export const FullPage: Story = {
  render: () => <FullPageSpinner label="Carregando a programação da Jam…" />,
  parameters: { layout: 'fullscreen' },
}

export const FullPageLongLocalizedLabel: Story = {
  render: () => <FullPageSpinner label="Estamos cargando todas las presentaciones y los músicos inscritos…" />,
  globals: {
    locale: 'es',
    theme: 'jam-dark',
    viewport: { value: 'phone', isRotated: false },
  },
  parameters: { layout: 'fullscreen' },
}

export const JamCard: Story = {
  render: () => (
    <div className="max-w-xl">
      <JamCardSkeleton />
    </div>
  ),
  globals: { viewport: { value: 'phone', isRotated: false } },
}

export const JamCardGrid: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <JamCardSkeleton />
      <JamCardSkeleton />
      <JamCardSkeleton />
    </div>
  ),
  globals: { theme: 'jam-light', viewport: { value: 'desktop', isRotated: false } },
}

export const JamDetailPhone: Story = {
  render: () => <JamDetailLoadingSkeleton />,
  globals: {
    reducedMotion: true,
    viewport: { value: 'phone', isRotated: false },
  },
  parameters: { layout: 'fullscreen' },
}

export const JamDetailDesktopTheme: Story = {
  render: () => <JamDetailLoadingSkeleton />,
  globals: {
    theme: 'jam-dark',
    viewport: { value: 'desktop', isRotated: false },
  },
  parameters: { layout: 'fullscreen' },
}

export const CanonicalRegionStates: Story = {
  render: () => (
    <div className="grid max-w-xl gap-4">
      <LoadingState label="Carregando as sessões de jam…" />
      <Skeleton label="Carregando o resumo da sessão" lines={3} />
    </div>
  ),
  globals: {
    reducedMotion: true,
    theme: 'jam-dark',
    locale: 'pt',
  },
}
