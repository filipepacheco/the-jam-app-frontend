function Features() {
  return (
    <div className="py-8 sm:py-12 lg:py-16 px-2 sm:px-4 lg:px-8 bg-base-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 sm:mb-4">
          Built for Everyone at the Jam
        </h2>
        <p className="text-center text-sm sm:text-base lg:text-lg mb-8 sm:mb-12 max-w-2xl mx-auto">
          Whether you're hosting, performing, or watching, our platform makes jam sessions organized and engaging.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Host Features */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body p-3 sm:p-6">
              <div className="flex justify-center mb-3 sm:mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="card-title justify-center text-base sm:text-lg">For Hosts</h3>
              <p className="text-center text-xs sm:text-sm">
                Create jams, register songs with required slots, approve musician registrations,
                and manage the setlist order in real-time during the event.
              </p>
              <div className="card-actions justify-center mt-3 sm:mt-4">
                <button className="btn btn-primary btn-xs sm:btn-sm">Learn More</button>
              </div>
            </div>
          </div>

          {/* Musician Features */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body p-3 sm:p-6">
              <div className="flex justify-center mb-3 sm:mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="card-title justify-center text-base sm:text-lg">For Musicians</h3>
              <p className="text-center text-xs sm:text-sm">
                Register with your specialties, choose songs to participate in, and track your
                upcoming performances on your personal dashboard with instant updates.
              </p>
              <div className="card-actions justify-center mt-3 sm:mt-4">
                <button className="btn btn-secondary btn-xs sm:btn-sm">Learn More</button>
              </div>
            </div>
          </div>

          {/* Public Features */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body p-3 sm:p-6">
              <div className="flex justify-center mb-3 sm:mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="card-title justify-center text-base sm:text-lg">For the Audience</h3>
              <p className="text-center text-xs sm:text-sm">
                View the complete lineup on public dashboards projected on screens or accessed
                via link, with real-time updates as the jam progresses.
              </p>
              <div className="card-actions justify-center mt-3 sm:mt-4">
                <button className="btn btn-accent btn-xs sm:btn-sm">Learn More</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Features

