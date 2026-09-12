import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { SELECTABLE_THEMES } from '../../../design-system/foundations'

const meta = {
  title: 'Foundations/Color and themes',
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'todo' },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const roleGroups = [
  {
    label: 'Surfaces',
    tokens: ['--ds-surface-canvas', '--ds-surface-raised', '--ds-surface-sunken', '--ds-surface-overlay'],
  },
  {
    label: 'Content',
    tokens: ['--ds-content-primary', '--ds-content-secondary', '--ds-content-inverse', '--ds-content-link'],
  },
  {
    label: 'Borders',
    tokens: ['--ds-border-subtle', '--ds-border-strong', '--ds-border-interactive'],
  },
  {
    label: 'Actions and focus',
    tokens: ['--ds-action-primary', '--ds-action-primary-content', '--ds-action-secondary', '--ds-action-danger', '--ds-focus-ring'],
  },
  {
    label: 'Statuses',
    tokens: ['--ds-status-info', '--ds-status-success', '--ds-status-warning', '--ds-status-danger'],
  },
] as const

const panelStyle: CSSProperties = {
  background: 'var(--ds-surface-canvas)',
  color: 'var(--ds-content-primary)',
  borderColor: 'var(--ds-border-subtle)',
}

function ThemePanel({ theme, children }: { theme: string; children?: ReactNode }) {
  return (
    <article
      data-theme={theme}
      data-theme-name={theme}
      className="ds-theme-scope flex min-h-64 flex-col gap-5 rounded-2xl border p-6 shadow-sm"
      style={panelStyle}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ds-content-secondary)' }}>Theme</p>
          <h2 className="text-2xl font-bold">{theme}</h2>
        </div>
        <span
          className="rounded-full px-3 py-1 text-sm font-semibold"
          style={{ background: 'var(--ds-action-primary)', color: 'var(--ds-action-primary-content)' }}
        >
          Live
        </span>
      </header>

      <div
        className="rounded-xl border p-4"
        style={{ background: 'var(--ds-surface-raised)', borderColor: 'var(--ds-border-strong)' }}
      >
        <p className="font-semibold">Midnight Rehearsal</p>
        <p className="text-sm" style={{ color: 'var(--ds-content-secondary)' }}>
          Surface, text, border, action, focus, and status roles adapt together.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label={`${theme} status colors`}>
        <StatusChip label="Info" state="info" color="var(--ds-status-info)" content="var(--ds-status-info-content)" />
        <StatusChip label="Ready" state="success" color="var(--ds-status-success)" content="var(--ds-status-success-content)" />
        <StatusChip label="Pending" state="warning" color="var(--ds-status-warning)" content="var(--ds-status-warning-content)" />
        <StatusChip label="Blocked" state="danger" color="var(--ds-status-danger)" content="var(--ds-status-danger-content)" />
      </div>

      <button
        type="button"
        className="ds-control ds-focusable mt-auto self-start rounded-lg px-4 font-semibold"
        style={{ background: 'var(--ds-action-primary)', color: 'var(--ds-action-primary-content)' }}
      >
        Focus this action
      </button>
      {children}
    </article>
  )
}

function StatusChip({ label, state, color, content }: { label: string; state: string; color: string; content: string }) {
  return (
    <span data-status={state} className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold" style={{ background: color, color: content }}>
      <span aria-hidden="true">●</span>
      {label}
    </span>
  )
}

export const ReferencePresentations: Story = {
  render: () => (
    <div className="p-6" style={{ background: 'var(--ds-surface-sunken)' }}>
      <div className="mx-auto mb-6 max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--ds-content-secondary)' }}>Jam App reference themes</p>
        <h1 className="ds-type-display">Music-native color, from daylight to stage lights</h1>
        <p className="ds-type-body mt-2" style={{ color: 'var(--ds-content-secondary)' }}>
          These are the approved purple and violet reference presentations. Product UI should consume semantic roles so the same hierarchy survives every selectable DaisyUI theme.
        </p>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <ThemePanel theme="jam-light" />
        <ThemePanel theme="jam-dark" />
      </div>
    </div>
  ),
}

export const SemanticRoleReference: Story = {
  globals: { theme: 'jam-dark' },
  render: () => (
    <div className="min-h-screen p-6" style={panelStyle}>
      <div className="mx-auto max-w-6xl">
        <h1 className="ds-type-display">Semantic color roles</h1>
        <p className="ds-type-body mt-2" style={{ color: 'var(--ds-content-secondary)' }}>
          Name UI by purpose, not hue. The swatches below are aliases over the active DaisyUI palette.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {roleGroups.map((group) => (
            <section key={group.label} className="rounded-xl border p-5" style={{ background: 'var(--ds-surface-raised)', borderColor: 'var(--ds-border-subtle)' }}>
              <h2 className="mb-4 text-lg font-bold">{group.label}</h2>
              <ul className="space-y-3">
                {group.tokens.map((token) => (
                  <li key={token} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="size-9 shrink-0 rounded-lg border"
                      style={{ background: `var(${token})`, borderColor: 'var(--ds-border-strong)' }}
                    />
                    <code className="text-xs" style={{ color: 'var(--ds-content-secondary)' }}>{token}</code>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  ),
}

export const SelectableThemeSmoke: Story = {
  render: () => (
    <div className="min-h-screen p-6" style={{ background: 'var(--ds-surface-sunken)' }}>
      <div className="mx-auto max-w-screen-2xl">
        <h1 className="ds-type-display">Selectable-theme smoke gallery</h1>
        <p className="ds-type-body mt-2 mb-8" style={{ color: 'var(--ds-content-secondary)' }}>
          Every theme must preserve readable hierarchy, recognizable status meaning, visible boundaries, and keyboard focus.
        </p>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {SELECTABLE_THEMES.map((theme) => <ThemePanel key={theme} theme={theme} />)}
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement, userEvent }) => {
    const panels = [...canvasElement.querySelectorAll<HTMLElement>('[data-theme-name]')]

    await expect(panels).toHaveLength(SELECTABLE_THEMES.length)
    const actions: HTMLButtonElement[] = []
    for (const [index, theme] of SELECTABLE_THEMES.entries()) {
      const panel = panels[index]
      await expect(panel).toHaveAttribute('data-theme', theme)
      await expect(panel.style.background).toBe('var(--ds-surface-canvas)')
      await expect(panel.style.color).toBe('var(--ds-content-primary)')

      const raisedSurface = panel.querySelector<HTMLElement>('.rounded-xl')
      await expect(raisedSurface).not.toBeNull()
      await expect(raisedSurface!.style.background).toBe('var(--ds-surface-raised)')

      const action = panel.querySelector<HTMLButtonElement>('button.ds-focusable')
      await expect(action).not.toBeNull()
      await expect(action!.style.background).toBe('var(--ds-action-primary)')
      await expect(action!.style.color).toBe('var(--ds-action-primary-content)')
      actions.push(action!)

      const statuses = [...panel.querySelectorAll<HTMLElement>('[data-status]')]
      await expect(statuses).toHaveLength(4)
      for (const state of ['info', 'success', 'warning', 'danger']) {
        const status = panel.querySelector<HTMLElement>(`[data-status="${state}"]`)
        await expect(status).not.toBeNull()
        await expect(status!.style.background).not.toBe('')
        await expect(status!.style.color).not.toBe('')
      }
    }

    for (const index of [0, 1]) {
      await userEvent.tab()
      await expect(actions[index]).toHaveFocus()
      await expect(actions[index].matches(':focus-visible')).toBe(true)
    }
  },
}
