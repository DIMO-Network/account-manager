'use client';

type SuccessMessageProps = {
  show: boolean;
  onClearAction: () => void;
  onRefreshAction: () => void;
  compact?: boolean;
};

export const SuccessMessage = ({ show, onClearAction, onRefreshAction, compact = false }: SuccessMessageProps) => {
  if (!show) {
    return null;
  }

  const baseClasses = compact
    ? 'p-2 bg-green-50 border border-green-200 rounded text-xs'
    : 'p-4 bg-green-50 border border-green-200 rounded';

  return (
    <div className={baseClasses}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`${compact ? 'w-2 h-2' : 'w-3 h-3'} bg-green-500 rounded-full mr-${compact ? '2' : '3'}`}></div>
          <div>
            <span className={`text-green-800 font-medium ${compact ? 'text-xs' : 'text-lg'}`}>
              ✅ Subscription Activated Successfully!
            </span>
            {!compact && (
              <p className="text-green-700 text-sm mt-1">
                Your R1 device subscription is now active and ready to use.
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefreshAction}
            className={`text-green-600 hover:text-green-800 ${compact ? 'text-xs' : 'text-sm'}`}
            type="button"
            title="Refresh to confirm"
          >
            ↻
            {' '}
            {compact ? '' : 'Refresh'}
          </button>
          {compact && (
            <button
              onClick={onClearAction}
              className="text-green-600 hover:text-green-800 text-xs"
              type="button"
              title="Clear message"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {compact && (
        <p className="text-green-700 mt-1">Your R1 device subscription is now active.</p>
      )}
    </div>
  );
};
