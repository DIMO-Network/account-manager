'use client';

import type { VehicleDefinitionSummary } from './parkingDisplayHelpers';
import type { ParkingAssistHistoryItem, ParkingCorporateCheckoutStatus } from '@/types/parking-assist';
import { ListPagination } from '@/components/ui/ListPagination';
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
    locationPrefix: string;
    locationUnknown: string;
    licensePlatePrefix: string;
    licensePlateNotSet: string;
  };
};

export function ParkingHistoryListClient({
  items,
  statusLabels,
  noCheckoutLabel,
  locale,
  vehicleDefinitionsByTokenId,
  triggerLocationBySessionId,
  detailLabels,
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
            />
          ))}
        </ul>
      )}
    />
  );
}
