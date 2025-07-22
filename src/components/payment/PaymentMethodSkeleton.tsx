import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type PaymentMethodSkeletonProps = {
  count?: number;
  showNote?: boolean;
};

export const PaymentMethodSkeleton = ({ count = 2, showNote = true }: PaymentMethodSkeletonProps) => {
  return (
    <div className="space-y-4">
      {/* Payment method cards loading */}
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`animate-pulse ${COLORS.background.primary} ${BORDER_RADIUS.lg} p-4 mb-4`}>
          <div className="space-y-3">
            <div className={`animate-pulse ${COLORS.background.tertiary} h-4 w-48 rounded`}></div>
            <div className={`animate-pulse ${COLORS.background.tertiary} h-3 w-32 rounded`}></div>
            <div className={`animate-pulse ${COLORS.background.tertiary} h-3 w-24 rounded`}></div>
            <div className="flex gap-2 mt-4">
              <div className={`animate-pulse ${COLORS.background.tertiary} h-8 w-16 rounded-full`}></div>
              <div className={`animate-pulse ${COLORS.background.tertiary} h-8 w-24 rounded-full`}></div>
              <div className={`animate-pulse ${COLORS.background.tertiary} h-8 w-20 rounded-full`}></div>
            </div>
          </div>
        </div>
      ))}

      {/* Note section loading */}
      {showNote && (
        <div className={`animate-pulse ${COLORS.background.primary} ${BORDER_RADIUS.lg} p-4`}>
          <div className="space-y-2">
            <div className={`animate-pulse ${COLORS.background.tertiary} h-4 w-full rounded`}></div>
            <div className={`animate-pulse ${COLORS.background.tertiary} h-4 w-3/4 rounded`}></div>
            <div className={`animate-pulse ${COLORS.background.tertiary} h-4 w-1/2 rounded`}></div>
          </div>
        </div>
      )}
    </div>
  );
};
