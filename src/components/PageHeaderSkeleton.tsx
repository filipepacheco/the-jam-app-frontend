/**
 * Page Header Skeleton Component
 * Loading skeleton for jam detail page header section
 */

export function PageHeaderSkeleton() {
  return (
    <div className="bg-gradient-to-r from-base-200 to-base-300 border-b border-base-300 animate-pulse">
      <div className="container mx-auto max-w-4xl px-2 sm:px-4 py-4 sm:py-6">
        {/* Back Button Skeleton */}
        <div className="skeleton h-8 sm:h-10 w-24 sm:w-32 rounded mb-3 sm:mb-4"></div>

        {/* Title Skeleton */}
        <div className="skeleton h-8 sm:h-10 lg:h-12 w-3/4 rounded mb-3 sm:mb-4"></div>

        {/* Description Skeleton - 2 lines */}
        <div className="space-y-2 mb-4 sm:mb-6">
          <div className="skeleton h-4 sm:h-5 w-full rounded"></div>
          <div className="skeleton h-4 sm:h-5 w-5/6 rounded"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {[...Array(6)].map((_, index) => (
            <div key={`skeleton-header-${index}`} className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-base-100/50 rounded">
              <div className="skeleton h-4 w-4 sm:w-5 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="skeleton h-3 w-12 rounded"></div>
                <div className="skeleton h-3 w-16 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



