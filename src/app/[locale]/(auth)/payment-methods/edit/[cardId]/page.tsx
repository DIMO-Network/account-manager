'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { WalletIcon } from '@/components/Icons';
import { EditCardForm } from '@/components/payment/EditCardForm';
import { PageHeader } from '@/components/ui';

export default function EditPaymentMethodPage() {
  const router = useRouter();
  const { cardId } = useParams();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');

  if (!cardId || !customerId) {
    return <div className="p-8 text-center text-red-500">Missing required parameters.</div>;
  }

  return (
    <div className="flex flex-col flex-1 gap-4">
      <PageHeader icon={<WalletIcon />} title="Edit Card" />

      <EditCardForm
        cardId={cardId as string}
        customerId={customerId}
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
