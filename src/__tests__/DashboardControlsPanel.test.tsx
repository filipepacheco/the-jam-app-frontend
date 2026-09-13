import {fireEvent, render} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import DashboardControlsPanel from '../components/publicDashboard/DashboardControlsPanel'

describe('DashboardControlsPanel', () => {
  it('closes when Escape is pressed outside the panel', () => {
    const onClose = vi.fn()
    render(
      <DashboardControlsPanel
        visible
        onClose={onClose}
        currentLang="en"
        onChangeLanguage={() => undefined}
      />,
    )

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(onClose).toHaveBeenCalledOnce()
  })
})
