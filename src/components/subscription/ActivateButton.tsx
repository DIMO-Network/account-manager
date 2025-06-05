'use client';

type ActivateButtonProps = {
  onActivateAction: () => void;
  activating: boolean;
  compact?: boolean;
};

export const ActivateButton = ({
  onActivateAction,
  activating,
  compact = false,
}: ActivateButtonProps) => {
  const buttonClasses = compact
    ? 'w-full px-3 py-1.5 text-xs font-medium'
    : 'ml-4 px-4 py-2 text-sm font-medium';

  return (
    <button
      onClick={onActivateAction}
      disabled={activating}
      className={`${buttonClasses} text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded transition-colors`}
      type="button"
    >
      {activating ? 'Processing...' : 'Activate Subscription'}
    </button>
  );
};
