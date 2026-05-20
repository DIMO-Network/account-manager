import type { Metadata } from 'next';
import type { ParkingAssistSessionDetail, ParkingServicesCatalog } from '@/types/parking-assist';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ParkingSessionClient } from '@/components/parking/ParkingSessionClient';
import { fetchParkingAssistBackend } from '@/libs/ParkingAssistBackend';
import { COLORS, RESPONSIVE } from '@/utils/designSystem';
import { isValidParkingSessionId } from '@/utils/dimoAuthRedirect';

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
      <div className="flex flex-col gap-6 max-w-2xl">
        <Link href="/parking/" className="text-sm text-text-secondary hover:text-text-primary underline">
          {t('back_to_parking')}
        </Link>
        <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.error}`}>{t('session_load_error')}</p>
      </div>
    );
  }

  if ('error' in catalogResult || catalogResult.data.services.length === 0) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <Link href="/parking/" className="text-sm text-text-secondary hover:text-text-primary underline">
          {t('back_to_parking')}
        </Link>
        <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.error}`}>{t('catalog_load_error')}</p>
      </div>
    );
  }

  const translations = {
    vehicle_label: t('vehicle_label'),
    license_plate_label: t('license_plate_label'),
    license_plate_not_set: t('license_plate_not_set'),
    license_plate_missing_hint: t('license_plate_missing_hint'),
    license_plate_required_error: t('license_plate_required_error'),
    parking_service_label: t('parking_service_label'),
    duration_label: t('duration_label'),
    duration_option_60: t('duration_option_60'),
    duration_option_75: t('duration_option_75'),
    duration_option_90: t('duration_option_90'),
    duration_option_105: t('duration_option_105'),
    duration_option_120: t('duration_option_120'),
    duration_missing_hint: t('duration_missing_hint'),
    duration_minutes_required_error: t('duration_minutes_required_error'),
    duration_minutes_invalid_error: t('duration_minutes_invalid_error'),
    parking_service_invalid_error: t('parking_service_invalid_error'),
    zone_code_label: t('zone_code_label'),
    zone_code_placeholder: t('zone_code_placeholder'),
    zone_sign_hint: t('zone_sign_hint'),
    zone_code_missing_hint: t('zone_code_missing_hint'),
    zone_code_required_error: t('zone_code_required_error'),
    triggered_at_label: t('triggered_at_label'),
    checkout_status_label: t('checkout_status_label'),
    pay_with_dimo: t('pay_with_dimo'),
    paying: t('paying'),
    refresh: t('refresh'),
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
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link href="/parking/" className="text-sm text-text-secondary hover:text-text-primary underline">
          {t('back_to_parking')}
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('session_title')}</h1>
        <p className={`${COLORS.text.secondary} leading-relaxed mt-2 ${RESPONSIVE.text.body}`}>
          {t('session_description')}
        </p>
      </div>
      <ParkingSessionClient
        sessionId={sessionId}
        initialDetail={sessionResult.data}
        parkingServicesCatalog={catalogResult.data}
        translations={translations}
        locale={locale}
      />
    </div>
  );
}
