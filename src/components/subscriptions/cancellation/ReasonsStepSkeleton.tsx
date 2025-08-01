import { BORDER_RADIUS, RESPONSIVE } from '@/utils/designSystem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export function ReasonsStepSkeleton() {
  return (
    <>
      {/* Header Section */}
      <div className="mb-6">
        <SkeletonBox className="w-48 h-6 mb-2" />
        <SkeletonBox className="w-full h-4" />
      </div>

      {/* Reasons Selection Card */}
      <div className="bg-surface-raised rounded-xl mb-4 py-4">
        <div className="space-y-3 px-4">
          {/* Radio Options */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="flex items-center space-x-3">
              <SkeletonBox className="w-4 h-4 rounded-full" />
              <SkeletonBox className="w-32 h-4" />
            </div>
          ))}
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
