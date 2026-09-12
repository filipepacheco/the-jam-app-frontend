import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { useTranslation } from 'react-i18next'

type SupportedLocale = 'en' | 'es' | 'pt'
type FoundationContext = 'host' | 'phone' | 'shared-display'

const CONTENT: Record<SupportedLocale, Readonly<{
  context: string
  eyebrow: string
  title: string
  description: string
  currentLabel: string
  currentSong: string
  performerLabel: string
  performer: string
  noteLabel: string
  note: string
  primaryAction: string
  secondaryAction: string
}>> = {
  en: {
    context: 'One-handed phone',
    eyebrow: 'Now performing',
    title: 'Dancing in the Moonlight',
    description: 'Keep the next action close while you move through a crowded venue.',
    currentLabel: 'Current song',
    currentSong: 'Dancing in the Moonlight — extended acoustic arrangement',
    performerLabel: 'Performer',
    performer: 'Alexandra Montgomery & The Thursday Night Friends',
    noteLabel: 'Stage note',
    note: 'Bring the second microphone after the bridge; finish together on the final chorus.',
    primaryAction: 'I’m ready',
    secondaryAction: 'View lyrics',
  },
  es: {
    context: 'Consola del anfitrión',
    eyebrow: 'Actuación actual',
    title: 'Bailando bajo la luz de la luna',
    description: 'Mantén la cola y los controles visibles sin comprimir la información importante.',
    currentLabel: 'Canción actual',
    currentSong: 'Bailando bajo la luz de la luna — arreglo acústico extendido',
    performerLabel: 'Intérprete',
    performer: 'Alejandra Montenegro y Los Amigos de los Jueves',
    noteLabel: 'Nota para el escenario',
    note: 'Acerca el segundo micrófono después del puente y terminen juntos en el último estribillo.',
    primaryAction: 'Iniciar actuación',
    secondaryAction: 'Cambiar el orden',
  },
  pt: {
    context: 'Painel compartilhado',
    eyebrow: 'Tocando agora',
    title: 'Não Quero Dinheiro (Só Quero Amar)',
    description: 'Informação essencial com leitura confortável do outro lado do salão.',
    currentLabel: 'Música atual',
    currentSong: 'Não Quero Dinheiro (Só Quero Amar) — versão completa com introdução',
    performerLabel: 'Quem vai cantar',
    performer: 'Maria Eduarda Gonçalves e o Coletivo Quinta-Feira',
    noteLabel: 'Aviso do palco',
    note: 'A próxima apresentação começa em aproximadamente quatro minutos.',
    primaryAction: 'Mostrar próxima música',
    secondaryAction: 'Abrir fila',
  },
}

function getLocale(language: string): SupportedLocale {
  const baseLanguage = language.split('-')[0]
  return baseLanguage === 'en' || baseLanguage === 'es' ? baseLanguage : 'pt'
}

function FoundationsSpecimen({ context }: Readonly<{ context: FoundationContext }>) {
  const { i18n } = useTranslation()
  const content = CONTENT[getLocale(i18n.resolvedLanguage ?? i18n.language)]
  const isSharedDisplay = context === 'shared-display'
  const isHost = context === 'host'
  const controlClass = isSharedDisplay
    ? 'ds-control ds-control--shared-display'
    : isHost
      ? 'ds-control ds-control--host'
      : 'ds-control'

  return (
    <article
      className={`${isSharedDisplay ? 'ds-shared-display ' : ''}mx-auto grid max-w-7xl gap-[var(--ds-space-region)] rounded-box border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-canvas)] p-[var(--ds-space-section)] text-[var(--ds-content-primary)] ${isHost ? 'lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]' : ''}`}
      data-foundation-context={context}
    >
      <section className="grid min-w-0 content-start gap-[var(--ds-space-cluster)]" aria-labelledby={`${context}-heading`}>
        <div className="grid gap-[var(--ds-space-related)]">
          <p className="text-[length:var(--ds-text-caption)] font-[var(--ds-weight-label)] text-[var(--ds-content-secondary)]">
            {content.context} · {content.eyebrow}
          </p>
          <h1 id={`${context}-heading`} className="ds-type-display ds-wrap-user-content">
            {content.title}
          </h1>
        </div>

        <p className="ds-type-body text-[var(--ds-content-secondary)]">{content.description}</p>

        <dl className="grid gap-[var(--ds-space-section)] rounded-box bg-[var(--ds-surface-raised)] p-[var(--ds-space-cluster)]">
          <div className="grid min-w-0 gap-[var(--ds-space-related)]">
            <dt className="text-[length:var(--ds-text-caption)] font-[var(--ds-weight-label)] text-[var(--ds-content-secondary)]">
              {content.currentLabel}
            </dt>
            <dd
              data-content-behavior="truncate-single"
              aria-label={content.currentSong}
              title={content.currentSong}
              style={{ maxInlineSize: '22rem' }}
              className="ds-truncate-single min-w-0 text-[length:var(--ds-text-subheading)] font-[var(--ds-weight-heading)] leading-[var(--ds-leading-heading)]"
            >
              {content.currentSong}
            </dd>
          </div>
          <div className="grid min-w-0 gap-[var(--ds-space-related)]">
            <dt className="text-[length:var(--ds-text-caption)] font-[var(--ds-weight-label)] text-[var(--ds-content-secondary)]">
              {content.performerLabel}
            </dt>
            <dd data-content-behavior="wrap" className="ds-wrap-user-content text-[length:var(--ds-text-body)]">
              {content.performer}
            </dd>
          </div>
        </dl>
      </section>

      <aside className="grid content-start gap-[var(--ds-space-section)] border-t border-[var(--ds-border-subtle)] pt-[var(--ds-space-section)] lg:border-l lg:border-t-0 lg:pl-[var(--ds-space-region)] lg:pt-0">
        <div className="grid gap-[var(--ds-space-compact)]">
          <h2 className="text-[length:var(--ds-text-heading)] font-[var(--ds-weight-heading)] leading-[var(--ds-leading-heading)]">
            {content.noteLabel}
          </h2>
          <p data-content-behavior="wrap" className="ds-type-body ds-wrap-user-content">{content.note}</p>
        </div>

        <div className="flex flex-col gap-[var(--ds-space-compact)] sm:flex-row sm:flex-wrap">
          <button
            type="button"
            data-typography-role="ui"
            className={`${controlClass} ds-focusable ds-type-ui rounded-field bg-[var(--ds-action-primary)] px-[var(--ds-space-cluster)] text-[var(--ds-action-primary-content)]`}
          >
            {content.primaryAction}
          </button>
          <button
            type="button"
            className={`${controlClass} ds-focusable ds-type-ui rounded-field border border-[var(--ds-border-strong)] px-[var(--ds-space-cluster)]`}
          >
            {content.secondaryAction}
          </button>
        </div>
      </aside>
    </article>
  )
}

