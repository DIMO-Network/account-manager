'use client';

type ErrorDisplayProps = {
  error: string | null;
  compact?: boolean;
};

export const ErrorDisplay = ({ error, compact = false }: ErrorDisplayProps) => {
  if (!error) {
    return null;
  }

  const baseClasses = compact
    ? 'p-2 bg-red-50 border border-red-200 rounded text-xs'
    : 'p-3 bg-red-50 border border-red-200 rounded mb-4';

  return (
    <div className={baseClasses}>
      <span className="text-red-800">
        Error:
        {' '}
        {error}
      </span>
    </div>
  );
};
