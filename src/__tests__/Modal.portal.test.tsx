import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FeedbackModal } from '../components/FeedbackModal'
import { Modal } from '../components/Modal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../services', () => ({
  feedbackService: { create: vi.fn() },
}))

describe('Modal portal placement', () => {
  it('exposes an open, named dialog to assistive technology', () => {
    render(<Modal isOpen onClose={vi.fn()} title="Accessible modal">Contents</Modal>)

    expect(screen.getByRole('dialog', { name: 'Accessible modal' })).toHaveAttribute('open')
  })

  it('renders into the document body by default when portal rendering is enabled', () => {
    render(<Modal isOpen onClose={vi.fn()} title="Default portal" portal>Contents</Modal>)

    expect(document.querySelector('dialog')?.parentElement).toBe(document.body)
  })

  it('renders into an explicitly supplied portal target', () => {
    const target = document.createElement('section')
    document.body.append(target)

    render(
      <Modal isOpen onClose={vi.fn()} title="Custom portal" portal portalTarget={target}>
        Contents
      </Modal>,
    )

    expect(target.querySelector('dialog')).not.toBeNull()
  })

  it('renders locally when portal rendering is disabled', () => {
    const { container } = render(
      <Modal isOpen onClose={vi.fn()} title="Local modal" portal={false}>
        Contents
      </Modal>,
    )

    expect(container.querySelector('dialog')).not.toBeNull()
  })
})

describe('FeedbackModal portal placement', () => {
  it('preserves document-body portal rendering for existing callers', () => {
    render(<FeedbackModal isOpen onClose={vi.fn()} />)

    expect(document.querySelector('dialog')?.parentElement).toBe(document.body)
  })

  it('supports a workbench-owned portal target', () => {
    const target = document.createElement('section')
    document.body.append(target)

    render(<FeedbackModal isOpen onClose={vi.fn()} portalTarget={target} />)

    expect(target.querySelector('dialog')).not.toBeNull()
  })
})