const meta = {
  title: 'Foundations/Typography, spacing, and responsive',
  component: FoundationsSpecimen,
  parameters: {
    a11y: { test: 'error' },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof FoundationsSpecimen>

export default meta
type Story = StoryObj<typeof meta>

export const PhoneOneHanded: Story = {
  args: { context: 'phone' },
  globals: {
    locale: 'en',
    viewport: { value: 'phone', isRotated: false },
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('heading', { name: 'Dancing in the Moonlight' })).toBeInTheDocument()
    const primaryAction = canvas.getByRole('button', { name: 'I’m ready' })
    await expect(getComputedStyle(primaryAction).minBlockSize).toBe('44px')
    await expect(primaryAction).toHaveAttribute('data-typography-role', 'ui')
    await expect(getComputedStyle(primaryAction).fontWeight).toBe('500')
    await expect(getComputedStyle(canvasElement.querySelector('.ds-wrap-user-content') as HTMLElement).overflowWrap).toBe('anywhere')
  },
}

export const DesktopHostConsole: Story = {
  args: { context: 'host' },
  globals: {
    locale: 'es',
    viewport: { value: 'desktop', isRotated: false },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Nota para el escenario')).toBeInTheDocument()
    const primaryAction = canvas.getByRole('button', { name: 'Iniciar actuación' })
    await expect(getComputedStyle(primaryAction).minBlockSize).toBe('36px')
  },
}

export const VenueSharedDisplay: Story = {
  args: { context: 'shared-display' },
  globals: {
    locale: 'pt',
    theme: 'jam-dark',
    viewport: { value: 'venue', isRotated: false },
  },
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', { name: 'Não Quero Dinheiro (Só Quero Amar)' })
    await expect(heading).toBeInTheDocument()
    await expect(getComputedStyle(heading).fontSize).toBe('48px')
    const primaryAction = canvas.getByRole('button', { name: 'Mostrar próxima música' })
    await expect(getComputedStyle(primaryAction).minBlockSize).toBe('56px')
  },
}

/**
 * Long localized labels are representative of real setlists and must stay
 * usable when translated strings are substantially wider than English.
 */
export const LongLocalizedContent: Story = {
  args: { context: 'host' },
  globals: {
    locale: 'es',
    viewport: { value: 'desktop', isRotated: false },
  },
  play: async ({ canvas, canvasElement }) => {
    const truncatedSong = canvasElement.querySelector<HTMLElement>('[data-content-behavior="truncate-single"]')
    const wrappedContent = canvasElement.querySelectorAll<HTMLElement>('[data-content-behavior="wrap"]')

    await expect(truncatedSong).not.toBeNull()
    await expect(truncatedSong).toHaveAttribute('title', 'Bailando bajo la luz de la luna — arreglo acústico extendido')
    await expect(getComputedStyle(truncatedSong as HTMLElement).whiteSpace).toBe('nowrap')
    await expect(getComputedStyle(truncatedSong as HTMLElement).textOverflow).toBe('ellipsis')
    await expect((truncatedSong as HTMLElement).scrollWidth).toBeGreaterThan((truncatedSong as HTMLElement).clientWidth)

    await expect(wrappedContent.length).toBe(2)
    for (const element of wrappedContent) {
      await expect(getComputedStyle(element).overflowWrap).toBe('anywhere')
    }
    await expect(canvas.getByRole('button', { name: 'Iniciar actuación' })).toBeInTheDocument()
  },
}
