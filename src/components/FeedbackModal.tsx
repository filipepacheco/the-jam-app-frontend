/**
 * Feedback Modal Component
 * Allows users to submit star ratings and optional comments
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'
import { feedbackService } from '../services'
import { Alert } from './Alert'
import { Modal } from './Modal'
import { ModalFooter } from './ModalFooter'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

const MAX_COMMENT_LENGTH = 500

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { t } = useTranslation()
  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(0)
      setComment('')
      setError(null)
      setShowSuccess(false)
    }
  }, [isOpen])

  // Auto-close after success
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        onClose()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess, onClose])

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      setError(t('feedback.rating_required'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await feedbackService.create({
      rating,
      comment: comment.trim() || undefined,
    })

    setIsSubmitting(false)

    if (result.success) {
      setShowSuccess(true)
    } else {
      setError(t('feedback.submit_failed'))
    }
  }, [rating, comment, t])

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_COMMENT_LENGTH) {
      setComment(value)
    }
  }

  if (!isOpen) return null

  const titleContent = (
    <div>
      <span className="font-bold text-lg">{t('feedback.modal_title')}</span>
      <p className="text-sm text-base-content/70 font-normal">{t('feedback.modal_subtitle')}</p>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleContent}
      size="md"
      portal
      responsive
      closeDisabled={isSubmitting}
      footer={
        !showSuccess ? (
          <ModalFooter
            onCancel={onClose}
            onSubmit={() => { void handleSubmit() }}
            submitLabel={isSubmitting ? t('feedback.submitting') : t('feedback.submit_button')}
            submitting={isSubmitting}
            submitDisabled={rating === 0}
          />
        ) : undefined
      }
    >
      {showSuccess ? (
        /* Success State */
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle className="w-16 h-16 text-success mb-4" aria-hidden="true" />
          <h4 className="text-xl font-bold mb-2">{t('feedback.success_title')}</h4>
          <p className="text-base-content/70">{t('feedback.success_message')}</p>
        </div>
      ) : (
        /* Form */
        <div className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert
              type="error"
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          {/* Rating Input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('feedback.rating_label')}</span>
            </label>
            <div className="flex justify-center py-2">
              <div className="rating rating-lg gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <input
                    key={star}
                    type="radio"
                    name="rating"
                    className="mask mask-star-2 bg-warning"
                    checked={rating === star}
                    onChange={() => setRating(star)}
                    aria-label={t(`feedback.stars.${star}`)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-base-content/70">
                {t(`feedback.stars.${rating}`)}
              </p>
            )}
          </div>

          {/* Comment Textarea */}
          <div className="form-control">
            <label className="label" htmlFor="feedback-comment">
              <span className="label-text">{t('feedback.comment_label')}</span>
              <span className="label-text-alt text-base-content/50">
                {t('feedback.character_count', { count: comment.length })}
              </span>
            </label>
            <textarea
              id="feedback-comment"
              className="textarea textarea-bordered h-24 resize-none"
              placeholder={t('feedback.comment_placeholder')}
              value={comment}
              onChange={handleCommentChange}
              disabled={isSubmitting}
              maxLength={MAX_COMMENT_LENGTH}
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
