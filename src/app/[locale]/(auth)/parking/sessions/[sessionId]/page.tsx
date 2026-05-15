import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
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

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link href="/parking/" className="text-sm text-text-secondary hover:text-text-primary underline">
          {t('back_to_parking')}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-text-primary">{t('session_title')}</h1>
      <p className="text-text-secondary leading-relaxed">
        {t('session_description')}
        {' '}
        <span className="font-mono text-text-primary">{sessionId}</span>
      </p>
    </div>
  );
}
