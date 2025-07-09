'use client';

import { useRouter } from 'next/navigation';
import { WalletIcon } from '@/components/Icons';
import { AddCardForm } from '@/components/payment/AddCardForm';
import { COLORS } from '@/utils/designSystem';

export default function AddPaymentMethodPage() {
  const router = useRouter();

  return (
    <div className="py-5">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 mb-6">
        <WalletIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Add a Card</h1>
      </div>

      <AddCardForm
        onSuccess={() => {
          router.push('/payment-methods');
        }}
        onCancel={() => {
          router.push('/payment-methods');
        }}
      />
    </div>
  );
}
