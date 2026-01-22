/**
 * Jam Detail Loading Skeleton Component
 * Provides visual feedback while loading jam data with realistic structure
 */

export function JamDetailLoadingSkeleton() {


  return (
    <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200">
      {/* Header Section */}
      <div className="bg-linear-to-r from-base-200 to-base-300 border-b border-base-300">
        <div className="container mx-auto max-w-4xl px-2 sm:px-4 py-6 sm:py-8">
          {/* Title Skeleton */}
          <div className="h-8 sm:h-10 bg-base-300/50 rounded-lg mb-3 w-3/4 animate-pulse"></div>

          {/* Description Skeleton */}
          <div className="space-y-2 mb-6">
            <div className="h-4 bg-base-300/50 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-base-300/50 rounded w-5/6 animate-pulse"></div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 lg:p-4 bg-base-100/80 rounded-lg"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-base-300/50 rounded animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-3 bg-base-300/50 rounded mb-1 w-16 animate-pulse"></div>
                  <div className="h-4 bg-base-300/50 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Skeleton */}
          <aside className="lg:col-span-1 order-1 lg:order-2 space-y-3">
            {/* Section 1 */}
            <div className="card bg-linear-to-br from-base-200 to-base-300">
              <div className="card-body p-4">
                <div className="h-5 bg-base-300/50 rounded mb-4 w-1/2 animate-pulse"></div>
                <div className="h-32 bg-base-300/50 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="card bg-linear-to-br from-base-200 to-base-300">
              <div className="card-body p-4">
                <div className="h-5 bg-base-300/50 rounded mb-4 w-1/2 animate-pulse"></div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-12 bg-base-300/50 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Timeline Skeleton */}
          <div className="lg:col-span-3 order-2 lg:order-1 space-y-6">
            {/* My Registrations Section */}
            <div className="card bg-linear-to-br from-base-200 to-base-300">
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-base-300/50 rounded w-1/3 animate-pulse"></div>
                  <div className="h-6 w-6 bg-base-300/50 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Performance Timeline Skeleton */}
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="h-6 bg-base-300/50 rounded w-1/3 animate-pulse"></div>
                <div className="h-5 w-12 bg-base-300/50 rounded animate-pulse"></div>
              </div>

              {/* Timeline Items */}
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-[5px] lg:left-1.5 top-0 bottom-0 w-px bg-primary/30"></div>

                <div className="space-y-4 lg:space-y-5">
                  {/* Start Marker */}
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-success/30 border-2 border-base-100 relative z-10"></div>
                    <div className="flex-1 h-10 bg-base-300/50 rounded-lg animate-pulse"></div>
                  </div>

                  {/* Timeline Items Skeleton */}
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-base-300/50 border-2 border-base-100 relative z-10 animate-pulse"></div>
                      <div className="flex-1 space-y-3">
                        <div className="card bg-base-100/50">
                          <div className="card-body p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="h-5 bg-base-300/50 rounded w-2/3 animate-pulse"></div>
                              <div className="h-6 w-16 bg-base-300/50 rounded animate-pulse"></div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-4 bg-base-300/50 rounded w-3/4 animate-pulse"></div>
                              <div className="h-3 bg-base-300/50 rounded w-1/2 animate-pulse"></div>
                            </div>
                            <div className="h-8 bg-base-300/50 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Finish Marker */}
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-base-300/50 border-2 border-base-100 relative z-10"></div>
                    <div className="flex-1 h-10 bg-base-300/50 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Message */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-base-100 px-4 py-3 rounded-lg shadow-lg">
        <span className="loading loading-spinner loading-sm" aria-hidden="true"></span>
        <span className="text-sm font-semibold text-base-content">
          {/* Using empty string as loading message will be handled by parent */}
        </span>
      </div>
    </div>
  )
}
