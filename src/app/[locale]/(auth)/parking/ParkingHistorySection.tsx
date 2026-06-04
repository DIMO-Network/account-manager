import type { ParkingAssistHistory, ParkingCorporateCheckoutStatus } from '@/types/parking-assist';
import { getTranslations } from 'next-intl/server';
import { ParkingHistoryListClient } from '@/components/parking/ParkingHistoryListClient';
import { fetchParkingAssistBackend } from '@/libs/ParkingAssistBackend';
import { resolveTriggerLocationsBySessionId } from '@/libs/parkingTriggerLocations';
import { resolveVehicleDefinitionsByTokenId } from '@/libs/parkingVehicleDefinitions';
import { COLORS, RESPONSIVE } from '@/utils/designSystem';

type ParkingHistorySectionProps = {
  locale: string;
};

export async function ParkingHistorySection({ locale }: ParkingHistorySectionProps) {
  const t = await getTranslations({
    locale,
    namespace: 'Parking',
  });

  const statusLabels: Record<ParkingCorporateCheckoutStatus, string> = {
    pending: t('status_pending'),
    running: t('status_running'),
    paid: t('status_paid'),
    failed: t('status_failed'),
    cancelled: t('status_cancelled'),
  };

  const historyResult = await fetchParkingAssistBackend<ParkingAssistHistory>(
    '/account/parking-assist/history?limit=20&offset=0',
  );

  if ('error' in historyResult) {
    return (
      <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.error}`}>
        {t('history_load_error')}
      </p>
    );
  }

  if (historyResult.data.items.length === 0) {
    return (
      <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>
        {t('history_empty')}
      </p>
    );
  }

  const [vehicleDefinitionsByTokenId, triggerLocationBySessionId] = await Promise.all([
    resolveVehicleDefinitionsByTokenId(
      historyResult.data.items.map(item => item.session.vehicleTokenId),
    ),
    resolveTriggerLocationsBySessionId(historyResult.data.items),
  ]);

  const detailLabels = {
    locationPrefix: t('history_location_prefix'),
    locationUnknown: t('history_location_unknown'),
    licensePlatePrefix: t('history_license_plate_prefix'),
    licensePlateNotSet: t('license_plate_not_set'),
  };

  return (
    <ParkingHistoryListClient
      items={historyResult.data.items}
      statusLabels={statusLabels}
      noCheckoutLabel={t('no_checkout')}
      locale={locale}
      vehicleDefinitionsByTokenId={Object.fromEntries(vehicleDefinitionsByTokenId)}
      triggerLocationBySessionId={Object.fromEntries(triggerLocationBySessionId)}
      detailLabels={detailLabels}
    />
  );
}
