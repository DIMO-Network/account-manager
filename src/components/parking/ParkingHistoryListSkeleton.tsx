import { BORDER_RADIUS } from '@/utils/designSystem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-900 rounded ${className}`} />
  );
}

export function ParkingHistoryItemSkeleton() {
  return (
    <li className={`gap-2 ${BORDER_RADIUS.xl} bg-surface-raised`}>
      <div className="border-b border-gray-600 pb-2">
        <div className="flex flex-row items-center justify-between gap-2 px-4 pt-3 w-full">
          <div className="flex flex-row items-center gap-2">
            <SkeletonBox className="h-2.5 w-2.5 rounded-full" />
            <SkeletonBox className="h-6 w-44" />
          </div>
          <SkeletonBox className="w-2 h-3 shrink-0" />
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        <SkeletonBox className="h-4 w-20" />
        <SkeletonBox className="h-5 w-48" />
        <SkeletonBox className="h-4 w-56" />
        <SkeletonBox className="h-4 w-40" />
      </div>
    </li>
  );
}

type ParkingHistoryListSkeletonProps = {
  count?: number;
};

export function ParkingHistoryListSkeleton({ count = 3 }: ParkingHistoryListSkeletonProps) {
  return (
    <ul className="space-y-4" aria-busy="true" aria-label="Loading parking sessions">
      {Array.from({ length: count }, (_, i) => (
        <ParkingHistoryItemSkeleton key={i} />
      ))}
    </ul>
  );
}
