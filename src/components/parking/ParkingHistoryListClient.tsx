'use client';

import type { VehicleDefinitionSummary } from './parkingDisplayHelpers';
import type {
  ParkingAssistHistoryItem,
  ParkingCorporateCheckoutStatus,
  ParkingServicesCatalog,
} from '@/types/parking-assist';
import { ListPagination } from '@/components/ui/ListPagination';
import { isExpiredPaidSession } from '@/utils/parkingSessionExpiry';
import { ParkingHistoryItem } from './ParkingHistoryItem';

const PARKING_HISTORY_PAGE_LENGTH = 5;

type ParkingHistoryListClientProps = {
  items: ParkingAssistHistoryItem[];
  statusLabels: Record<ParkingCorporateCheckoutStatus, string>;
  noCheckoutLabel: string;
  locale: string;
  vehicleDefinitionsByTokenId: Record<number, VehicleDefinitionSummary>;
  triggerLocationBySessionId: Record<string, string>;
  detailLabels: {
    locationUnknown: string;
    licensePlateNotSet: string;
  };
  parkingServicesCatalog: ParkingServicesCatalog;
  durationLabels: Record<string, string>;
  showActiveCountdown?: boolean;
  showExpiredBadge?: boolean;
  expiredLabel: string;
};

export function ParkingHistoryListClient({
  items,
  statusLabels,
  noCheckoutLabel,
  locale,
  vehicleDefinitionsByTokenId,
  triggerLocationBySessionId,
  detailLabels,
  parkingServicesCatalog,
  durationLabels,
  showActiveCountdown = false,
  showExpiredBadge = false,
  expiredLabel,
}: ParkingHistoryListClientProps) {
  return (
    <ListPagination
      items={items}
      pageLength={PARKING_HISTORY_PAGE_LENGTH}
      controlsVariant="transparent"
      childrenAction={paginatedItems => (
        <ul className="space-y-4">
          {paginatedItems.map(item => (
            <ParkingHistoryItem
              key={item.session.id}
              item={item}
              locale={locale}
              statusLabels={statusLabels}
              noCheckoutLabel={noCheckoutLabel}
              vehicleDefinition={vehicleDefinitionsByTokenId[item.session.vehicleTokenId]}
              triggerLocation={triggerLocationBySessionId[item.session.id]}
              detailLabels={detailLabels}
              parkingServicesCatalog={parkingServicesCatalog}
              durationLabels={durationLabels}
              showActiveCountdown={showActiveCountdown}
              showExpiredBadge={showExpiredBadge && isExpiredPaidSession(item)}
              expiredLabel={expiredLabel}
            />
          ))}
        </ul>
      )}
    />
  );
}
