'use client';

import { useRouter } from 'next/navigation';
import { WalletIcon } from '@/components/Icons';
import { TopUpForm } from '@/components/payment/TopUpForm';
import { COLORS } from '@/utils/designSystem';

export default function TopUpPage() {
  const router = useRouter();

  return (
    <div className="py-5">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 mb-6">
        <WalletIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Top Up Credits</h1>
      </div>

      <TopUpForm
        onSuccessAction={() => {
          router.push('/payment-methods');
        }}
        onCancelAction={() => {
          router.push('/payment-methods');
        }}
      />
    </div>
  );
}
