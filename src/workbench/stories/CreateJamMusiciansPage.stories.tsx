import type {Meta, StoryObj} from '@storybook/react-vite'
import {http, HttpResponse} from 'msw'
import {Route, Routes} from 'react-router-dom'
import {expect, waitFor} from 'storybook/test'
import {CreateJamPage} from '../../pages/host/CreateJamPage'
import {MusiciansPage, type MusiciansPagePort} from '../../pages/host/MusiciansPage'
import {jamFixtures, musicianFixtures} from '../jamMusicFixtures'

const musiciansPort: MusiciansPagePort = {
  list: async (skip, take) => ({
    data: [musicianFixtures.host, musicianFixtures.vocalist, musicianFixtures.drummer],
    meta: {total: 55, skip, take, hasMore: true},
  }),
  update: async () => undefined,
}

const emptyMusiciansPort: MusiciansPagePort = {
  list: async (skip, take) => ({data: [], meta: {total: 0, skip, take, hasMore: false}}),
  update: async () => undefined,
}

const failedMusiciansPort: MusiciansPagePort = {
  list: async () => { throw new Error('The musician directory could not refresh.') },
  update: async () => undefined,
}

const meta = {
  title: 'Human review/Screen refinement/Create Jam and Musicians',
  parameters: {a11y: {test: 'error'}, layout: 'fullscreen'},
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const CreateValidationAndFocus: Story = {
  render: () => <CreateJamPage />,
  globals: {authRole: 'host', locale: 'pt', theme: 'jam-light', route: '/host/create-jam', reviewDefaultViewport: 'phone', reducedMotion: true},
  play: async ({canvas, userEvent}) => {
    const submit = await canvas.findByRole('button', {name: /criar jam/i})
    await userEvent.click(submit)
    const name = canvas.getByRole('textbox', {name: /nome do jam/i})
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(name).toHaveFocus()
    await expect(canvas.getByLabelText(/data/i)).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByLabelText(/horário/i)).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByRole('textbox', {name: /nome do anfitrião/i})).toHaveValue('Ana Host')
    await expect(canvas.getByRole('textbox', {name: /contato do anfitrião/i})).toHaveValue('host@example.test')
    await expect(canvas.getByRole('alert')).toBeVisible()
  },
}

export const CreatedJamWithRecoverableSpotifyImport: Story = {
  render: () => <CreateJamPage />,
  globals: {authRole: 'host', locale: 'pt', theme: 'jam-light', route: '/host/create-jam', reviewDefaultViewport: 'desktop', reducedMotion: true},
  parameters: {
    a11y: {test: 'error'},
    msw: {handlers: [
      http.post('*/jams', () => HttpResponse.json({
        success: true,
        data: {...jamFixtures.active, id: 'jam-created', name: 'Jam do Spotify'},
      }, {status: 201})),
      http.post('*/spotify/import', () => HttpResponse.json({message: 'Spotify is temporarily unavailable'}, {status: 503})),
    ]},
  },
  play: async ({canvas, userEvent}) => {
    await userEvent.type(await canvas.findByRole('textbox', {name: /nome do jam/i}), 'Jam do Spotify')
    await userEvent.type(canvas.getByRole('textbox', {name: /local/i}), 'Benjamin Social Club')
    await userEvent.type(canvas.getByLabelText(/data/i), '2026-09-18')
    await userEvent.type(canvas.getByLabelText(/horário/i), '17:00')
    await userEvent.type(canvas.getByRole('textbox', {name: /url da playlist/i}), 'https://open.spotify.com/playlist/abc')
    await userEvent.click(canvas.getByRole('button', {name: /criar jam/i}))

    await expect(await canvas.findByText(/jam criado, mas não foi possível importar/i)).toBeVisible()
    await expect(canvas.queryByText(/criado com sucesso/i)).toBeNull()
    await expect(canvas.getByRole('button', {name: /^tentar novamente$/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /continuar sem importar/i})).toBeVisible()
    await expect(canvas.getByRole('textbox', {name: /nome do jam/i})).toBeDisabled()
  },
}

export const EditDeleteConfirmation: Story = {
  render: () => (
    <Routes>
      <Route path="/host/jams/:id/edit" element={<CreateJamPage />} />
    </Routes>
  ),
  globals: {authRole: 'host', locale: 'en', theme: 'jam-dark', route: '/host/jams/jam-edit/edit', reviewDefaultViewport: 'desktop'},
  parameters: {
    a11y: {test: 'error'},
    msw: {handlers: [
      http.get('*/jams/jam-edit', () => HttpResponse.json({success: true, data: {...jamFixtures.active, id: 'jam-edit'}})),
    ]},
  },
  play: async ({canvas, userEvent}) => {
    const remove = await canvas.findByRole('button', {name: /delete jam/i})
    await waitFor(() => expect(remove).toBeEnabled())
    await userEvent.click(remove)
    await expect(canvas.getByRole('alertdialog', {name: /delete/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /yes, delete/i})).toBeVisible()
  },
}

export const MusicianDirectory: Story = {
  render: () => <MusiciansPage port={musiciansPort} />,
  globals: {authRole: 'host', locale: 'en', theme: 'jam-light', reviewDefaultViewport: 'desktop'},
  play: async ({canvas}) => {
    await expect(await canvas.findByRole('heading', {level: 1, name: /musicians directory/i})).toBeVisible()
    await expect(canvas.getAllByRole('button', {name: /edit ana host/i}).length).toBeGreaterThan(0)
    await expect(canvas.getByRole('spinbutton', {name: /page number/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /last page/i})).toBeVisible()
  },
}

export const MusicianFilteredEmpty: Story = {
  render: () => <MusiciansPage port={musiciansPort} />,
  globals: {authRole: 'host', locale: 'es', theme: 'jam-dark', reviewDefaultViewport: 'phone', reducedMotion: true},
  play: async ({canvas, userEvent}) => {
    const search = await canvas.findByRole('searchbox')
    await userEvent.type(search, 'no matching musician')
    await expect(canvas.getByRole('heading', {name: /no hay músicos coincidentes/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /limpiar filtros/i})).toBeVisible()
  },
}

export const EmptyMusicianDirectory: Story = {
  render: () => <MusiciansPage port={emptyMusiciansPort} />,
  globals: {authRole: 'host', locale: 'pt', theme: 'jam-light', reviewDefaultViewport: 'phone', reducedMotion: true},
  play: async ({canvas}) => {
    await expect(await canvas.findByRole('heading', {name: /nenhum músico ainda/i})).toBeVisible()
  },
}

export const RecoverableMusicianError: Story = {
  render: () => <MusiciansPage port={failedMusiciansPort} />,
  globals: {authRole: 'host', locale: 'en', theme: 'jam-dark', reviewDefaultViewport: 'desktop', reducedMotion: true},
  play: async ({canvas}) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent('The musician directory could not refresh.')
    await expect(canvas.getByRole('button', {name: /try again/i})).toBeVisible()
  },
}
