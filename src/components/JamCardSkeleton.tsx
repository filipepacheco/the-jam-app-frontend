/**
 * Jam Card Skeleton Component
 * Loading skeleton that matches JamCard structure for better UX during data fetch
 */

export function JamCardSkeleton() {
  return (
    <div className="card bg-base-200 shadow-lg animate-pulse">
      <div className="card-body p-3 sm:p-6">
        {/* Header: Title Skeleton + Badge Skeleton */}
        <div className="flex justify-between items-start gap-2 mb-3 sm:mb-4">
          <div className="flex-1">
            <div className="skeleton h-6 sm:h-7 w-48 rounded"></div>
          </div>
          <div className="skeleton h-6 sm:h-7 w-20 rounded badge"></div>
        </div>

        {/* Date Skeleton */}
        <div className="skeleton h-4 sm:h-5 w-32 rounded mb-3 sm:mb-4"></div>

        {/* Description Skeleton - 3 lines of varying widths */}
        <div className="space-y-2 mb-3 sm:mb-4">
          <div className="skeleton h-4 w-full rounded"></div>
          <div className="skeleton h-4 w-full rounded"></div>
          <div className="skeleton h-4 w-3/4 rounded"></div>
        </div>

        {/* Song Count Skeleton */}
        <div className="skeleton h-4 sm:h-5 w-24 rounded mb-4 sm:mb-6"></div>

        {/* Button Skeleton */}
        <div className="flex justify-end">
          <div className="skeleton h-8 sm:h-10 w-32 rounded"></div>
        </div>
      </div>
    </div>
  )
}



