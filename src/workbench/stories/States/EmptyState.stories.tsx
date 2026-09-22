import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { EmptyState } from '../../../components/EmptyState'

const meta = {
  title: 'States/Empty state',
  component: EmptyState,
  parameters: { a11y: { test: 'todo' } },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Informational: Story = {
  args: {
    icon: '🎵',
    title: 'Nenhuma música por aqui',
    description: 'Quando o repertório da Jam for definido, ele aparecerá nesta lista.',
  },
}

const createMusic = fn()

export const WithRecoveryAction: Story = {
  args: {
    icon: '🔎',
    title: 'Não encontramos resultados',
    description: 'Tente buscar pelo nome da música ou do artista usando menos palavras.',
    action: <button className="btn btn-primary" onClick={createMusic}>Cadastrar nova música</button>,
  },
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Cadastrar nova música' }))
    await expect(createMusic).toHaveBeenCalledOnce()
  },
}

export const LongLocalizedContent: Story = {
  args: {
    icon: '🎤',
    title: 'Todavía no hay músicos inscritos para esta presentación',
    description: 'Comparte el enlace de la Jam para que guitarristas, vocalistas, bajistas, teclistas y bateristas puedan reservar los lugares disponibles.',
  },
  globals: {
    locale: 'es',
    theme: 'jam-dark',
    viewport: { value: 'phone', isRotated: false },
  },
}

export const FirstUseGuidance: Story = {
  args: {
    icon: '🎸',
    kind: 'first-use',
    title: 'Ainda não há jams na sua região',
    description: 'Crie a primeira sessão e convide músicos para começar a programação.',
    action: { label: 'Criar uma jam', onClick: createMusic },
  },
  globals: { locale: 'pt', theme: 'jam-light' },
}
