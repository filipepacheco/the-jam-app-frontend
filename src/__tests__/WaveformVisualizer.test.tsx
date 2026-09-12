import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { WaveformVisualizer } from '../components/publicDashboard/WaveformVisualizer'

afterEach(cleanup)

describe('WaveformVisualizer', () => {
  it('uses a deterministic bar silhouette for a fixed bar count', () => {
    const first = render(<WaveformVisualizer barCount={6} />)
    const firstHeights = Array.from(first.container.querySelectorAll('.w-2')).map((bar) => bar.getAttribute('style'))
    first.unmount()

    const second = render(<WaveformVisualizer barCount={6} />)
    const secondHeights = Array.from(second.container.querySelectorAll('.w-2')).map((bar) => bar.getAttribute('style'))

    expect(secondHeights).toEqual(firstHeights)
  })
})
