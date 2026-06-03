import { ParkingHistoryListSkeleton } from '@/components/parking/ParkingHistoryListSkeleton';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-900 rounded ${className}`} />
  );
}

export default function ParkingLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 max-w-2xl">
      <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
        <SkeletonBox className="w-4 h-4" />
        <SkeletonBox className="h-6 w-36" />
      </div>
      <div className="flex flex-col gap-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
      </div>

      <section>
        <SkeletonBox className="h-6 w-36 mb-3" />
        <ParkingHistoryListSkeleton count={3} />
      </section>
    </div>
  );
}
