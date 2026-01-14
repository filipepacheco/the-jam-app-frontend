import {useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'

function CallToAction() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="py-16 sm:py-20 px-4 bg-gradient-to-br from-base-200 to-base-300">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6">
          {t('homepage.call_to_action.title')}
        </h2>
        <p className="text-xl mb-8">
          {t('homepage.call_to_action.description')}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('homepage.call_to_action.cta_button')}
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/jams')}>
            {t('homepage.call_to_action.browse_jams')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CallToAction

