import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export default function ConnectionEditSubscriptionLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Page Header Skeleton */}
      <div className="w-full lg:w-3/4">
        <div className="flex items-center gap-2 mb-4">
          <SkeletonBox className="w-6 h-6" />
          <SkeletonBox className="w-48 h-6" />
        </div>

        {/* Edit Subscription Card Skeleton */}
        <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
          {/* Description Section */}
          <div className="mb-8 px-4">
            <div className="space-y-2">
              <SkeletonBox className="w-3/4 h-6" />
              <SkeletonBox className="w-1/2 h-6" />
            </div>
          </div>

          {/* Plan Options Section */}
          <div className="flex flex-col px-4 gap-3 mb-4">
            {/* Plan Option 1 */}
            <div className="relative p-4 rounded-xl border border-surface-raised min-h-20 bg-surface-raised">
              <div className="flex flex-col">
                <SkeletonBox className="w-24 h-4 mb-1" />
                <SkeletonBox className="w-16 h-3" />
              </div>
            </div>

            {/* Plan Option 2 */}
            <div className="relative p-4 rounded-xl border border-surface-raised min-h-20 bg-surface-raised">
              <div className="flex flex-col">
                <SkeletonBox className="w-24 h-4 mb-1" />
                <SkeletonBox className="w-16 h-3" />
              </div>
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="px-4">
            <SkeletonBox className="w-full h-12 rounded-full mb-2" />
            <SkeletonBox className="w-full h-12 rounded-full" />
          </div>
        </div>
      </div>

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
            <SkeletonBox className="w-full h-10 rounded-full" />
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
    </div>
  );
}
