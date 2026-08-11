import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export default function DelegateLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Page Header Skeleton */}
      <div className="flex items-center gap-2">
        <SkeletonBox className="w-6 h-6" />
        <SkeletonBox className="w-48 h-6" />
      </div>

      {/* How This Works Section Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <SkeletonBox className="w-32 h-6 mb-2" />
          <SkeletonBox className="w-full h-4 mb-1" />
          <SkeletonBox className="w-5/6 h-4 mb-1" />
          <SkeletonBox className="w-3/4 h-4" />
        </div>
      </div>

      {/* Status Card Skeleton */}
      <div className={`${BORDER_RADIUS.xl} ${COLORS.background.secondary} p-6`}>
        <SkeletonBox className="w-48 h-7 mb-4" />
        <div className="space-y-4">
          <SkeletonBox className="w-full h-10 rounded-md" />
          <SkeletonBox className="w-full h-10 rounded-md" />
          <SkeletonBox className="w-2/3 h-10 rounded-md" />
        </div>
      </div>

      {/* Delegate Form Card Skeleton */}
      <div className={`${BORDER_RADIUS.xl} ${COLORS.background.secondary} p-6`}>
        <SkeletonBox className="w-56 h-7 mb-4" />
        <div className="space-y-4">
          <div>
            <SkeletonBox className="w-40 h-4 mb-1" />
            <SkeletonBox className="w-full h-10 rounded-md" />
          </div>
          <div className="pt-4">
            <SkeletonBox className={`w-full h-12 ${BORDER_RADIUS.full}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
