import type { Metadata } from 'next';
import type { ParkingAssistHistory, ParkingCorporateCheckoutStatus } from '@/types/parking-assist';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ParkingHistoryList } from '@/components/parking/ParkingHistoryList';
import { fetchParkingAssistBackend } from '@/libs/ParkingAssistBackend';
import { COLORS, RESPONSIVE } from '@/utils/designSystem';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Parking',
  });

  return {
    title: t('hub_meta_title'),
  };
}

export default async function ParkingHubPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
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

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('hub_title')}</h1>
        <p className={`${COLORS.text.secondary} leading-relaxed mt-2 ${RESPONSIVE.text.body}`}>
          {t('hub_description')}
        </p>
      </div>

      <section>
        <h2 className={`text-lg font-semibold ${COLORS.text.primary} mb-3`}>{t('history_title')}</h2>
        {'error' in historyResult
          ? (
              <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.error}`}>
                {t('history_load_error')}
              </p>
            )
          : historyResult.data.items.length === 0
            ? (
                <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>{t('history_empty')}</p>
              )
            : (
                <ParkingHistoryList
                  history={historyResult.data}
                  statusLabels={statusLabels}
                  noCheckoutLabel={t('no_checkout')}
                  locale={locale}
                />
              )}
      </section>
    </div>
  );
}
