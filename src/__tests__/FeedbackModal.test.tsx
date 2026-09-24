import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FeedbackModal } from '../components/FeedbackModal'
import { feedbackService } from '../services'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: { count?: number }) => options?.count === undefined ? key : `${key}:${options.count}` }),
}))

vi.mock('../services', () => ({
  feedbackService: { create: vi.fn() },
}))

const create = vi.mocked(feedbackService.create)
const renderModal = () => render(<FeedbackModal isOpen onClose={vi.fn()} portal={false} />)
const submit = () => screen.getByRole('button', { name: 'feedback.submit_button', hidden: true })
const star = (rating: number) => screen.getByRole('radio', { name: `feedback.stars.${rating}`, hidden: true })

beforeEach(() => {
  create.mockReset()
})

describe('FeedbackModal', () => {
  it('explains a missing rating instead of a silent disabled button', async () => {
    renderModal()
    expect(submit()).toBeEnabled()

    await userEvent.click(submit())
    expect(screen.getByRole('alert', { hidden: true })).toHaveTextContent('feedback.rating_required')
    expect(star(1)).toHaveFocus()
    expect(create).not.toHaveBeenCalled()

    await userEvent.click(star(4))
    expect(screen.queryByRole('alert', { hidden: true })).toBeNull()
  })

  it('groups the stars under their question, and names the chosen rating', async () => {
    renderModal()
    expect(screen.getByRole('group', { name: 'feedback.rating_label', hidden: true })).toBeInTheDocument()

    await userEvent.click(star(5))
    expect(star(5)).toBeChecked()
    expect(screen.getByText('feedback.stars.5')).toHaveAttribute('aria-hidden', 'true')
  })

  it('sends the rating and the trimmed comment, then thanks the user in the same space', async () => {
    create.mockResolvedValue({ success: true } as Awaited<ReturnType<typeof feedbackService.create>>)
    renderModal()

    await userEvent.click(star(3))
    fireEvent.change(screen.getByRole('textbox', { hidden: true }), { target: { value: '  Clear flow  ' } })
    await act(async () => {
      await userEvent.click(submit())
    })

    expect(create).toHaveBeenCalledWith({ rating: 3, comment: 'Clear flow' })
    expect(screen.getByText('feedback.success_title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.close', hidden: true })).toBeInTheDocument()
  })

  it('counts the comment and speaks up near the limit', () => {
    renderModal()
    const textbox = screen.getByRole('textbox', { hidden: true })
    fireEvent.change(textbox, { target: { value: 'a'.repeat(460) } })

    const count = screen.getByText('feedback.character_count:460')
    expect(count).toHaveAttribute('data-near')
    expect(count).not.toHaveAttribute('data-full')
    expect(textbox).toHaveAccessibleDescription('feedback.character_count:460')
  })
})
