import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Field, FormSubmissionFeedback } from '../components/Field'

describe('canonical form fields', () => {
  it('associates a required label, hint, and validation error with a native input', async () => {
    const user = userEvent.setup()

    render(
      <Field
        id="song-title"
        label="Song title"
        required
        requiredLabel="Required"
        hint="Use the recorded song title."
        error="Enter a song title before continuing."
      >
        <Field.Input name="title" />
      </Field>,
    )

    const input = screen.getByRole('textbox', { name: /song title required/i })
    expect(screen.getByText('Song title').closest('label')).toHaveAttribute('for', 'song-title')
    expect(input).toHaveAttribute('id', 'song-title')
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'song-title-hint song-title-error')
    expect(screen.getByText('Enter a song title before continuing.')).toHaveAttribute('id', 'song-title-error')

    await user.click(input)
    await user.type(input, 'Bluesette')
    expect(input).toHaveValue('Bluesette')
  })

  it('preserves native select and textarea keyboard operation while applying disabled state', async () => {
    const user = userEvent.setup()

    render(
      <>
        <Field id="instrument" label="Instrument">
          <Field.Select name="instrument">
            <option value="">Choose an instrument</option>
            <option value="guitar">Guitar</option>
          </Field.Select>
        </Field>
        <Field id="notes" label="Performance notes" disabled hint="Visible to the host.">
          <Field.Textarea name="notes" />
        </Field>
      </>,
    )

    const select = screen.getByRole('combobox', { name: 'Instrument' })
    await user.selectOptions(select, 'guitar')
    expect(select).toHaveValue('guitar')

    const textarea = screen.getByRole('textbox', { name: 'Performance notes' })
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveAttribute('aria-describedby', 'notes-hint')
    expect(textarea).toHaveClass('ds-field__control', 'ds-control', 'ds-focusable')
  })

  it('announces asynchronous submitting and success states politely, and errors assertively', () => {
    const { rerender } = render(<FormSubmissionFeedback state="submitting" message="Submitting your registration…" />)

    expect(screen.getByRole('status')).toHaveTextContent('Submitting your registration…')
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')

    rerender(<FormSubmissionFeedback state="success" message="Your registration was sent for approval." />)
    expect(screen.getByRole('status')).toHaveTextContent('Your registration was sent for approval.')
    expect(screen.getByRole('status')).not.toHaveAttribute('aria-busy')

    rerender(<FormSubmissionFeedback state="error" message="We could not send your registration. Try again." />)
    expect(screen.getByRole('alert')).toHaveTextContent('We could not send your registration. Try again.')
  })

  it('uses only semantic foundation tokens for field styling', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/Field.css'), 'utf8')

    expect(css).toContain('var(--ds-border-subtle)')
    expect(css).toContain('var(--ds-border-interactive)')
    expect(css).toContain('var(--ds-status-danger)')
    expect(css).toContain('var(--ds-status-success)')
    expect(css).toContain('var(--ds-surface-canvas)')
  })
})
