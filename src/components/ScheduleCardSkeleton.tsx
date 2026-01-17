/**
 * Schedule Card Skeleton Component
 * Loading skeleton for performance schedule card
 */

export function ScheduleCardSkeleton() {
  return (
    <div className="card bg-gradient-to-br from-base-200 to-base-300 animate-pulse">
      <div className="card-body p-3 sm:p-6">
        {/* Card Title Skeleton */}
        <div className="skeleton h-6 sm:h-7 w-48 rounded mb-3 sm:mb-4"></div>

        {/* Schedule Items Skeleton - 3 items */}
        <div className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={`skeleton-schedule-${index}`} className="bg-base-100/50 rounded p-3 sm:p-4 space-y-2">
              {/* Song title skeleton */}
              <div className="skeleton h-5 sm:h-6 w-3/4 rounded"></div>

              {/* Artist skeleton */}
              <div className="skeleton h-4 w-1/2 rounded"></div>

              {/* Musicians/status skeleton */}
              <div className="flex gap-2 mt-2">
                <div className="skeleton h-6 w-20 rounded badge"></div>
                <div className="skeleton h-6 w-20 rounded badge"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Button Skeleton */}
        <div className="flex justify-end mt-4 sm:mt-6">
          <div className="skeleton h-9 sm:h-10 w-28 rounded"></div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleCardSkeleton

