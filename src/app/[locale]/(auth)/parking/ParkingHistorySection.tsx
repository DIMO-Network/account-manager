import type { ParkingAssistHistory, ParkingCorporateCheckoutStatus, ParkingServicesCatalog } from '@/types/parking-assist';
import { getTranslations } from 'next-intl/server';
import { ParkingHistoryListClient } from '@/components/parking/ParkingHistoryListClient';
import { fetchParkingAssistBackend } from '@/libs/ParkingAssistBackend';
import { resolveTriggerLocationsBySessionId } from '@/libs/parkingTriggerLocations';
import { resolveVehicleDefinitionsByTokenId } from '@/libs/parkingVehicleDefinitions';
import { COLORS, RESPONSIVE } from '@/utils/designSystem';
import {
  PARKING_DURATION_I18N_KEYS,
  parkingDurationTranslationKey,
} from '@/utils/parking-services';
import { partitionParkingHistoryItems } from '@/utils/parkingSessionExpiry';

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

  const [historyResult, catalogResult] = await Promise.all([
    fetchParkingAssistBackend<ParkingAssistHistory>(
      '/account/parking-assist/history?limit=20&offset=0',
    ),
    fetchParkingAssistBackend<ParkingServicesCatalog>('/account/parking-assist/parking-services'),
  ]);

  if ('error' in historyResult) {
    return (
      <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.error}`}>
        {t('history_load_error')}
      </p>
    );
  }

  if ('error' in catalogResult || catalogResult.data.services.length === 0) {
    return (
      <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.error}`}>
        {t('catalog_load_error')}
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

  const { activeItems, recentItems } = partitionParkingHistoryItems(historyResult.data.items);

  const detailLabels = {
    locationUnknown: t('history_location_unknown'),
    licensePlateNotSet: t('license_plate_not_set'),
  };

  const durationLabels = Object.fromEntries(
    PARKING_DURATION_I18N_KEYS.map(minutes => [
      parkingDurationTranslationKey(minutes),
      t(parkingDurationTranslationKey(minutes) as Parameters<typeof t>[0]),
    ]),
  ) as Record<string, string>;

  const listProps = {
    statusLabels,
    noCheckoutLabel: t('no_checkout'),
    locale,
    vehicleDefinitionsByTokenId: Object.fromEntries(vehicleDefinitionsByTokenId),
    triggerLocationBySessionId: Object.fromEntries(triggerLocationBySessionId),
    detailLabels,
    parkingServicesCatalog: catalogResult.data,
    durationLabels,
    expiredLabel: t('parking_session_expired'),
    paidAtLabel: t('paid_at_label'),
  };

  const sectionHeadingClass = `text-lg font-semibold ${COLORS.text.primary} mb-3`;

  return (
    <>
      {activeItems.length > 0 && (
        <section className="mb-6">
          <h2 className={sectionHeadingClass}>{t('active_sessions_title')}</h2>
          <ParkingHistoryListClient
            {...listProps}
            items={activeItems}
            showActiveCountdown
          />
        </section>
      )}

      {recentItems.length > 0 && (
        <section>
          <h2 className={sectionHeadingClass}>{t('history_title')}</h2>
          <ParkingHistoryListClient
            {...listProps}
            items={recentItems}
            showExpiredBadge
          />
        </section>
      )}
    </>
  );
}
