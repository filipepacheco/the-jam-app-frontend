/**
 * Sidebar Section Skeleton Component
 * Loading skeleton for sidebar sections (How This Jam Works, QR Code, Current Registrations)
 */

export function SidebarSectionSkeleton() {
  return (
    <div className="card bg-base-200 animate-pulse">
      <div className="card-body p-3 sm:p-6">
        {/* Section Title Skeleton */}
        <div className="skeleton h-6 sm:h-7 w-40 rounded mb-3 sm:mb-4"></div>

        {/* Divider Skeleton */}
        <div className="skeleton h-0.5 w-full rounded my-2 sm:my-3"></div>

        {/* Content Lines - 5 lines of varying widths */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          <div className="skeleton h-4 w-full rounded"></div>
          <div className="skeleton h-4 w-full rounded"></div>
          <div className="skeleton h-4 w-5/6 rounded"></div>
          <div className="skeleton h-4 w-full rounded"></div>
          <div className="skeleton h-4 w-3/4 rounded"></div>
        </div>

        {/* Button Skeleton */}
        <div className="flex justify-start">
          <div className="skeleton h-8 sm:h-9 w-32 rounded"></div>
        </div>
      </div>
    </div>
  )
}



