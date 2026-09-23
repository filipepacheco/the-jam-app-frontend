import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { setSharedTheme, ThemeProvider, useTheme } from '../hooks/useTheme'

function ThemeSelector() {
  const [theme, setTheme] = useTheme()

  return (
    <>
      <output aria-label="selected theme">{theme}</output>
      <button type="button" onClick={() => setTheme('jam-light')}>Use Jam Light</button>
    </>
  )
}

afterEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('useTheme', () => {
  it('falls back from a stale persisted theme and applies the safe theme to the document', () => {
    window.localStorage.setItem('theme', 'retired-theme')

    render(<ThemeSelector />)

    expect(screen.getByRole('status', { name: 'selected theme' })).toHaveTextContent('jam-light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'jam-light')
  })

  it('updates the persisted product theme through its public selector seam', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)

    await user.click(screen.getByRole('button', { name: 'Use Jam Light' }))

    expect(screen.getByRole('status', { name: 'selected theme' })).toHaveTextContent('jam-light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'jam-light')
    expect(window.localStorage.getItem('jam-app.theme')).toBe('jam-light')
  })

  it('lets a workbench theme global drive the same hook state without replacing a saved preference', () => {
    window.localStorage.setItem('theme', 'dark')

    render(
      <ThemeProvider theme="jam-light" persist={false}>
        <ThemeSelector />
      </ThemeProvider>,
    )

    expect(screen.getByRole('status', { name: 'selected theme' })).toHaveTextContent('jam-light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'jam-light')
    expect(window.localStorage.getItem('theme')).toBe('dark')
  })

  it('keeps cross-tab synchronization safe when another tab stores a stale theme', () => {
    render(<ThemeSelector />)

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'jam-app.theme', newValue: 'retired-theme' }))
    })

    expect(screen.getByRole('status', { name: 'selected theme' })).toHaveTextContent('jam-light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'jam-light')
  })

  it('does not let writes to the legacy generic storage key override the selected theme', () => {
    render(<ThemeSelector />)
    act(() => setSharedTheme('jam-light'))

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'jam-dark' }))
    })

    expect(screen.getByRole('status', { name: 'selected theme' })).toHaveTextContent('jam-light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'jam-light')
  })
})
