import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-900 rounded ${className}`} />
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Payment Method Section Skeleton */}
      <div className="hidden lg:flex flex-col gap-4 lg:w-1/4 w-full order-1 lg:order-2">
        {/* Page Header Skeleton */}
        <div className="flex items-center gap-2 lg:hidden">
          <SkeletonBox className="w-6 h-6" />
          <SkeletonBox className="w-32 h-6" />
        </div>

        {/* Payment Method Card Skeleton */}
        <div className={`flex flex-col justify-between ${BORDER_RADIUS.lg} ${COLORS.background.primary} py-3 px-4 min-h-24`}>
          <div className="flex flex-col">
            <div className="mb-4">
              <SkeletonBox className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-3">
              <SkeletonBox className="w-full h-4" />
              <SkeletonBox className="w-3/4 h-4" />
              <SkeletonBox className="w-1/2 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <SkeletonBox className="w-full h-10" />
            <SkeletonBox className="w-full h-10" />
          </div>
        </div>

        {/* Payment Methods Note Skeleton */}
        <div className={`flex flex-col justify-between ${BORDER_RADIUS.lg} ${COLORS.background.primary} py-3 px-4 min-h-24`}>
          <div className="space-y-2">
            <SkeletonBox className="w-full h-4" />
            <SkeletonBox className="w-2/3 h-4" />
          </div>
        </div>
      </div>

      {/* Main Content Section Skeleton */}
      <div className="w-full lg:w-3/4 order-2 lg:order-1">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <SkeletonBox className="w-6 h-6" />
              <SkeletonBox className="w-48 h-6" />
            </div>
          </div>

          {/* Subscription Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4`}>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <SkeletonBox className="w-3/4 h-6" />
                    <SkeletonBox className="w-1/2 h-4" />
                    <div className="flex gap-2">
                      <SkeletonBox className="w-16 h-6" />
                      <SkeletonBox className="w-20 h-6" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:w-1/4">
                    <SkeletonBox className="w-full h-10" />
                    <SkeletonBox className="w-full h-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
