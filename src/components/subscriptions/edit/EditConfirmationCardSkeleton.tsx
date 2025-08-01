function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export function EditConfirmationCardSkeleton() {
  return (
    <>
      {/* Page Header Skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <SkeletonBox className="w-6 h-6" />
        <SkeletonBox className="w-64 h-6" />
      </div>

      {/* Edit Confirmation Card Skeleton */}
      <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
        {/* Description Section */}
        <div className="px-4 mb-8">
          <SkeletonBox className="w-full h-6" />
        </div>

        {/* Plan Comparison Section */}
        <div className="flex flex-col px-4 gap-6 mb-4">
          {/* Current Plan Card */}
          <div className="relative border border-surface-raised rounded-xl bg-surface-raised p-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <SkeletonBox className="w-24 h-4 mb-1" />
                <SkeletonBox className="w-16 h-3" />
              </div>
            </div>
          </div>

          {/* New Plan Card */}
          <div className="relative border border-surface-raised rounded-xl bg-surface-raised py-4">
            <div className="flex flex-col px-4">
              <SkeletonBox className="w-24 h-4 mb-1" />
              <SkeletonBox className="w-16 h-3" />
            </div>

            {/* Note Section */}
            <div className="border-t border-gray-700 mt-4 pt-4">
              <SkeletonBox className="w-16 h-4 mb-2 px-4" />
              <div className="px-4 space-y-1">
                <SkeletonBox className="w-full h-3" />
                <SkeletonBox className="w-3/4 h-3" />
                <SkeletonBox className="w-2/3 h-3" />
              </div>
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
