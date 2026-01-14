import {useNavigate} from 'react-router-dom'
import {useAuth} from '../hooks'
import {useTranslation} from 'react-i18next'

function Hero() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { t } = useTranslation()

  const handleStartJam = () => {
    if (isAuthenticated && user?.isHost) {
      navigate('/host/dashboard')
    } else if (isAuthenticated) {
      navigate('/jams')
    } else {
      navigate('/register')
    }
  }

  return (
    <div className="hero min-h-96 sm:min-h-screen bg-gradient-to-br from-primary to-secondary px-2 sm:px-4 py-8 sm:py-12 lg:py-16">
      {/* Hero Content */}
      <div className="hero-content text-center lg:text-left">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-primary-content">
            {t('homepage.hero.title')}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed text-primary-content/90">
            {t('homepage.hero.description')}
          </p>
          <div className="flex gap-2 sm:gap-4 justify-center lg:justify-start flex-wrap">
            <button
              onClick={handleStartJam}
              className="btn btn-primary btn-sm sm:btn-md lg:btn-lg"
            >
              {t('homepage.hero.cta_button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero

