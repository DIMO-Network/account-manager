import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export default function ParkingSessionLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <SkeletonBox className="h-4 w-28" />

      <div className="flex flex-col gap-2">
        <SkeletonBox className="h-8 w-44" />
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-4/5" />
      </div>

      <div className={`flex flex-col gap-6 ${BORDER_RADIUS.lg}`}>
        <div className={`${COLORS.background.primary} p-4 flex flex-col gap-4`}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col gap-1">
              <SkeletonBox className="h-4 w-24" />
              <SkeletonBox className="h-4 w-40" />
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <SkeletonBox className="h-4 w-28" />
            <SkeletonBox className={`h-10 w-full ${BORDER_RADIUS.md}`} />
          </div>
          <div className="flex flex-col gap-2">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className={`h-10 w-full ${BORDER_RADIUS.md}`} />
          </div>
          <div className="flex flex-col gap-2">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className={`h-10 w-full ${BORDER_RADIUS.md}`} />
            <SkeletonBox className="h-4 w-full" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <SkeletonBox className={`h-10 w-36 ${BORDER_RADIUS.md}`} />
          <SkeletonBox className={`h-10 w-24 ${BORDER_RADIUS.md}`} />
        </div>
      </div>
    </div>
  );
}
