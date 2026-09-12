/**
 * Feedback Button Component
 * Button that opens the FeedbackModal
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquareHeart } from 'lucide-react'
import { Action, IconAction } from './Action'
import { FeedbackModal } from './FeedbackModal'

interface FeedbackButtonProps {
  className?: string
  iconOnly?: boolean
}

export function FeedbackButton({ className = '', iconOnly = false }: FeedbackButtonProps) {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      {/* The icon-only and the labelled form are two separate canonical
          components: IconAction requires a `label` that becomes the
          accessible name, while Action carries a visible Action.Label. One
          element with a conditional child cannot satisfy both contracts. */}
      {iconOnly ? (
        <IconAction
          variant="quiet"
          className={className}
          onClick={() => setIsModalOpen(true)}
          label={t('feedback.button_label')}
        >
          <MessageSquareHeart className="w-5 h-5" />
        </IconAction>
      ) : (
        <Action
          variant="quiet"
          className={className}
          onClick={() => setIsModalOpen(true)}
          aria-label={t('feedback.button_label')}
        >
          <Action.Icon><MessageSquareHeart className="w-5 h-5" /></Action.Icon>
          <Action.Label>{t('feedback.button_text')}</Action.Label>
        </Action>
      )}

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
