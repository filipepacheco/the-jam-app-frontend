/**
 * Feedback Button Component
 * Button that opens the FeedbackModal
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquareHeart } from 'lucide-react'
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
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`btn btn-ghost gap-2 ${className}`}
        aria-label={t('feedback.button_label')}
      >
        <MessageSquareHeart className="w-5 h-5" />
        {!iconOnly && <span className="hidden sm:inline">{t('feedback.button_text')}</span>}
      </button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
