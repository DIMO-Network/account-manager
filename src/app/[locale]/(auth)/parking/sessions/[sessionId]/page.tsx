import type { Metadata } from 'next';
import type { VehicleDefinitionSummary } from '@/components/parking/parkingDisplayHelpers';
import type { ParkingAssistSessionDetail, ParkingServicesCatalog } from '@/types/parking-assist';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getDimoVehicleDetails } from '@/app/actions/getDimoVehicleDetails';
import { ParkingSessionClient } from '@/components/parking/ParkingSessionClient';
import { getHumanReadableLocationString } from '@/libs/mapboxGeocoding';
import { fetchParkingAssistBackend } from '@/libs/ParkingAssistBackend';
import { COLORS, RESPONSIVE } from '@/utils/designSystem';
import { isValidParkingSessionId } from '@/utils/dimoAuthRedirect';
import {
  PARKING_DURATION_I18N_KEYS,
  parkingDurationTranslationKey,
} from '@/utils/parking-services';

export async function generateMetadata(props: {
  params: Promise<{ locale: string; sessionId: string }>;
}): Promise<Metadata> {
  const { locale, sessionId } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Parking',
  });

  return {
    title: isValidParkingSessionId(sessionId) ? t('session_meta_title') : t('meta_title'),
  };
}

export default async function ParkingSessionPage(props: {
  params: Promise<{ locale: string; sessionId: string }>;
}) {
  const { locale, sessionId } = await props.params;
  setRequestLocale(locale);

  if (!isValidParkingSessionId(sessionId)) {
    redirect('/parking');
  }

  const t = await getTranslations({
    locale,
    namespace: 'Parking',
  });

  const [sessionResult, catalogResult] = await Promise.all([
    fetchParkingAssistBackend<ParkingAssistSessionDetail>(
      `/account/parking-assist/sessions/${sessionId}`,
    ),
    fetchParkingAssistBackend<ParkingServicesCatalog>('/account/parking-assist/parking-services'),
  ]);

  if ('error' in sessionResult) {
    if (sessionResult.status === 404) {
      notFound();
    }
    return (
      <div className="flex flex-col gap-4 max-w-2xl">
        <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.error}`}>{t('session_load_error')}</p>
        <Link href="/parking/" className={`text-sm ${COLORS.text.secondary} hover:text-text-primary underline`}>
          {t('back_to_parking')}
        </Link>
      </div>
    );
  }

  if ('error' in catalogResult || catalogResult.data.services.length === 0) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl">
        <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.error}`}>{t('catalog_load_error')}</p>
        <Link href="/parking/" className={`text-sm ${COLORS.text.secondary} hover:text-text-primary underline`}>
          {t('back_to_parking')}
        </Link>
      </div>
    );
  }

  const { session } = sessionResult.data;

  const vehicleDefinition: VehicleDefinitionSummary | undefined = await (async () => {
    const apiDef = sessionResult.data.vehicleDefinition;
    if (apiDef?.make && apiDef?.model) {
      return { year: apiDef.year, make: apiDef.make, model: apiDef.model };
    }
    const identity = await getDimoVehicleDetails(String(session.vehicleTokenId));
    const def = identity.success ? identity.vehicle?.definition : null;
    if (def?.make && def?.model) {
      return { year: def.year ?? null, make: def.make, model: def.model };
    }
    return undefined;
  })();

  const readableLocation = await getHumanReadableLocationString(
    session.triggerLatitude,
    session.triggerLongitude,
  );
  const triggerLocation = readableLocation
    ?? (session.triggerLatitude != null
      && session.triggerLongitude != null
      && Number.isFinite(session.triggerLatitude)
      && Number.isFinite(session.triggerLongitude)
      ? `${session.triggerLatitude.toFixed(4)}, ${session.triggerLongitude.toFixed(4)}`
      : undefined);

  const translations = {
    vehicle_label: t('vehicle_label'),
    license_plate_not_set: t('license_plate_not_set'),
    license_plate_missing_hint: t('license_plate_missing_hint'),
    license_plate_required_error: t('license_plate_required_error'),
    parking_service_label: t('parking_service_label'),
    duration_label: t('duration_label'),
    duration_range_parkdetroit: t('duration_range_parkdetroit'),
    duration_range_parkmobile: t('duration_range_parkmobile'),
    durationLabels: Object.fromEntries(
      PARKING_DURATION_I18N_KEYS.map(minutes => [
        parkingDurationTranslationKey(minutes),
        t(parkingDurationTranslationKey(minutes) as Parameters<typeof t>[0]),
      ]),
    ) as Record<string, string>,
    note_label: t('note_label'),
    duration_missing_hint: t('duration_missing_hint'),
    duration_minutes_required_error: t('duration_minutes_required_error'),
    duration_minutes_invalid_error: t('duration_minutes_invalid_error'),
    parking_service_invalid_error: t('parking_service_invalid_error'),
    zone_code_label: t('zone_code_label'),
    zone_code_placeholder: t('zone_code_placeholder'),
    zone_code_required_error: t('zone_code_required_error'),
    location_unknown: t('history_location_unknown'),
    paid_at_label: t('paid_at_label'),
    triggered_at_label: t('triggered_at_label'),
    checkout_status_label: t('checkout_status_label'),
    pay_for_parking: t('pay_for_parking'),
    paying: t('paying'),
    pay_error: t('pay_error'),
    status_pending: t('status_pending'),
    status_running: t('status_running'),
    status_paid: t('status_paid'),
    status_failed: t('status_failed'),
    status_no_payment_required: t('status_no_payment_required'),
    status_cancelled: t('status_cancelled'),
    paid_message: t('paid_message'),
    failed_message: t('failed_message'),
    no_payment_required_message: t('no_payment_required_message'),
    no_checkout: t('no_checkout'),
    pending_queued_message: t('pending_queued_message'),
    pay_submitted_message: t('pay_submitted_message'),
    back_to_parking: t('back_to_parking'),
  };

  return (
    <ParkingSessionClient
      sessionId={sessionId}
      initialDetail={sessionResult.data}
      parkingServicesCatalog={catalogResult.data}
      sessionTitle={t('session_title')}
      sessionDescription={t('session_description')}
      translations={translations}
      triggerLocation={triggerLocation}
      vehicleDefinition={vehicleDefinition}
      locale={locale}
    />
  );
}
