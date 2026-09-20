import {useTranslation} from 'react-i18next'
import {translationKey} from '../../lib/i18n/translationKeys'
import {Action} from '../Action'
import {Modal} from '../Modal'

interface JamHowItWorksModalProps {
  isOpen: boolean
  onClose: () => void
}

export function JamHowItWorksModal({isOpen, onClose}: JamHowItWorksModalProps) {
  const {t} = useTranslation()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('jams.how_it_works.title')}
      headingLevel="h3"
      size="sm"
      portal
      responsive
      scrollable
      className="max-h-[calc(100dvh-1rem)] sm:max-h-[85vh]"
    >
      <ol className="space-y-3">
        {(['view_schedule', 'register_songs', 'suggest_songs', 'collaborate', 'performance_time'] as const).map((step, index) => (
          <li key={step} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content" aria-hidden="true">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-base-content">{t(translationKey('jams.how_it_works', step))}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-base-content/70">{t(translationKey('jams.how_it_works', `${step}_desc`))}</p>
            </div>
          </li>
        ))}
      </ol>
      <Action className="mt-4 w-full" onClick={onClose}>
        {t('common.close')}
      </Action>
    </Modal>
  )
}
