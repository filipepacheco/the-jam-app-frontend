import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import i18n from '../../../i18n'
import {
  ActionableEmptyStateExample,
  DestructiveActionExample,
} from './InteractionAccessibilityContentExamples'

const meta = {
  title: 'Foundations/Interaction, accessibility and content',
  parameters: {
    layout: 'padded',
    a11y: { test: 'error' },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function ActionFeedbackExample() {
  const [state, setState] = useState<'idle' | 'loading' | 'saved' | 'error'>('idle')

  const save = () => {
    setState('loading')
    queueMicrotask(() => setState('saved'))
  }

  return (
    <section className="card max-w-2xl bg-base-200 shadow-sm" aria-labelledby="feedback-heading">
      <div className="card-body gap-4">
        <div>
          <h2 id="feedback-heading" className="card-title">Action feedback and recovery</h2>
          <p className="ds-type-body text-base-content/70">
            Acknowledge the action immediately, prevent duplicate submissions, and keep a recovery action beside the error.
          </p>
        </div>

        <label className="form-control" htmlFor="setlist-name">
          <span className="label">Setlist name</span>
          <input id="setlist-name" className="input input-bordered ds-focusable" defaultValue="Friday night" />
        </label>

        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary ds-control ds-focusable" disabled={state === 'loading'} onClick={save}>
            {state === 'loading' && <span className="loading loading-spinner" aria-hidden="true" />}
            {state === 'loading' ? 'Saving…' : 'Save setlist'}
          </button>
          <button className="btn ds-control ds-focusable" disabled aria-describedby="publish-hint">
            Publish unavailable
          </button>
          <button className="btn btn-ghost ds-control ds-focusable" onClick={() => setState('error')}>
            Preview error
          </button>
        </div>
        <p id="publish-hint" className="text-sm text-base-content/70">
          Publishing is available after the setlist has been saved.
        </p>

        <div aria-live="polite" aria-atomic="true" aria-busy={state === 'loading'}>
          {state === 'loading' && <p role="status">Saving the setlist…</p>}
          {state === 'saved' && <p role="status" className="text-success">Setlist saved. Everyone can see the new order.</p>}
          {state === 'error' && (
            <div role="alert" className="alert alert-error items-center">
              <span>Could not save the setlist. Your changes are still here.</span>
              <button className="btn btn-sm ds-control ds-focusable" onClick={save}>Try again</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export const FeedbackLoadingDisabledAndRecovery: Story = {
  render: () => <ActionFeedbackExample />,
  play: async ({ canvas }) => {
    const saveButton = canvas.getByRole('button', { name: 'Save setlist' })
    await userEvent.click(saveButton)
    await expect(await canvas.findByText('Setlist saved. Everyone can see the new order.')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Preview error' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('Your changes are still here')
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    await expect(await canvas.findByText('Setlist saved. Everyone can see the new order.')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Publish unavailable' })).toBeDisabled()
  },
}

export const KeyboardDialogAndFocusRestoration: Story = {
  render: () => <DestructiveActionExample />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)
    const trigger = page.getByRole('button', { name: 'Remove song' })
    trigger.focus()
    await userEvent.keyboard('{Enter}')

    const dialog = page.getByRole('alertdialog', { name: 'Remove “Midnight Train”?' })
    await expect(dialog).toHaveAccessibleDescription(/cannot be undone/i)
    await expect(page.getByTestId('destructive-background')).toHaveAttribute('inert')
    await expect(page.getByTestId('destructive-background')).toHaveAttribute('aria-hidden', 'true')
    await expect(page.getByRole('button', { name: 'Close confirmation' })).toHaveFocus()

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    await expect(within(dialog).getByRole('button', { name: 'Remove song' })).toHaveFocus()
    await userEvent.keyboard('{Tab}')
    await expect(page.getByRole('button', { name: 'Close confirmation' })).toHaveFocus()

    await userEvent.click(page.getByRole('button', { name: 'Cancel' }))
    await expect(page.queryByRole('alertdialog')).not.toBeInTheDocument()
    await expect(trigger).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await userEvent.click(page.getByRole('button', { name: 'Close confirmation' }))
    await expect(page.queryByRole('alertdialog')).not.toBeInTheDocument()
    await expect(trigger).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('{Escape}')
    await expect(page.queryByRole('alertdialog')).not.toBeInTheDocument()
    await expect(trigger).toHaveFocus()
  },
}

export const ActionableEmptyState: Story = {
  render: () => <ActionableEmptyStateExample />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add the first song' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Song picker opened')
  },
}

export const ReducedMotionCommunicatesTheSameState: Story = {
  globals: { reducedMotion: 'true' },
  render: () => (
    <section className="card max-w-2xl bg-base-200 shadow-sm" aria-labelledby="motion-heading">
      <div className="card-body gap-4">
        <h2 id="motion-heading" className="card-title">Motion is enhancement, not the message</h2>
        <div
          data-testid="state-change"
          className="alert alert-success transition-[opacity,transform] duration-[var(--ds-motion-state)] ease-[var(--ds-ease-out)]"
          role="status"
        >
          <span aria-hidden="true">✓</span>
          <span>Registration confirmed</span>
        </div>
        <p className="ds-type-body text-base-content/70">
          Reduced motion removes travel and long transitions; the icon, text, and live-region announcement still communicate success.
        </p>
      </div>
    </section>
  ),
  play: async ({ canvas }) => {
    await expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)
    await expect(canvas.getByRole('status')).toHaveTextContent('Registration confirmed')
  },
}

const localeExamples = [
  {
    language: 'Português',
    action: 'Adicionar à programação',
    error: 'Não foi possível adicionar a música. Tente novamente.',
    empty: 'Nenhuma música na programação ainda.',
    locale: 'pt',
  },
  {
    language: 'English',
    action: 'Add to schedule',
    error: 'Could not add the song. Try again.',
    empty: 'No songs in the schedule yet.',
    locale: 'en',
  },
  {
    language: 'Español',
    action: 'Añadir a la programación',
    error: 'No se pudo añadir la canción. Inténtalo de nuevo.',
    empty: 'Todavía no hay canciones en la programación.',
    locale: 'es',
  },
] as const

export const MultilingualExpansionAndContentPatterns: Story = {
  render: () => (
    <section aria-labelledby="content-heading">
      <h2 id="content-heading" className="ds-type-display mb-2">Content under real expansion</h2>
      <p className="ds-type-body mb-6 text-base-content/70">
        Put the outcome first, name the recovery action, and let translated labels wrap without truncation.
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {localeExamples.map((example) => (
          <article key={example.language} lang={example.language === 'Português' ? 'pt' : example.language === 'Español' ? 'es' : 'en'} className="card min-w-0 bg-base-200 shadow-sm">
            <div className="card-body gap-3">
              <h3 className="card-title">{example.language}</h3>
              <button className="btn btn-primary h-auto min-h-[var(--ds-control-touch)] whitespace-normal ds-focusable">{example.action}</button>
              <p><strong>Error:</strong> {example.error}</p>
              <p><strong>Empty:</strong> {example.empty}</p>
              <p className="ds-wrap-user-content">
                <strong>Plural:</strong>{' '}
                {[0, 1, 12].map((count) => i18n.t('jams.songs_count', { lng: example.locale, count })).join(' · ')}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  ),
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Adicionar à programação' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Add to schedule' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Añadir a la programación' })).toBeVisible()
    await expect(canvas.getByText('Nenhuma música · 1 música · 12 músicas')).toBeInTheDocument()
    await expect(canvas.getByText('No songs · 1 song · 12 songs')).toBeInTheDocument()
    await expect(canvas.getByText('No hay canciones · 1 canción · 12 canciones')).toBeInTheDocument()
  },
}
