import type { ParkingCorporateCheckoutStatus } from '@/types/parking-assist';
import { getParkingCheckoutStatusDisplay } from './parkingDisplayHelpers';

type ParkingCheckoutStatusIndicatorProps = {
  status: ParkingCorporateCheckoutStatus | null | undefined;
  statusLabels: Record<ParkingCorporateCheckoutStatus, string>;
  noCheckoutLabel: string;
  className?: string;
};

export function ParkingCheckoutStatusIndicator({
  status,
  statusLabels,
  noCheckoutLabel,
  className = '',
}: ParkingCheckoutStatusIndicatorProps) {
  const { text, indicatorColor } = getParkingCheckoutStatusDisplay(
    status,
    statusLabels,
    noCheckoutLabel,
  );

  return (
    <span
      role="img"
      aria-label={text}
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${indicatorColor} ${className}`}
    />
  );
}
