import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export default function ParkingLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-2">
        <SkeletonBox className="h-8 w-40" />
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
      </div>

      <section>
        <SkeletonBox className="h-6 w-36 mb-3" />
        <ul className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <li key={i}>
              <div className={`${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <SkeletonBox className="h-4 w-48" />
                    <SkeletonBox className="h-4 w-36" />
                  </div>
                  <SkeletonBox className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
