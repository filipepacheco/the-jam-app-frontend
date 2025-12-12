import {useNavigate} from 'react-router-dom'
import {useAuth} from '../hooks'

function Hero() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const handleStartJam = () => {
    if (isAuthenticated && user?.isHost) {
      navigate('/host/create-jam')
    } else if (isAuthenticated) {
      navigate('/host/dashboard')
    } else {
      navigate('/register')
    }
  }

  const handleJoinMusician = () => {
    if (isAuthenticated) {
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
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white">
            Organize Live Jam Sessions in Real-Time
          </h1>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed text-gray-100">
            Streamline your music events with real-time coordination. Hosts manage the repertoire,
            musicians register for songs, and the audience follows along on live dashboards.
            No more spreadsheets, just seamless jam sessions.
          </p>
          <div className="flex gap-2 sm:gap-4 justify-center lg:justify-start flex-wrap">
            <button
              onClick={handleStartJam}
              className="btn btn-primary btn-sm sm:btn-md lg:btn-lg"
            >
              Start Your First Jam
            </button>
            <button
              onClick={handleJoinMusician}
              className="btn btn-outline btn-sm sm:btn-md lg:btn-lg text-white border-white hover:bg-white hover:text-black"
            >
              Join as Musician
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero

