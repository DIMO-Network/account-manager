import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type FormSkeletonProps = {
  fieldCount?: number;
  showButtons?: boolean;
};

export const FormSkeleton = ({ fieldCount = 4, showButtons = true }: FormSkeletonProps) => {
  return (
    <div className={`${BORDER_RADIUS.lg} ${COLORS.background.primary} p-6`}>
      <div className="space-y-4">
        {/* Form fields loading */}
        {Array.from({ length: fieldCount }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className="space-y-2">
            {/* Label skeleton */}
            <div className={`animate-pulse ${COLORS.background.tertiary} h-4 w-24 rounded`}></div>
            {/* Input skeleton */}
            <div className={`animate-pulse ${COLORS.background.tertiary} h-10 w-full rounded-md`}></div>
          </div>
        ))}

        {/* Buttons loading */}
        {showButtons && (
          <div className="flex flex-col gap-2 pt-4">
            <div className={`animate-pulse ${COLORS.background.tertiary} h-10 w-full rounded-full`}></div>
            <div className={`animate-pulse ${COLORS.background.tertiary} h-10 w-full rounded-full`}></div>
          </div>
        )}
      </div>
    </div>
  );
};
