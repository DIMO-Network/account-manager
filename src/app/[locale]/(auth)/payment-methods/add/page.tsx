'use client';

import { useRouter } from 'next/navigation';
import { WalletIcon } from '@/components/Icons';
import { AddCardForm } from '@/components/payment/AddCardForm';
import { PageHeader } from '@/components/ui';

export default function AddPaymentMethodPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col flex-1 gap-4">
      <PageHeader icon={<WalletIcon />} title="Add a Card" />

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
