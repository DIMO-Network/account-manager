import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { DimoAuthWrapper } from '@/components/auth/DimoAuthWrapper';
import { SignInContent } from '@/components/auth/SignInContent';

type ISignInPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: ISignInPageProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'SignIn',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignInPage(props: ISignInPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <DimoAuthWrapper>
      <Suspense
        fallback={(
          <div className="space-y-8">
            <div className="animate-pulse bg-gray-200 h-8 rounded mb-4"></div>
            <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
          </div>
        )}
      >
        <SignInContent />
      </Suspense>
    </DimoAuthWrapper>
  );
}
