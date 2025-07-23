import { BORDER_RADIUS } from '@/utils/designSystem';

export function PaymentMethodsNote() {
  return (
    <div className={`flex flex-col ${BORDER_RADIUS.lg} bg-surface-default py-3 px-4 lg:block`}>
      <h3 className="text-base font-medium leading-6">Note</h3>
      <p className="text-xs text-text-secondary font-light leading-4.5 mt-1">
        Payment methods are automatically saved when you activate subscriptions.
        Your default payment method will be used for automatic renewals.
      </p>
    </div>
  );
}
