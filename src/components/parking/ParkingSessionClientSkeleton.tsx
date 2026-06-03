function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-900 rounded ${className}`} />;
}

/** Matches ParkingSessionClient layout; parent card uses animate-pulse for the loading shimmer. */
export function ParkingSessionClientSkeleton() {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
        <div className="flex h-4 w-4 shrink-0 items-center justify-center">
          <SkeletonBox className="h-2.5 w-2.5 rounded-full" />
        </div>
        <SkeletonBox className="h-6 w-36" />
      </div>
      <div className="flex flex-col gap-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
      </div>

      <div className="flex flex-col justify-between animate-pulse bg-surface-default rounded-2xl py-3">
        <div className="space-y-0">
          {[1, 2, 3].map(i => (
            <div key={i} className="border-b border-gray-700 pb-3">
              <SkeletonBox className="h-4 w-24 mx-4 mb-1" />
              <SkeletonBox className="h-5 w-48 mx-4" />
              <SkeletonBox className="h-3 w-36 mx-4 mt-1 mb-1" />
            </div>
          ))}
          {[1, 2, 3].map(i => (
            <div key={`field-${i}`} className="pb-3">
              <SkeletonBox className="h-4 w-28 mx-4 mb-2" />
              <SkeletonBox className="h-10 w-[calc(100%-2rem)] mx-4" />
            </div>
          ))}
        </div>

        <div className="flex flex-col mt-4 px-4 gap-2">
          <SkeletonBox className="h-12 w-full rounded-full" />
          <SkeletonBox className="h-12 w-full rounded-full" />
        </div>
      </div>
    </>
  );
}
