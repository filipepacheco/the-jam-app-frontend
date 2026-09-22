import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ErrorBoundary } from '../../../components/ErrorBoundary'

function BrokenContent(): never {
  throw new Error('Deterministic workbench failure')
}

const meta = {
  title: 'Feedback/Error boundary',
  component: ErrorBoundary,
  parameters: { a11y: { test: 'todo' }, layout: 'fullscreen' },
} satisfies Meta<typeof ErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

export const DefaultRecovery: Story = {
  args: { children: <BrokenContent /> },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Try Again' })).toBeEnabled()
  },
}

export const CustomFallback: Story = {
  args: {
    children: <BrokenContent />,
    fallback: (
      <div role="alert" className="alert alert-error">
        Não foi possível abrir esta parte do aplicativo.
      </div>
    ),
  },
  globals: { theme: 'jam-dark' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('Não foi possível')
  },
}
