import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { CarIcon } from '@/components/Icons';
import { ParkingHistoryListSkeleton } from '@/components/parking/ParkingHistoryListSkeleton';
import { PageHeader } from '@/components/ui';
import { COLORS, RESPONSIVE } from '@/utils/designSystem';
import { ParkingHistorySection } from './ParkingHistorySection';

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

  return (
    <div className="flex flex-1 flex-col gap-4 max-w-2xl">
      <PageHeader icon={<CarIcon />} title={t('hub_title')} className="mb-0" />
      <p className={`${COLORS.text.secondary} leading-relaxed ${RESPONSIVE.text.body}`}>
        {t('hub_description')}
      </p>

      <section>
        <h2 className={`text-lg font-semibold ${COLORS.text.primary} mb-3`}>{t('history_title')}</h2>
        <Suspense fallback={<ParkingHistoryListSkeleton count={3} />}>
          <ParkingHistorySection locale={locale} />
        </Suspense>
      </section>
    </div>
  );
}
