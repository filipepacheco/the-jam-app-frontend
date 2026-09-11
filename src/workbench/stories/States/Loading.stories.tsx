import type { Meta, StoryObj } from '@storybook/react-vite'
import { FullPageSpinner } from '../../../components/FullPageSpinner'
import { JamCardSkeleton } from '../../../components/JamCardSkeleton'
import { JamDetailLoadingSkeleton } from '../../../components/jam-detail-v2/JamDetailLoadingSkeleton'

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
    theme: 'night',
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
  globals: { theme: 'cupcake', viewport: { value: 'desktop', isRotated: false } },
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
    theme: 'synthwave',
    viewport: { value: 'desktop', isRotated: false },
  },
  parameters: { layout: 'fullscreen' },
}
