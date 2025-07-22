'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { WalletIcon } from '@/components/Icons';
import { EditCardForm } from '@/components/payment/EditCardForm';
import { COLORS } from '@/utils/designSystem';

export default function EditPaymentMethodPage() {
  const router = useRouter();
  const { cardId } = useParams();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');

  if (!cardId || !customerId) {
    return <div className="p-8 text-center text-red-500">Missing required parameters.</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 mb-6">
        <WalletIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Edit Card</h1>
      </div>

      <EditCardForm
        cardId={cardId as string}
        customerId={customerId}
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
