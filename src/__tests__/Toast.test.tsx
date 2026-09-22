import {act, fireEvent, render, screen, within} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {ToastProvider} from '../components/Toast'
import {useToast} from '../components/ToastContext'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

function ToastHarness() {
  const {showToast} = useToast()
  return (
    <>
      <button onClick={() => showToast({message: 'Inscrição realizada com sucesso!'})}>Success</button>
      <button onClick={() => showToast({message: 'Não foi possível salvar', tone: 'error'})}>Error</button>
    </>
  )
}

describe('ToastProvider', () => {
  afterEach(() => vi.useRealTimers())

  it('announces transient success globally and lets the user dismiss it', () => {
    render(<ToastProvider><ToastHarness /></ToastProvider>)

    fireEvent.click(screen.getByRole('button', {name: 'Success'}))

    expect(screen.getByRole('status')).toHaveTextContent('Inscrição realizada com sucesso!')
    expect(screen.getByRole('status')).toHaveAttribute('data-toast-tone', 'success')
    fireEvent.click(within(screen.getByRole('status')).getByRole('button'))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('deduplicates equivalent notifications and uses assertive semantics only for errors', () => {
    render(<ToastProvider><ToastHarness /></ToastProvider>)

    fireEvent.click(screen.getByRole('button', {name: 'Success'}))
    fireEvent.click(screen.getByRole('button', {name: 'Success'}))
    fireEvent.click(screen.getByRole('button', {name: 'Error'}))

    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar')
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })

  it('removes notifications after their lifetime', () => {
    vi.useFakeTimers()
    render(<ToastProvider><ToastHarness /></ToastProvider>)

    fireEvent.click(screen.getByRole('button', {name: 'Success'}))
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(4000))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
