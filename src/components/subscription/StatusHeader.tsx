'use client';

type StatusHeaderProps = {
  connectionId: string;
  compact?: boolean;
};

export const StatusHeader = ({ connectionId, compact = false }: StatusHeaderProps) => {
  if (compact) {
    return <h4 className="text-sm font-medium text-gray-900">Subscription Status</h4>;
  }

  return (
    <div className="mb-3">
      <h3 className="text-lg font-semibold mb-3">Device Subscription</h3>
      <div>
        <span className="font-medium">Connection ID:</span>
        {' '}
        <span className="font-mono text-xs">{connectionId}</span>
      </div>
    </div>
  );
};
