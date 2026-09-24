/**
 * Feedback Modal Component
 * Allows users to submit star ratings and optional comments
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CheckCircle, Star } from 'lucide-react'
import { feedbackService } from '../services'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { Alert } from './Alert'
import { Action } from './Action'
import { Field } from './Field'
import { OverlayActions, OverlayModal } from './overlays'
import { translationKey } from '../lib/i18n/translationKeys'
import './FeedbackModal.css'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  portal?: boolean
  portalTarget?: Element | DocumentFragment | null
}

const MAX_COMMENT_LENGTH = 500
/** From here the counter speaks up, so the limit is no surprise. */
const NEAR_COMMENT_LIMIT = 450
const STARS = [1, 2, 3, 4, 5]

/** The form's height, but no taller than the dialog body shows without scrolling. */
function visibleHeight(element: HTMLElement | null) {
  const body = element?.parentElement
  if (!element || !body) return undefined
  const style = getComputedStyle(body)
  const room = body.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
  return Math.min(element.offsetHeight, room)
}

export function FeedbackModal({ isOpen, onClose, portal = true, portalTarget }: FeedbackModalProps) {
  const { t } = useTranslation()
  const { prefersReducedMotion } = useReducedMotion()
  const [rating, setRating] = useState<number>(0)
  // The star under the pointer: the row previews that rating before a click.
  const [preview, setPreview] = useState<number>(0)
  const [ratingMissing, setRatingMissing] = useState(false)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const firstStar = useRef<HTMLInputElement>(null)
  const form = useRef<HTMLDivElement>(null)
  // The thank-you keeps the form's height, so the dialog does not jump.
  const [formHeight, setFormHeight] = useState<number | undefined>()

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(0)
      setPreview(0)
      setRatingMissing(false)
      setComment('')
      setError(null)
      setShowSuccess(false)
      setFormHeight(undefined)
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

  const chooseRating = (star: number) => {
    setRating(star)
    setRatingMissing(false)
  }

  const handleSubmit = useCallback(async () => {
    // The button stays enabled, so a missing rating is explained, not silent.
    if (rating === 0) {
      setRatingMissing(true)
      firstStar.current?.focus()
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
      setFormHeight(visibleHeight(form.current))
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

  const shown = preview || rating
  // The icon resolves from blurred and small; the lines follow it, a beat apart.
  const reveal = (order: number) => prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay: order * 0.1 } }
    : order === 0
      ? { initial: { opacity: 0, scale: 0.25, filter: 'blur(4px)' }, animate: { opacity: 1, scale: 1, filter: 'blur(0px)' }, transition: { type: 'spring' as const, duration: 0.3, bounce: 0 } }
      : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { type: 'spring' as const, duration: 0.3, bounce: 0, delay: order * 0.1 } }

  return (
    <OverlayModal
      isOpen={isOpen}
      onDismiss={onClose}
      closeLabel={t('feedback.close_modal')}
      title={t('feedback.modal_title')}
      description={t('feedback.modal_subtitle')}
      size="md"
      portal={portal}
      portalTarget={portalTarget}
      dismissible={!isSubmitting}
      actions={
        showSuccess ? (
          <OverlayActions>
            <Action onClick={onClose} variant="quiet">
              <Action.Label>{t('common.close')}</Action.Label>
            </Action>
          </OverlayActions>
        ) : (
          <OverlayActions>
            <Action onClick={onClose} state={isSubmitting ? 'disabled' : 'idle'} variant="quiet">
              <Action.Label>{t('common.cancel')}</Action.Label>
            </Action>
            {isSubmitting ? (
              <Action loadingLabel={t('feedback.submitting')} state="loading" variant="primary">
                <Action.Label>{t('feedback.submit_button')}</Action.Label>
              </Action>
            ) : (
              <Action onClick={() => { void handleSubmit() }} variant="primary">
                <Action.Label>{t('feedback.submit_button')}</Action.Label>
              </Action>
            )}
          </OverlayActions>
        )
      }
    >
      {showSuccess ? (
        /* Success State */
        <div className="feedback-success" style={{ minBlockSize: formHeight }}>
          <motion.span className="feedback-success__icon" {...reveal(0)}>
            <CheckCircle aria-hidden="true" />
          </motion.span>
          <motion.h3 className="feedback-success__title" {...reveal(1)}>{t('feedback.success_title')}</motion.h3>
          <motion.p className="feedback-success__message" {...reveal(2)}>{t('feedback.success_message')}</motion.p>
        </div>
      ) : (
        /* Form */
        <div ref={form} className="feedback-form">
          {/* Error Alert */}
          {error && (
            <Alert
              type="error"
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          {/* Rating Input. This stays a hand-rolled radio group: Field wraps
              exactly one native input/select/textarea, and this is five
              radio inputs sharing one star-rating widget, so it does not
              fit the Field contract. */}
          <fieldset
            className="feedback-rating"
            data-invalid={ratingMissing || undefined}
            aria-describedby={ratingMissing ? 'feedback-rating-error' : undefined}
            disabled={isSubmitting}
          >
            <legend className="feedback-rating__legend ds-type-ui">{t('feedback.rating_label')}</legend>
            <div className="feedback-rating__row">
              <div className="feedback-rating__stars" onPointerLeave={() => setPreview(0)}>
                {STARS.map((star) => (
                  <label
                    key={star}
                    className="feedback-star"
                    data-lit={star <= shown || undefined}
                    data-picked={star === rating || undefined}
                    onPointerEnter={(event) => { if (event.pointerType === 'mouse') setPreview(star) }}
                  >
                    <input
                      ref={star === 1 ? firstStar : undefined}
                      type="radio"
                      name="feedback-rating"
                      value={star}
                      className="feedback-star__input"
                      checked={rating === star}
                      onChange={() => chooseRating(star)}
                      aria-label={t(translationKey('feedback.stars', star))}
                    />
                    <Star className="feedback-star__icon" aria-hidden="true" />
                  </label>
                ))}
              </div>
              {/* The radios name themselves; this word is for sighted users. */}
              <span className="feedback-rating__verdict" aria-hidden="true">
                {shown > 0 ? t(translationKey('feedback.stars', shown)) : ''}
              </span>
            </div>
            {ratingMissing && (
              <p id="feedback-rating-error" className="feedback-rating__error ds-type-body" role="alert">
                {t('feedback.rating_required')}
              </p>
            )}
          </fieldset>

          {/* Comment Textarea */}
          <Field
            id="feedback-comment"
            className="feedback-comment"
            label={t('feedback.comment_label')}
            hint={(
              <span className="feedback-count" data-near={comment.length >= NEAR_COMMENT_LIMIT || undefined} data-full={comment.length >= MAX_COMMENT_LENGTH || undefined}>
                {t('feedback.character_count', { count: comment.length })}
              </span>
            )}
            disabled={isSubmitting}
          >
            <Field.Textarea
              placeholder={t('feedback.comment_placeholder')}
              value={comment}
              onChange={handleCommentChange}
              maxLength={MAX_COMMENT_LENGTH}
            />
          </Field>
        </div>
      )}
    </OverlayModal>
  )
}
