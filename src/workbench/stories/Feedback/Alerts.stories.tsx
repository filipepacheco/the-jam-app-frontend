import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { Alert } from '../../../components/Alert'
import { PageAlerts } from '../../../components/PageAlerts'
import { ErrorState, Status, SuccessState } from '../../../components/FeedbackStates'
import OfflineBanner from '../../../components/publicDashboard/OfflineBanner'

const meta = {
  title: 'Feedback/Alerts and notifications',
  component: Alert,
  args: { type: 'info', message: 'A programação foi atualizada.' },
  parameters: { a11y: { test: 'todo' } },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

const dismissAlert = fn()

export const StatusVariants: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-4">
      <Alert type="info" title="Informação" message="A programação foi atualizada." />
      <Alert type="success" title="Tudo certo" message="A música foi adicionada à Jam." />
      <Alert type="warning" title="Atenção" message="Há vagas que ainda precisam de músicos." />
      <Alert type="error" title="Não foi possível salvar" message="Confira sua conexão e tente novamente." />
    </div>
  ),
  globals: { theme: 'light' },
}

export const Dismissible: Story = {
  args: {
    type: 'success',
    title: 'Programação salva',
    message: 'Todos já podem consultar a nova ordem das apresentações.',
    onDismiss: dismissAlert,
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /dispensar|dismiss/i }))
    await expect(dismissAlert).toHaveBeenCalledOnce()
  },
}

export const LongLocalizedError: Story = {
  args: {
    type: 'error',
    title: 'No se pudieron guardar los cambios de la programación',
    message: 'Comprueba tu conexión a Internet y vuelve a intentarlo. Los músicos que ya estaban inscritos no perderán su lugar.',
    onDismiss: fn(),
  },
  globals: {
    locale: 'es',
    theme: 'night',
    viewport: { value: 'phone', isRotated: false },
  },
}

const dismissError = fn()
const dismissSuccess = fn()

export const PageLevelSuccessAndError: Story = {
  render: () => (
    <PageAlerts
      error="Não foi possível carregar as inscrições."
      success="A ordem das músicas foi atualizada."
      onDismissError={dismissError}
      onDismissSuccess={dismissSuccess}
      className="grid max-w-3xl gap-3"
    />
  ),
  play: async ({ canvas, userEvent }) => {
    const dismissButtons = canvas.getAllByRole('button', { name: /dispensar|dismiss/i })
    await userEvent.click(dismissButtons[0])
    await userEvent.click(dismissButtons[1])
    await expect(dismissError).toHaveBeenCalledOnce()
    await expect(dismissSuccess).toHaveBeenCalledOnce()
  },
}

export const OfflineNotification: Story = {
  render: () => <OfflineBanner visible message="📵 Sem conexão — exibindo a última programação salva" />,
  globals: {
    reducedMotion: true,
    theme: 'synthwave',
    viewport: { value: 'venue', isRotated: false },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Sem conexão')
  },
}

export const OfflineNotificationHidden: Story = {
  render: () => <OfflineBanner visible={false} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  },
}

export const PersistentRecoveryStates: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-4">
      <Status
        tone="warning"
        title="A conexão está instável"
        description="As alterações continuam salvas neste dispositivo. Tente novamente quando a rede estabilizar."
        action={{ label: 'Tentar novamente', onClick: fn() }}
      />
      <SuccessState
        title="Setlist salvo"
        description="Todos já podem consultar a ordem atualizada das apresentações."
      />
      <ErrorState
        title="Não foi possível atualizar a programação"
        description="Suas inscrições continuam intactas. Verifique a conexão e tente novamente."
        action={{ label: 'Tentar novamente', onClick: fn() }}
      />
    </div>
  ),
  globals: { theme: 'jam-light' },
}
