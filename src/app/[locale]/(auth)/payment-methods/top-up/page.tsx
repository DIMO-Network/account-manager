import { Suspense } from 'react';
import { DimoAuthWrapper } from '@/components/auth/DimoAuthWrapper';
import { TopUpPageClient } from './TopUpPageClient';

export default function TopUpPage() {
  return (
    <DimoAuthWrapper>
      <Suspense
        fallback={(
          <div className="space-y-8 p-6">
            <div className="animate-pulse bg-gray-900 rounded mb-4"></div>
            <div className="animate-pulse bg-gray-900 h-32"></div>
          </div>
        )}
      >
        <TopUpPageClient />
      </Suspense>
    </DimoAuthWrapper>
  );
}
