import { BORDER_RADIUS, RESPONSIVE } from '@/utils/designSystem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export function ConfirmationStepSkeleton() {
  return (
    <>
      {/* Header Section */}
      <div className="mb-6">
        <SkeletonBox className="w-32 h-6 mb-2" />
        <SkeletonBox className="w-full h-4" />
      </div>

      {/* Subscription Details Card */}
      <div className="bg-surface-raised rounded-xl mb-4 pt-4 pb-1">
        <div className="space-y-4">
          {/* Connected To */}
          <div>
            <SkeletonBox className="w-24 h-5 px-4 mb-1" />
            <div className="px-4 pb-3 border-b border-gray-700">
              <SkeletonBox className="w-3/4 h-3 mb-1" />
              <SkeletonBox className="w-1/2 h-3" />
            </div>
          </div>

          {/* Type */}
          <div>
            <SkeletonBox className="w-16 h-5 px-4 mb-1" />
            <div className="px-4 pb-3 border-b border-gray-700">
              <SkeletonBox className="w-2/3 h-3" />
            </div>
          </div>

          {/* Schedule */}
          <div>
            <SkeletonBox className="w-20 h-5 px-4 mb-1" />
            <div className="px-4 pb-3">
              <SkeletonBox className="w-3/4 h-3 mb-1" />
              <SkeletonBox className="w-2/3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <SkeletonBox className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} w-full h-12`} />
        <SkeletonBox className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} w-full h-12`} />
      </div>
    </>
  );
}
