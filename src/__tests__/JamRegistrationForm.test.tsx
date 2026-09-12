import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JamRegistrationForm } from '../components/forms/JamRegistrationForm'
import { registrationJam } from '../workbench/fixtures'

const navigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('JamRegistrationForm canonical field integration', () => {
  it('uses associated native fields, canonical actions, and success feedback for registration', async () => {
    const user = userEvent.setup()
    let finishSubmission: (() => void) | undefined
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => { finishSubmission = resolve }))

    render(<JamRegistrationForm jam={registrationJam} onSubmit={onSubmit} />)

    const specialty = screen.getByRole('combobox', { name: /schedule\.select_instrument common\.required/i })
    expect(specialty).toHaveAttribute('id', 'registration-specialty')
    expect(specialty).toBeRequired()

    const submit = screen.getByRole('button', { name: 'jams.join_this_jam' })
    expect(submit).toBeDisabled()
    expect(submit).toHaveAttribute('aria-describedby', 'registration-prerequisites')

    await user.selectOptions(specialty, 'guitar')
    await user.click(screen.getByRole('checkbox', { name: 'schedule.registration_pending_agreement' }))
    expect(submit).toBeEnabled()
    expect(submit).toHaveAttribute('data-action-variant', 'primary')

    await user.click(submit)
    expect(onSubmit).toHaveBeenCalledWith('guitar', '')
    const loading = await screen.findByRole('button', { name: 'jams.registering' })
    expect(loading).toBeDisabled()
    expect(loading).toHaveAttribute('aria-busy', 'true')
    if (!finishSubmission) throw new Error('Registration submission did not start')
    finishSubmission()
    expect(await screen.findByText('jams.registration_pending_approval')).toHaveAttribute('role', 'status')
  })

  it('preserves field values and provides localized recovery feedback after a request failure', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async () => { throw new Error('Raw server detail') })

    render(<JamRegistrationForm jam={registrationJam} onSubmit={onSubmit} />)

    const specialty = screen.getByRole('combobox', { name: /schedule\.select_instrument common\.required/i })
    await user.selectOptions(specialty, 'guitar')
    await user.click(screen.getByRole('checkbox', { name: 'schedule.registration_pending_agreement' }))
    await user.click(screen.getByRole('button', { name: 'jams.join_this_jam' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('errors.generic_error')
    expect(specialty).toHaveValue('guitar')
    expect(screen.getByRole('button', { name: 'jams.join_this_jam' })).toBeEnabled()
  })
})
