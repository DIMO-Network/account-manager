import { getTranslations } from 'next-intl/server';
import { DimoVehicles } from '@/components/DimoVehicles';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Vehicles',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function Vehicles() {
  return (
    <div className="py-5 [&_p]:my-6">
      <DimoVehicles />
    </div>
  );
}
