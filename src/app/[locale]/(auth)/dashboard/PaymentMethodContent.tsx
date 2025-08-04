'use client';

import { WalletIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { PaymentMethodClient } from '../subscriptions/PaymentMethodClient';
import { PaymentMethodButtons } from './PaymentMethodButtons';

export function PaymentMethodContent() {
  return (
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
  );
}
