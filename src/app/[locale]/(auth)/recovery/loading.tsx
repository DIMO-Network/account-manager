import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export default function RecoveryLoading() {
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
          <div className="ml-4 space-y-2 mt-1">
            <SkeletonBox className="w-full h-4" />
            <SkeletonBox className="w-full h-4" />
            <SkeletonBox className="w-3/4 h-4" />
            <SkeletonBox className="w-5/6 h-4" />
          </div>
        </div>
        <div className="flex flex-col">
          <SkeletonBox className="w-16 h-6 mb-2" />
          <SkeletonBox className="w-full h-4" />
        </div>
      </div>

      {/* Content Card Skeleton */}
      <div className={`${BORDER_RADIUS.xl} ${COLORS.background.primary} p-6`}>
        <SkeletonBox className="w-48 h-7 mb-4" />
        <div className="space-y-4">
          {/* Wallet Address Display Skeleton */}
          <div>
            <SkeletonBox className="w-40 h-4 mb-1" />
            <SkeletonBox className="w-full h-10 rounded-md" />
            <SkeletonBox className="w-64 h-3 mt-1" />
          </div>

          {/* Network Selection Skeleton */}
          <div>
            <SkeletonBox className="w-48 h-4 mb-1" />
            <SkeletonBox className="w-full h-10 rounded-md" />
          </div>

          {/* Deploy Button Skeleton */}
          <div className="pt-4">
            <SkeletonBox className={`w-full h-12 ${BORDER_RADIUS.full}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
