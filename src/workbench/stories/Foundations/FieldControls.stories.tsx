import { useState, type FormEvent } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Action } from '../../../components/Action'
import { Field, FormSubmissionFeedback, type FormSubmissionState } from '../../../components/Field'

const meta = {
  title: 'Foundations/Field controls',
  parameters: { a11y: { test: 'error' } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const CommonStates: Story = {
  render: () => (
    <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
      <Field id="field-title" label="Song title" required requiredLabel="Required" hint="Use the recorded song title.">
        <Field.Input defaultValue="Bluesette" />
      </Field>
      <Field id="field-instrument" label="Instrument" error="Choose the instrument you will play.">
        <Field.Select defaultValue="">
          <option value="">Choose an instrument</option>
          <option value="guitar">Guitar</option>
          <option value="vocals">Vocals</option>
        </Field.Select>
      </Field>
      <Field id="field-notes" label="Performance notes" hint="Visible to the host and other musicians.">
        <Field.Textarea defaultValue="Start after the horn introduction." />
      </Field>
      <Field id="field-disabled" label="Setlist owner" disabled hint="The host chooses this after the jam is created.">
        <Field.Input defaultValue="Host account" />
      </Field>
      <FormSubmissionFeedback state="submitting" message="Saving the setlist…" />
      <FormSubmissionFeedback state="success" message="The setlist was saved." />
      <FormSubmissionFeedback state="error" message="The setlist could not be saved. Try again." />
    </div>
  ),
}

function RegistrationLikeForm() {
  const [title, setTitle] = useState('')
  const [submission, setSubmission] = useState<FormSubmissionState>('idle')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmission(title.trim() ? 'success' : 'error')
  }

  const actionState = submission === 'submitting'
    ? { state: 'loading' as const, loadingLabel: 'Saving song…' }
    : !title.trim()
      ? { state: 'disabled' as const }
      : { state: 'idle' as const }

  return (
    <form className="grid max-w-lg gap-4" onSubmit={handleSubmit}>
      <Field id="composition-title" label="Song title" required requiredLabel="Required" hint="This field supports longer translated labels and instructions.">
        <Field.Input value={title} onChange={(event) => { setTitle(event.target.value); setSubmission('idle') }} />
      </Field>
      <Field id="composition-notes" label="Notas para a apresentação com uma descrição mais longa" hint="A note may wrap without reducing the control target.">
        <Field.Textarea />
      </Field>
      {submission !== 'idle' && (
        <FormSubmissionFeedback
          state={submission}
          message={submission === 'success' ? 'Song saved to the setlist.' : submission === 'error' ? 'Add a song title before saving.' : 'Saving song…'}
        />
      )}
      <Action type="submit" variant="primary" {...actionState}>
        <Action.Label>Save song</Action.Label>
      </Action>
    </form>
  )
}

export const FormComposition: Story = {
  render: () => <RegistrationLikeForm />,
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: /song title required/i })
    await userEvent.type(title, 'Bluesette')
    await userEvent.click(canvas.getByRole('button', { name: 'Save song' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Song saved to the setlist.')
  },
}
