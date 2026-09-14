import type {Meta, StoryObj} from '@storybook/react-vite'
import {http, HttpResponse} from 'msw'
import {Route, Routes} from 'react-router-dom'
import {expect} from 'storybook/test'
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
  globals: {authRole: 'host', locale: 'pt', theme: 'jam-light', route: '/host/create-jam', viewport: {value: 'phone', isRotated: false}, reducedMotion: true},
  play: async ({canvas, userEvent}) => {
    const submit = await canvas.findByRole('button', {name: /criar jam/i})
    await userEvent.click(submit)
    const name = canvas.getByRole('textbox', {name: /nome do jam/i})
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(name).toHaveFocus()
    await expect(canvas.getByRole('alert')).toBeVisible()
  },
}

export const EditDeleteConfirmation: Story = {
  render: () => (
    <Routes>
      <Route path="/host/jams/:id/edit" element={<CreateJamPage />} />
    </Routes>
  ),
  globals: {authRole: 'host', locale: 'en', theme: 'jam-dark', route: '/host/jams/jam-edit/edit', viewport: {value: 'desktop', isRotated: false}},
  parameters: {
    a11y: {test: 'error'},
    msw: {handlers: [
      http.get('*/jams/jam-edit', () => HttpResponse.json({success: true, data: {...jamFixtures.active, id: 'jam-edit'}})),
    ]},
  },
  play: async ({canvas, userEvent}) => {
    const remove = await canvas.findByRole('button', {name: /delete jam/i})
    await userEvent.click(remove)
    await expect(canvas.getByRole('alertdialog', {name: /delete/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /yes, delete/i})).toBeVisible()
  },
}

export const MusicianDirectory: Story = {
  render: () => <MusiciansPage port={musiciansPort} />,
  globals: {authRole: 'host', locale: 'en', theme: 'jam-light', viewport: {value: 'desktop', isRotated: false}},
  play: async ({canvas}) => {
    await expect(await canvas.findByRole('heading', {level: 1, name: /musicians directory/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /edit ana host/i})).toBeVisible()
    await expect(canvas.getByRole('spinbutton', {name: /page number/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /last page/i})).toBeVisible()
  },
}

export const MusicianFilteredEmpty: Story = {
  render: () => <MusiciansPage port={musiciansPort} />,
  globals: {authRole: 'host', locale: 'es', theme: 'jam-dark', viewport: {value: 'phone', isRotated: false}, reducedMotion: true},
  play: async ({canvas, userEvent}) => {
    const search = await canvas.findByRole('searchbox')
    await userEvent.type(search, 'no matching musician')
    await expect(canvas.getByRole('heading', {name: /no hay músicos coincidentes/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /limpiar filtros/i})).toBeVisible()
  },
}

export const EmptyMusicianDirectory: Story = {
  render: () => <MusiciansPage port={emptyMusiciansPort} />,
  globals: {authRole: 'host', locale: 'pt', theme: 'jam-light', viewport: {value: 'phone', isRotated: false}, reducedMotion: true},
  play: async ({canvas}) => {
    await expect(await canvas.findByRole('heading', {name: /nenhum músico ainda/i})).toBeVisible()
  },
}

export const RecoverableMusicianError: Story = {
  render: () => <MusiciansPage port={failedMusiciansPort} />,
  globals: {authRole: 'host', locale: 'en', theme: 'jam-dark', viewport: {value: 'desktop', isRotated: false}, reducedMotion: true},
  play: async ({canvas}) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent('The musician directory could not refresh.')
    await expect(canvas.getByRole('button', {name: /try again/i})).toBeVisible()
  },
}
