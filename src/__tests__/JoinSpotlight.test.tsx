import {render} from '@testing-library/react'
import {I18nextProvider} from 'react-i18next'
import {describe, expect, it, vi} from 'vitest'
import i18n from '../i18n'
import {JoinSpotlight} from '../components/publicDashboard/JoinSpotlight'
import type {JoinMoment} from '../components/publicDashboard/useJoinSpotlight'

const bianca = {id: 'bianca', name: 'Bianca', instrument: 'keys'}

describe('JoinSpotlight', () => {
  it('names one musician once when the sign-ups cover two songs', () => {
    const moment: JoinMoment = {id: 1, lane: 'queue', extra: 0, joins: [
      {key: 'later:bianca', songId: 'later', title: 'Valerie', musician: bianca},
      {key: 'last:bianca', songId: 'last', title: 'Rehab', musician: bianca},
    ]}
    const {container} = render(
      <I18nextProvider i18n={i18n.cloneInstance({lng: 'en', initAsync: false})}>
        <JoinSpotlight moment={moment} paused={false} gentle onDone={vi.fn()} />
      </I18nextProvider>,
    )
    expect(container.querySelector('.venue-join-headline')?.textContent).toBe('Bianca joined the jam!')
    expect(container.querySelector('.venue-join-detail')?.textContent).toBe('On “Valerie” and “Rehab”')
  })
})
