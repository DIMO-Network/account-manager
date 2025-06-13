'use client';

type StatusHeaderProps = {
  serialNumber: string;
  compact?: boolean;
};

export const StatusHeader = ({ serialNumber, compact = false }: StatusHeaderProps) => {
  if (compact) {
    return <h4 className="text-sm font-medium text-gray-900">Subscription Status</h4>;
  }

  return (
    <div className="mb-3">
      <h3 className="text-lg font-semibold mb-3">Device Subscription</h3>
      <div>
        <span className="font-medium">Serial Number:</span>
        {' '}
        {serialNumber}
      </div>
    </div>
  );
};
