import { useTranslation } from 'react-i18next'

interface FloatingRegisterButtonProps {
  isVisible: boolean
  registrationCount: number
  onClick: () => void
}

export function FloatingRegisterButton({
  isVisible,
  registrationCount,
  onClick,
}: FloatingRegisterButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 btn btn-primary btn-circle btn-lg shadow-2xl transition-[opacity,transform] duration-300 motion-reduce:transition-none z-40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:shadow-xl ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 motion-reduce:scale-100 pointer-events-none'
      }`}
      aria-label={t('jams.register')}
      type="button"
    >
      <div className="relative">
        <span className="text-2xl" aria-hidden="true">📝</span>
        {registrationCount > 0 && (
          <span 
            className="absolute -top-2 -right-2 bg-error text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums"
            aria-label={t('jams.registrations_count', { count: registrationCount })}
            role="status"
          >
            {registrationCount}
          </span>
        )}
      </div>
    </button>
  )
}
