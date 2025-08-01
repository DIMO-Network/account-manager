import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export default function PaymentMethodsLoading() {
  return (
    <div className="flex flex-col">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-6 h-6" />
          <SkeletonBox className="w-48 h-6" />
        </div>
        <SkeletonBox className={`${RESPONSIVE.touchSmall} px-4 py-2 text-sm ${BORDER_RADIUS.full} w-24 h-8`} />
      </div>

      {/* Payment Methods List Skeleton */}
      <div className="space-y-4">
        {/* Payment Method Cards */}
        {[1, 2].map(i => (
          <div key={i} className={`${COLORS.background.primary} ${BORDER_RADIUS.lg} p-4`}>
            <div className="space-y-3">
              {/* Card Type */}
              <SkeletonBox className="h-4 w-48" />
              {/* Card Number */}
              <SkeletonBox className="h-3 w-32" />
              {/* Expiry */}
              <SkeletonBox className="h-3 w-24" />
              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <SkeletonBox className="h-8 w-16 rounded-full" />
                <SkeletonBox className="h-8 w-24 rounded-full" />
                <SkeletonBox className="h-8 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}

        {/* Note Section */}
        <div className={`${COLORS.background.primary} ${BORDER_RADIUS.lg} p-4`}>
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-3/4" />
            <SkeletonBox className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
