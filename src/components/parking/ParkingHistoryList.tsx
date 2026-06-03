import type { VehicleDefinitionSummary } from './parkingDisplayHelpers';
import type { ParkingAssistHistory, ParkingCorporateCheckoutStatus } from '@/types/parking-assist';
import { ParkingHistoryItem } from './ParkingHistoryItem';

type ParkingHistoryListProps = {
  history: ParkingAssistHistory;
  statusLabels: Record<ParkingCorporateCheckoutStatus, string>;
  noCheckoutLabel: string;
  locale: string;
  vehicleDefinitionsByTokenId: Map<number, VehicleDefinitionSummary>;
  triggerLocationBySessionId: Map<string, string>;
  detailLabels: {
    locationPrefix: string;
    locationUnknown: string;
    licensePlatePrefix: string;
    licensePlateNotSet: string;
  };
};

export function ParkingHistoryList({
  history,
  statusLabels,
  noCheckoutLabel,
  locale,
  vehicleDefinitionsByTokenId,
  triggerLocationBySessionId,
  detailLabels,
}: ParkingHistoryListProps) {
  if (history.items.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-4">
      {history.items.map(item => (
        <ParkingHistoryItem
          key={item.session.id}
          item={item}
          locale={locale}
          statusLabels={statusLabels}
          noCheckoutLabel={noCheckoutLabel}
          vehicleDefinition={vehicleDefinitionsByTokenId.get(item.session.vehicleTokenId)}
          triggerLocation={triggerLocationBySessionId.get(item.session.id)}
          detailLabels={detailLabels}
        />
      ))}
    </ul>
  );
}
