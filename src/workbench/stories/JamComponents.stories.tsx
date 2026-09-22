import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { JamCard } from '../../components/JamCard'
import { JamContextDisplay } from '../../components/JamContextDisplay'
import { CollapsibleSection } from '../../components/jam-detail-v2/CollapsibleSection'
import { DualActionFAB } from '../../components/jam-detail-v2/DualActionFAB'
import { jamFixtures } from '../jamMusicFixtures'

const meta = {
  title: 'Domain/Jam/Summary and actions',
  component: JamCard,
  parameters: { a11y: { test: 'error' } },
  args: { jam: jamFixtures.active },
} satisfies Meta<typeof JamCard>

export default meta
type Story = StoryObj<typeof meta>

export const SummaryCard: Story = {
  globals: {
    locale: 'pt',
    theme: 'jam-light',
    reviewDefaultViewport: 'desktop',
  },
  parameters: {
    a11y: {test: 'error'},
    designSystem: {interaction: {status: 'not-applicable', rationale: 'Static Jam summary hierarchy; navigation behavior is covered by page composition evidence.'}},
  },
}

export const LongTranslatedSummary: Story = {
  args: { jam: jamFixtures.longContent },
  globals: {
    locale: 'es',
    theme: 'jam-dark',
    reviewDefaultViewport: 'phone',
    viewport: { value: 'phone', isRotated: false },
  },
  parameters: {
    a11y: {test: 'error'},
    designSystem: {interaction: {status: 'not-applicable', rationale: 'Static long-content and localization resilience review.'}},
  },
}

export const RegistrationContext: Story = {
  render: () => <JamContextDisplay jam={jamFixtures.active} />,
  globals: {
    locale: 'en',
    theme: 'jam-light',
    viewport: { value: 'desktop', isRotated: false },
  },
  parameters: {
    a11y: {test: 'error'},
    designSystem: {interaction: {status: 'not-applicable', rationale: 'Static registration context summary with no user-operated behavior.'}},
  },
}

export const RegistrationContextWithoutSongs: Story = {
  render: () => (
    <JamContextDisplay jam={{ ...jamFixtures.active, schedules: [], date: undefined }} />
  ),
  globals: { viewport: { value: 'phone', isRotated: false } },
  parameters: {
    a11y: {test: 'error'},
    designSystem: {interaction: {status: 'not-applicable', rationale: 'Static no-songs context summary with no user-operated behavior.'}},
  },
}

export const CollapsibleInteraction: Story = {
  render: () => (
    <div className="max-w-xl">
      <CollapsibleSection title="Performance details" badge="4 songs">
        <p>Soundcheck at 19:30. The host calls each musician before the song.</p>
      </CollapsibleSection>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole('button', { name: /performance details/i })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByText(/soundcheck/i)).toBeVisible()
  },
}

const register = fn()
const suggest = fn()

export const FloatingActionsByPermission: Story = {
  render: () => (
    <div className="min-h-[520px]">
      <p className="max-w-md text-sm text-base-content/70">
        Musician actions remain fixed to the viewport while the Jam schedule scrolls.
      </p>
      <DualActionFAB
        isVisible
        registrationCount={2}
        onRegisterClick={register}
        onSuggestClick={suggest}
      />
    </div>
  ),
  globals: {
    authRole: 'user',
    locale: 'pt',
    theme: 'jam-dark',
    viewport: { value: 'phone', isRotated: false },
  },
  play: async ({ canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    const mainAction = await page.findByRole('button', { name: /participar/i })
    await userEvent.click(mainAction)
    const buttons = page.getAllByRole('button')
    await userEvent.click(buttons.at(-2)!)
    await expect(register).toHaveBeenCalledOnce()
  },
}
