import type { VehicleDefinitionSummary } from './parkingDisplayHelpers';
import type {
  ParkingAssistHistoryItem,
  ParkingCorporateCheckoutStatus,
  ParkingServicesCatalog,
} from '@/types/parking-assist';
import Link from 'next/link';
import { ChevronIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { ParkingCheckoutStatusIndicator } from './ParkingCheckoutStatusIndicator';
import { ParkingHistoryDetails } from './ParkingHistoryDetails';
import { ParkingLocalDateTime } from './ParkingLocalDateTime';

type ParkingHistoryItemProps = {
  item: ParkingAssistHistoryItem;
  locale: string;
  statusLabels: Record<ParkingCorporateCheckoutStatus, string>;
  noCheckoutLabel: string;
  vehicleDefinition?: VehicleDefinitionSummary;
  triggerLocation?: string;
  detailLabels: {
    locationUnknown: string;
    licensePlateNotSet: string;
  };
  parkingServicesCatalog: ParkingServicesCatalog;
  durationLabels: Record<string, string>;
  showActiveCountdown?: boolean;
  showExpiredBadge?: boolean;
  expiredLabel: string;
  paidAtLabel: string;
};

export function ParkingHistoryItem({
  item,
  locale,
  statusLabels,
  noCheckoutLabel,
  vehicleDefinition,
  triggerLocation,
  detailLabels,
  parkingServicesCatalog,
  durationLabels,
  showActiveCountdown = false,
  showExpiredBadge = false,
  expiredLabel,
  paidAtLabel,
}: ParkingHistoryItemProps) {
  const href = `/parking/sessions/${item.session.id}`;

  return (
    <li className={`gap-2 ${BORDER_RADIUS.xl} bg-surface-raised`}>
      <Link href={href} className="block">
        <div className="border-b border-gray-600 pb-2">
          <div className="flex flex-row items-center justify-between gap-2 px-4 pt-3 w-full">
            <div className="flex flex-row items-center gap-2 min-w-0">
              <ParkingCheckoutStatusIndicator
                status={item.latestCheckout?.status}
                statusLabels={statusLabels}
                noCheckoutLabel={noCheckoutLabel}
              />
              <h3 className="text-base font-medium leading-6 truncate">
                <ParkingLocalDateTime iso={item.session.triggeredAt} locale={locale} />
              </h3>
            </div>
            <ChevronIcon orientation="right" className={`w-2 h-3 shrink-0 ${COLORS.text.secondary}`} />
          </div>
        </div>
        <ParkingHistoryDetails
          item={item}
          statusLabels={statusLabels}
          noCheckoutLabel={noCheckoutLabel}
          vehicleDefinition={vehicleDefinition}
          triggerLocation={triggerLocation}
          detailLabels={detailLabels}
          parkingServicesCatalog={parkingServicesCatalog}
          durationLabels={durationLabels}
          showActiveCountdown={showActiveCountdown}
          showExpiredBadge={showExpiredBadge}
          expiredLabel={expiredLabel}
          locale={locale}
          paidAtLabel={paidAtLabel}
        />
      </Link>
    </li>
  );
}
