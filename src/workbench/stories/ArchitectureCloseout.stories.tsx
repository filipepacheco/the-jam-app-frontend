import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { SuggestNewSongModal } from '../../components/jam-detail-v2/SuggestNewSongModal'
import { SuggestSongModal } from '../../components/jam-detail-v2/SuggestSongModal'
import { LiveJamControlPanel } from '../../components/schedule/LiveJamControlPanel'
import { ScheduleEnrollmentModal } from '../../components/schedule/ScheduleEnrollmentModal'
import { ShareModal } from '../../components/ShareModal'
import type { JamParticipationOutcome } from '../../lib/jam-participation/jamParticipationController'
import { scheduleFixtures } from '../jamMusicFixtures'
import { architectureCloseoutHandlers } from '../mocks'

const meta = {
  title: 'Architecture/Closeout workflows',
  parameters: {
    a11y: { test: 'error' },
    msw: { handlers: architectureCloseoutHandlers },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const suggestionSuccess = (entityId: string): JamParticipationOutcome => ({
  code: 'success',
  operation: 'suggestion',
  entityId,
})

export const LiveQueueKeyboardReorder: Story = {
  render: () => <LiveJamControlPanel jamId="jam-live-control" />,
  globals: { locale: 'en', viewport: { value: 'desktop', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByText('Psycho Killer')
    await userEvent.click(canvas.getByRole('button', { name: /arrastar|reorder/i }))
    const items = canvas.getAllByRole('listitem')
    items[0].focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(canvas.getAllByRole('listitem')[1]).toHaveAccessibleName(/Psycho Killer/i)
  },
}

const suggestExisting = fn(async (musicId: string): Promise<JamParticipationOutcome> => (
  suggestionSuccess(musicId)
))

export const ExistingMusicSuggestion: Story = {
  render: () => (
    <SuggestSongModal
      isOpen
      onClose={fn()}
      onSuggest={suggestExisting}
      onCreateNewSong={fn()}
    />
  ),
  globals: { locale: 'en', viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const picker = await canvas.findByLabelText(/select song/i)
    await userEvent.click(picker)
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(await page.findByRole('option', { name: /Psycho Killer/i }))
    await userEvent.click(canvas.getByRole('button', { name: /suggest song/i }))
    await expect(suggestExisting).toHaveBeenCalledWith('music-psycho-killer')
  },
}

const suggestNew = fn(async (): Promise<JamParticipationOutcome> => (
  suggestionSuccess('music-new')
))

export const NewMusicSuggestion: Story = {
  render: () => <SuggestNewSongModal isOpen onClose={fn()} onSubmit={suggestNew} />,
  globals: { locale: 'en', viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/title/i, { selector: 'input' }), 'Once in a Lifetime')
    await userEvent.type(canvas.getByLabelText(/artist/i, { selector: 'input' }), 'Talking Heads')
    await userEvent.click(canvas.getByRole('button', { name: /suggest song/i }))
    await expect(suggestNew).toHaveBeenCalled()
  },
}

const enroll = fn(async (): Promise<JamParticipationOutcome> => ({
  code: 'success',
  operation: 'registration',
  entityId: 'registration-new',
}))

export const PerformanceEnrollment: Story = {
  render: () => (
    <ScheduleEnrollmentModal
      schedule={scheduleFixtures[0]}
      isOpen
      onClose={fn()}
      onSubmit={enroll}
    />
  ),
  globals: { locale: 'en', viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByRole('combobox'), 'guitars')
    await userEvent.click(canvas.getByRole('button', { name: /enroll now/i }))
    await expect(enroll).toHaveBeenCalledWith('guitars')
  },
}

const copyShare = fn(async (): Promise<JamParticipationOutcome> => ({
  code: 'share_success',
  method: 'copy',
}))
const shareWhatsApp = fn((): JamParticipationOutcome => ({
  code: 'share_success',
  method: 'whatsapp',
}))
const nativeShare = fn(async (): Promise<JamParticipationOutcome> => ({
  code: 'share_success',
  method: 'native',
}))

export const ShareCapability: Story = {
  render: () => (
    <ShareModal
      isOpen
      onClose={fn()}
      jamId="jam-friday"
      jamSlug="friday-night-jam"
      jamName="Friday Night Jam"
      nativeShareAvailable
      onCopy={copyShare}
      onWhatsApp={shareWhatsApp}
      onNativeShare={nativeShare}
    />
  ),
  globals: { locale: 'en', viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /copy link/i }))
    await expect(canvas.getByRole('status')).toHaveTextContent(/copied/i)
    await expect(copyShare).toHaveBeenCalled()
  },
}
