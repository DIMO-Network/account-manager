import type { ParkingCorporateCheckoutStatus } from '@/types/parking-assist';
import { BORDER_RADIUS, RESPONSIVE } from '@/utils/designSystem';

const STATUS_STYLES: Record<ParkingCorporateCheckoutStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  running: 'bg-blue-500/20 text-blue-300',
  paid: 'bg-green-500/20 text-green-300',
  failed: 'bg-red-500/20 text-red-300',
  cancelled: 'bg-grey-500/20 text-text-secondary',
};

type ParkingCheckoutStatusBadgeProps = {
  status: ParkingCorporateCheckoutStatus;
  label: string;
  /** Softer badge when payment was not required (outside metered hours). */
  variant?: 'default' | 'info';
};

const INFO_BADGE_STYLE = 'bg-amber-500/20 text-amber-300';

export function ParkingCheckoutStatusBadge({
  status,
  label,
  variant = 'default',
}: ParkingCheckoutStatusBadgeProps) {
  const style = variant === 'info' ? INFO_BADGE_STYLE : STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 ${BORDER_RADIUS.md} ${RESPONSIVE.text.body} font-medium ${style}`}
    >
      {label}
    </span>
  );
}
