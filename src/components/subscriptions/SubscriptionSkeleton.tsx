import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type SubscriptionSkeletonProps = {
  count?: number;
};

export const SubscriptionSkeleton = ({ count = 3 }: SubscriptionSkeletonProps) => {
  return (
    <ul className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <li key={index} className={`gap-2 ${BORDER_RADIUS.xl} bg-surface-raised`}>
          <div className="block">
            <div className="border-b border-gray-700 pb-2">
              <div className="flex flex-row items-center justify-between gap-2 px-4 pt-3 w-full">
                <div className="flex flex-row items-center gap-2">
                  <div className={`animate-pulse ${COLORS.background.tertiary} w-4 h-4 rounded`}></div>
                  <div className={`animate-pulse ${COLORS.background.tertiary} h-4 w-32 rounded`}></div>
                </div>
                <div className={`animate-pulse ${COLORS.background.tertiary} w-2 h-3 rounded`}></div>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className={`animate-pulse ${COLORS.background.tertiary} h-4 w-48 rounded mb-1`}></div>
              <div className={`animate-pulse ${COLORS.background.tertiary} h-3 w-24 rounded mb-1`}></div>
              <div className={`animate-pulse ${COLORS.background.tertiary} h-3 w-36 rounded`}></div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
