function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export function EditSubscriptionCardSkeleton() {
  return (
    <>
      {/* Page Header Skeleton */}
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
    </>
  );
}
