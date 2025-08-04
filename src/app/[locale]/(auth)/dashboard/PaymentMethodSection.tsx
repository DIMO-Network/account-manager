import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { PageHeader } from '@/components/ui';
import { PaymentMethodContent } from './PaymentMethodContent';

// Server component for static header
function PaymentMethodHeader() {
  return (
    <PageHeader
      icon={<WalletIcon />}
      title="Payment Method"
      className="lg:hidden"
    />
  );
}

// Server component for static note
function PaymentMethodNote() {
  return <PaymentMethodsNote />;
}

export function PaymentMethodSection() {
  return (
    <div className="flex flex-col gap-4 lg:w-1/4 w-full order-1 lg:order-2">
      <PaymentMethodHeader />
      <PaymentMethodContent />
      <PaymentMethodNote />
    </div>
  );
}
