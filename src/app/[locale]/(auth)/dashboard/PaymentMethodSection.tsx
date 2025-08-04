'use client';

import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { PageHeader } from '@/components/ui';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { PaymentMethodClient } from '../subscriptions/PaymentMethodClient';
import { PaymentMethodButtons } from './PaymentMethodButtons';

export function PaymentMethodSection() {
  return (
    <div className="flex flex-col gap-4 lg:w-1/4 w-full order-1 lg:order-2">
      <PageHeader
        icon={<WalletIcon />}
        title="Payment Method"
        className="lg:hidden"
      />
      <div className={`flex flex-col justify-between ${BORDER_RADIUS.lg} ${COLORS.background.primary} py-3 px-4 lg:block min-h-24`}>
        <div className="flex flex-col">
          <div className="mb-4 hidden lg:block">
            <WalletIcon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <PaymentMethodClient />
          </div>
        </div>
        <PaymentMethodButtons />
      </div>
      <PaymentMethodsNote />
    </div>
  );
}
