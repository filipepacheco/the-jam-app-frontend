import type { ChangeEvent } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { JamRegistrationForm } from '../../components/forms/JamRegistrationForm'
import { OAuthButton } from '../../components/forms/OAuthButton'
import { SearchableSelect } from '../../components/forms/SearchableSelect'
import { SupabaseLoginForm } from '../../components/forms/SupabaseLoginForm'
import { MusicFilters } from '../../components/MusicFilters'
import { MusicModalFormFields } from '../../components/MusicModalFormFields'
import { ProfileFormSection } from '../../components/ProfileFormSection'
import { QuickEditPanel } from '../../components/QuickEditPanel'
import { NotesEditor } from '../../components/schedule/NotesEditor'
import { blankMusicForm, inProgressSchedule, registrationJam, searchableMusic } from '../fixtures'

const meta = { title: 'Forms/Current components', parameters: { a11y: { test: 'todo' } } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const SearchableControl: Story = {
  render: () => <SearchableSelect id="music" items={searchableMusic} value="" onChange={fn()} getItemLabel={(item) => item.title} getItemSubLabel={(item) => item.artist} ariaLabel="Music" />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Music' }))
    const page = within(canvasElement.ownerDocument.body)
    const search = await page.findByRole('textbox')
    await userEvent.type(search, 'Satisfaction')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(search).toHaveValue('Satisfaction')
  },
}

export const SearchableLoadingAndDisabled: Story = { render: () => <div className="space-y-3"><SearchableSelect id="loading" items={searchableMusic} value="" onChange={fn()} getItemLabel={(item) => item.title} loading ariaLabel="Loading music" /><SearchableSelect id="disabled" items={searchableMusic} value="music-psycho-killer" onChange={fn()} getItemLabel={(item) => item.title} disabled ariaLabel="Disabled music" /></div> }

const submitRegistration = fn(async () => undefined)
export const RegistrationValidation: Story = {
  render: () => <JamRegistrationForm jam={registrationJam} onSubmit={submitRegistration} />,
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getAllByRole('combobox')[0], 'guitar')
    await userEvent.click(canvas.getByRole('checkbox'))
    await userEvent.click(canvas.getByRole('button', { name: /participar|join|unirme/i }))
    await expect(submitRegistration).toHaveBeenCalledWith('guitar', '')
  },
}

export const Authentication: Story = { render: () => <SupabaseLoginForm onSuccess={fn()} /> }
export const OAuthStates: Story = { render: () => <div className="max-w-sm space-y-2"><OAuthButton provider="google" onClick={fn()} /><OAuthButton provider="spotify" onClick={fn()} loading /></div> }

export const FilterControls: Story = {
  render: () => <MusicFilters searchTerm="long searchable title" onSearchChange={fn()} genreFilter="Rock" onGenreChange={fn()} sortBy="title" onSortChange={fn()} onClearFilters={fn()} genres={['Rock', 'Jazz']} />,
  globals: { viewport: { value: 'phone', isRotated: false } },
}

export const MusicFields: Story = { render: () => <MusicModalFormFields formData={blankMusicForm} onChange={fn()} /> }

export const ProfileFields: Story = {
  render: () => <ProfileFormSection title="Musician profile" icon="🎸" isEditMode fields={[{ name: 'bio', label: 'Biography', type: 'textarea', value: 'A'.repeat(240), onChange: fn<(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void>(), disabled: false, readOnly: false, fullWidth: true }]} />,
}

export const QuickEditAndInstrumentSteppers: Story = { render: () => <QuickEditPanel music={inProgressSchedule.music!} onSave={fn(async () => true)} onCancel={fn()} /> }
export const NotesEditing: Story = {
  render: () => <NotesEditor notes="End on the last chorus" jamMusicId="schedule-fixture" onSave={fn()} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /editar notas|edit notes|editar notas/i }))
    await expect(canvas.getByRole('textbox')).toHaveFocus()
  },
}
