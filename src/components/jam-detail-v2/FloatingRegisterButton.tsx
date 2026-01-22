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
      className={`fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] btn btn-primary btn-circle btn-lg shadow-2xl transition-[opacity,transform] duration-300 motion-reduce:transition-none z-40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 motion-reduce:scale-100 pointer-events-none'
      }`}
      aria-label={t('jams.register')}
      type="button"
    >
      <div className="relative">
        <span className="text-2xl" aria-hidden="true">📝</span>
        {registrationCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-error text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums">
            {registrationCount}
          </span>
        )}
      </div>
    </button>
  )
}
