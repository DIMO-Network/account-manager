import { BORDER_RADIUS, RESPONSIVE } from '@/utils/designSystem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export function ReviewStepSkeleton() {
  return (
    <>
      {/* Header Section */}
      <div className="mb-6">
        <SkeletonBox className="w-40 h-6 mb-2" />
        <SkeletonBox className="w-full h-4" />
      </div>

      {/* Cancellation Reason Card */}
      <div className="bg-surface-raised rounded-xl mb-4 py-4">
        <div className="px-4">
          <SkeletonBox className="w-40 h-6 mb-2" />
          <SkeletonBox className="w-3/4 h-4" />
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
