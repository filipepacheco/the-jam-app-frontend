import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import Navbar from '../components/Navbar'
import { AuthContext } from '../contexts/AuthContext'
import { ThemeProvider } from '../hooks/useTheme'
import { createAuthFixture } from '../workbench/fixtures'
import i18n from '../i18n'

function renderNavbar(theme: 'jam-light' | 'jam-dark') {
  return render(
    <ThemeProvider theme={theme} persist={false}>
      <MemoryRouter>
        <I18nextProvider i18n={i18n.cloneInstance({ lng: 'en', initAsync: false })}>
          <AuthContext.Provider value={createAuthFixture('guest')}>
            <Navbar />
          </AuthContext.Provider>
        </I18nextProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

afterEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('Navbar brand home link', () => {
  it('exposes one presentational Together/Warm lockup through the native Jam App home link', () => {
    renderNavbar('jam-light')

    const homeLink = screen.getByRole('link', { name: 'Jam App' })
    expect(screen.getAllByRole('link', { name: 'Jam App' })).toHaveLength(1)
    expect(homeLink).toHaveAttribute('href', '/')
    expect(homeLink.querySelector('[data-brand-logo]')).toHaveAttribute('data-brand-logo-variant', 'lockup')
    expect(homeLink.querySelector('[data-brand-logo]')).toHaveAttribute('data-brand-logo-surface', 'light')
    expect(homeLink.querySelector('[data-brand-logo]')).toHaveAttribute('data-brand-logo-size', 'xs')
    expect(homeLink).toHaveClass('min-h-[44px]')
  })

  it('passes the selected dark-surface treatment to the presentational artwork', () => {
    renderNavbar('jam-dark')

    const homeLink = screen.getByRole('link', { name: 'Jam App' })
    expect(homeLink.querySelector('[data-brand-logo]')).toHaveAttribute('data-brand-logo-surface', 'dark')
  })
})
